import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const twApiKey = Deno.env.get("TRIPLE_WHALE_API_KEY");
    const twShop = Deno.env.get("TRIPLE_WHALE_SHOP");

    if (!twApiKey) {
      return new Response(
        JSON.stringify({ error: "Triple Whale API key not configured." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!twShop) {
      return new Response(
        JSON.stringify({ error: "Triple Whale shop URL not configured. Add TRIPLE_WHALE_SHOP secret (e.g. 'your-store.myshopify.com')." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const brand = body.brand || "feel_ink";

    // Date range: yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];

    // Use Triple Whale Summary Page endpoint
    const twResponse = await fetch("https://api.triplewhale.com/api/v2/summary-page/get-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": twApiKey,
      },
      body: JSON.stringify({
        shop: twShop,
        start: dateStr,
        end: dateStr,
      }),
    });

    if (!twResponse.ok) {
      const errText = await twResponse.text();
      return new Response(
        JSON.stringify({ error: `Triple Whale API error: ${twResponse.status}`, details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const twData = await twResponse.json();
    console.log("Triple Whale response keys:", Object.keys(twData));

    // The summary-page/get-data response contains channel-level metrics
    // Structure varies — we extract what we can and upsert to daily_metrics
    const upsertRows: any[] = [];

    // Try to extract channel data from the TW response
    // TW typically returns data keyed by service/channel
    const channelMap: Record<string, string> = {
      "facebook": "Meta",
      "facebook-ads": "Meta",
      "meta": "Meta",
      "google": "Google",
      "google-ads": "Google",
      "tiktok": "TikTok Ads",
      "tiktok-ads": "TikTok Ads",
    };

    // Parse summary data - structure depends on TW response
    if (twData && typeof twData === "object") {
      // If the response has a 'data' or 'services' key with per-channel breakdowns
      const services = twData.data || twData.services || twData;

      for (const [key, value] of Object.entries(services)) {
        const canal = channelMap[key.toLowerCase()];
        if (canal && value && typeof value === "object") {
          const v = value as any;
          upsertRows.push({
            brand,
            date: dateStr,
            canal,
            ventas_brutas: v.totalSales || v.revenue || v.totalRevenue || 0,
            pedidos: v.totalOrders || v.orders || 0,
            anuncios: v.adSpend || v.spend || v.totalSpend || 0,
            source: "triple_whale",
          });
        }
      }
    }

    // If we got data, upsert it
    if (upsertRows.length > 0) {
      for (const row of upsertRows) {
        // Try to find existing row first
        const { data: existing } = await supabase
          .from("daily_metrics")
          .select("id")
          .eq("brand", row.brand)
          .eq("date", row.date)
          .eq("canal", row.canal)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("daily_metrics")
            .update({
              ventas_brutas: row.ventas_brutas,
              pedidos: row.pedidos,
              anuncios: row.anuncios,
              source: "triple_whale",
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("daily_metrics").insert(row);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: upsertRows.length,
        date: dateStr,
        rawKeys: Object.keys(twData || {}),
        message: upsertRows.length > 0
          ? `Synced ${upsertRows.length} channel rows for ${dateStr}`
          : `No channel data found in TW response. Check logs for response structure.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
