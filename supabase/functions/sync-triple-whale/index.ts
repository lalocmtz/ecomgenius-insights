import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRANDS = [
  { brand: "feel_ink", shopDomain: "p9wgk9-d0.myshopify.com", apiKeyEnv: "TRIPLE_WHALE_API_KEY_FEELINK" },
  { brand: "skinglow", shopDomain: "713524-04.myshopify.com", apiKeyEnv: "TRIPLE_WHALE_API_KEY_SKINGLOW" },
];

// Map TW metricId → { canal, field }
const METRIC_MAP: Record<string, { canal: string; field: "ventas_brutas" | "anuncios" | "pedidos" }> = {
  // Meta (Facebook Ads)
  facebookConversionValue: { canal: "Meta", field: "ventas_brutas" },
  fb_ads_spend: { canal: "Meta", field: "anuncios" },
  facebookPurchases: { canal: "Meta", field: "pedidos" },
  // Google Ads
  googleConversionValue: { canal: "Google", field: "ventas_brutas" },
  ga_adCost: { canal: "Google", field: "anuncios" },
  ga_all_transactions_adGroup: { canal: "Google", field: "pedidos" },
  // Shopify totals → canal "Shopify"
  totalSales: { canal: "Shopify", field: "ventas_brutas" },
  totalOrders: { canal: "Shopify", field: "pedidos" },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json().catch(() => ({}));
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = body.start || yesterday.toISOString().split("T")[0];
    const endDate = body.end || startDate;
    const targetBrand = body.brand;

    const results: any[] = [];

    for (const { brand, shopDomain, apiKeyEnv } of BRANDS) {
      if (targetBrand && targetBrand !== brand) continue;

      const twApiKey = Deno.env.get(apiKeyEnv);
      if (!twApiKey) {
        results.push({ brand, error: `${apiKeyEnv} not configured` });
        continue;
      }

      // Fetch summary data
      const twRes = await fetch("https://api.triplewhale.com/api/v2/summary-page/get-data", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": twApiKey },
        body: JSON.stringify({ shopDomain, period: { start: startDate, end: endDate }, todayHour: 23 }),
      });

      if (!twRes.ok) {
        const errText = await twRes.text();
        results.push({ brand, error: `TW API ${twRes.status}`, details: errText });
        continue;
      }

      const twData = await twRes.json();
      const metrics = twData.metrics;

      if (!Array.isArray(metrics)) {
        results.push({ brand, error: "No metrics array in response", keys: Object.keys(twData || {}) });
        continue;
      }

      // Build channel data from known metrics
      const channelData: Record<string, { ventas_brutas: number; anuncios: number; pedidos: number }> = {};

      for (const m of metrics) {
        const mapping = METRIC_MAP[m.metricId];
        if (!mapping) continue;
        const value = m.values?.current || 0;
        if (!channelData[mapping.canal]) channelData[mapping.canal] = { ventas_brutas: 0, anuncios: 0, pedidos: 0 };
        channelData[mapping.canal][mapping.field] = value;
      }

      console.log(`[${brand}] Parsed channels:`, JSON.stringify(channelData));

      // Upsert to daily_metrics
      let upserted = 0;
      for (const [canal, data] of Object.entries(channelData)) {
        if (data.ventas_brutas === 0 && data.anuncios === 0 && data.pedidos === 0) continue;

        const { data: existing } = await supabase
          .from("daily_metrics")
          .select("id")
          .eq("brand", brand)
          .eq("date", startDate)
          .eq("canal", canal)
          .maybeSingle();

        const row = { ventas_brutas: data.ventas_brutas, pedidos: data.pedidos, anuncios: data.anuncios, source: "triple_whale" };

        if (existing) {
          await supabase.from("daily_metrics").update(row).eq("id", existing.id);
        } else {
          await supabase.from("daily_metrics").insert({ ...row, brand, date: startDate, canal });
        }
        upserted++;
      }

      results.push({ brand, synced: upserted, date: startDate, channels: Object.keys(channelData) });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sync-triple-whale error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
