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
    if (!twApiKey) {
      return new Response(
        JSON.stringify({ error: "Triple Whale API key not configured. Please add it in Configuración." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const brands = body.brands || ["feel_ink", "skinglow"];

    // Get yesterday's date for sync
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];

    // Fetch data from Triple Whale API
    const twResponse = await fetch("https://api.triplewhale.com/api/v2/tw-metrics/metrics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": twApiKey,
      },
      body: JSON.stringify({
        start: dateStr,
        end: dateStr,
        period: "day",
        metrics: [
          "totalSales", "totalOrders", "adSpend",
          "metaSpend", "metaRevenue",
          "tiktokSpend", "tiktokRevenue",
          "googleSpend", "googleRevenue",
        ],
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

    // Map Triple Whale data to daily_metrics rows
    // This is a template — the exact mapping depends on TW API response structure
    const channelMappings = [
      { canal: "Meta", spendKey: "metaSpend", revenueKey: "metaRevenue" },
      { canal: "Google", spendKey: "googleSpend", revenueKey: "googleRevenue" },
      { canal: "TikTok Ads", spendKey: "tiktokSpend", revenueKey: "tiktokRevenue" },
    ];

    const upsertRows: any[] = [];

    for (const brand of brands) {
      for (const mapping of channelMappings) {
        upsertRows.push({
          brand,
          date: dateStr,
          canal: mapping.canal,
          ventas_brutas: twData?.[mapping.revenueKey] || 0,
          anuncios: twData?.[mapping.spendKey] || 0,
          source: "triple_whale",
        });
      }
    }

    if (upsertRows.length > 0) {
      const { error } = await supabase
        .from("daily_metrics")
        .upsert(upsertRows, { onConflict: "brand,date,canal" });

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to upsert metrics", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: upsertRows.length,
        date: dateStr,
        message: `Synced ${upsertRows.length} rows for ${dateStr}`,
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
