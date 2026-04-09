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
      console.log(`[${brand}] TW keys:`, Object.keys(twData || {}));

      // Parse channel data from various possible structures
      const upsertRows: any[] = [];
      const containers = [twData.data, twData.services, twData.channels, twData.summary, twData];

      for (const container of containers) {
        if (!container || typeof container !== "object" || upsertRows.length > 0) continue;
        for (const [key, value] of Object.entries(container)) {
          const canal = channelMap[key.toLowerCase()];
          if (!canal || !value || typeof value !== "object") continue;
          const v = value as any;
          const revenue = v.totalSales || v.revenue || v.totalRevenue || v.pixelRevenue || v.sales || 0;
          const spend = v.adSpend || v.spend || v.totalSpend || v.cost || 0;
          const orders = v.totalOrders || v.orders || v.purchases || v.conversions || 0;
          if (revenue > 0 || spend > 0 || orders > 0) {
            upsertRows.push({ brand, date: startDate, canal, ventas_brutas: revenue, pedidos: orders, anuncios: spend, source: "triple_whale" });
          }
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
