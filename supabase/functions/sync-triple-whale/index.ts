import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRANDS = [
  {
    brand: "feel_ink",
    shopDomain: "p9wgk9-d0.myshopify.com",
    apiKeyEnv: "TRIPLE_WHALE_API_KEY_FEELINK",
  },
  {
    brand: "skinglow",
    shopDomain: "713524-04.myshopify.com",
    apiKeyEnv: "TRIPLE_WHALE_API_KEY_SKINGLOW",
  },
];

const channelMap: Record<string, string> = {
  facebook: "Meta",
  "facebook-ads": "Meta",
  facebookads: "Meta",
  meta: "Meta",
  google: "Google",
  "google-ads": "Google",
  googleads: "Google",
  tiktok: "TikTok Ads",
  "tiktok-ads": "TikTok Ads",
  tiktokads: "TikTok Ads",
  snapchat: "Snapchat",
  pinterest: "Pinterest",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = body.start || yesterday.toISOString().split("T")[0];
    const endDate = body.end || startDate;
    const targetBrand = body.brand; // optional: sync only one brand

    const results: any[] = [];

    for (const { brand, shopDomain, apiKeyEnv } of BRANDS) {
      if (targetBrand && targetBrand !== brand) continue;

      const twApiKey = Deno.env.get(apiKeyEnv);
      if (!twApiKey) {
        results.push({ brand, error: `${apiKeyEnv} not configured` });
        continue;
      }

      // Validate API key
      const meRes = await fetch("https://api.triplewhale.com/api/v2/users/api-keys/me", {
        headers: { "x-api-key": twApiKey },
      });
      if (!meRes.ok) {
        results.push({ brand, error: `API key invalid: ${meRes.status}` });
        continue;
      }

      // Fetch summary data
      const twBody = {
        shopDomain,
        period: { start: startDate, end: endDate },
        todayHour: 23,
      };

      console.log(`[${brand}] Requesting TW:`, JSON.stringify(twBody));

      const twRes = await fetch("https://api.triplewhale.com/api/v2/summary-page/get-data", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": twApiKey },
        body: JSON.stringify(twBody),
      });

      if (!twRes.ok) {
        const errText = await twRes.text();
        results.push({ brand, error: `TW API ${twRes.status}`, details: errText });
        continue;
      }

      const twData = await twRes.json();
      console.log(`[${brand}] TW metrics count:`, Array.isArray(twData.metrics) ? twData.metrics.length : 'not array');
      
      // Log all metric IDs and their services
      if (Array.isArray(twData.metrics)) {
        for (const m of twData.metrics) {
          console.log(`[${brand}] metric: ${m.metricId} | services: ${JSON.stringify(m.services)} | value: ${JSON.stringify(m.values?.current)} | serviceBreakdown: ${JSON.stringify(m.serviceBreakdown || m.breakdown || m.perService)?.substring(0, 300)}`);
        }
      }

      // Parse metrics array - TW summary-page returns metrics as array
      // Each metric: { metricId, services[], values: { current }, serviceBreakdown? }
      const channelData: Record<string, { revenue: number; spend: number; orders: number }> = {};

      if (Array.isArray(twData.metrics)) {
        for (const metric of twData.metrics) {
          const id = metric.metricId;
          const services = metric.services || [];
          const value = metric.values?.current || 0;

          // Map metric to our fields
          for (const svc of services) {
            const canal = channelMap[svc.toLowerCase()];
            if (!canal) continue;
            if (!channelData[canal]) channelData[canal] = { revenue: 0, spend: 0, orders: 0 };

            if (id === "totalSales" || id === "pixelRevenue" || id === "revenue") {
              channelData[canal].revenue = value;
            } else if (id === "adSpend" || id === "spend" || id === "totalSpend") {
              channelData[canal].spend = value;
            } else if (id === "totalOrders" || id === "orders" || id === "purchases") {
              channelData[canal].orders = value;
            }
          }
        }
      }

      const upsertRows: any[] = [];
      for (const [canal, data] of Object.entries(channelData)) {
        if (data.revenue > 0 || data.spend > 0 || data.orders > 0) {
          upsertRows.push({ brand, date: startDate, canal, ventas_brutas: data.revenue, pedidos: data.orders, anuncios: data.spend, source: "triple_whale" });
        }
      }
      // Upsert to daily_metrics
      let upserted = 0;
      for (const row of upsertRows) {
        const { data: existing } = await supabase
          .from("daily_metrics")
          .select("id")
          .eq("brand", row.brand)
          .eq("date", row.date)
          .eq("canal", row.canal)
          .maybeSingle();

        if (existing) {
          await supabase.from("daily_metrics").update({
            ventas_brutas: row.ventas_brutas,
            pedidos: row.pedidos,
            anuncios: row.anuncios,
            source: "triple_whale",
          }).eq("id", existing.id);
        } else {
          await supabase.from("daily_metrics").insert(row);
        }
        upserted++;
      }

      results.push({ brand, synced: upserted, date: startDate, rawKeys: Object.keys(twData || {}) });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sync-triple-whale error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
