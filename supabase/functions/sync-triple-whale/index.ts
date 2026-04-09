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
        JSON.stringify({ error: "TRIPLE_WHALE_API_KEY not configured." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!twShop) {
      return new Response(
        JSON.stringify({ error: "TRIPLE_WHALE_SHOP not configured (e.g. 'your-store.myshopify.com')." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const brand = body.brand || "feel_ink";

    // Date range: default to yesterday, or accept custom dates
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startDate = body.start || yesterday.toISOString().split("T")[0];
    const endDate = body.end || startDate;

    // Current hour (1-25 range as per TW docs)
    const currentHour = now.getUTCHours() + 1;

    // --- Step 1: Verify API key works ---
    const meResponse = await fetch("https://api.triplewhale.com/api/v2/users/api-keys/me", {
      method: "GET",
      headers: {
        "x-api-key": twApiKey,
      },
    });

    if (!meResponse.ok) {
      const meErr = await meResponse.text();
      return new Response(
        JSON.stringify({ 
          error: `API key validation failed: ${meResponse.status}`, 
          details: meErr,
          hint: "Check that your TRIPLE_WHALE_API_KEY is valid and has 'Summary Page' scope enabled."
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const meData = await meResponse.json();
    console.log("API key validated. Shop:", JSON.stringify(meData));

    // --- Step 2: Fetch Summary Page data ---
    const twRequestBody = {
      shopDomain: twShop,
      period: {
        start: startDate,
        end: endDate,
      },
      todayHour: currentHour,
    };

    console.log("Requesting TW summary-page with:", JSON.stringify(twRequestBody));

    const twResponse = await fetch("https://api.triplewhale.com/api/v2/summary-page/get-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": twApiKey,
      },
      body: JSON.stringify(twRequestBody),
    });

    if (!twResponse.ok) {
      const errText = await twResponse.text();
      return new Response(
        JSON.stringify({ 
          error: `Triple Whale API error: ${twResponse.status}`, 
          details: errText,
          requestBody: twRequestBody,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const twData = await twResponse.json();
    console.log("TW response type:", typeof twData);
    console.log("TW response keys:", Object.keys(twData || {}));
    
    // Log a sample of the data structure for debugging
    const sampleKeys = Object.keys(twData || {}).slice(0, 5);
    for (const k of sampleKeys) {
      const val = twData[k];
      console.log(`TW[${k}]:`, typeof val === "object" ? JSON.stringify(val).substring(0, 200) : val);
    }

    // --- Step 3: Parse and map channel data ---
    const upsertRows: any[] = [];

    // Channel name mapping from TW service keys to our canal values
    const channelMap: Record<string, string> = {
      "facebook": "Meta",
      "facebook-ads": "Meta",
      "facebookAds": "Meta",
      "meta": "Meta",
      "google": "Google",
      "google-ads": "Google",
      "googleAds": "Google",
      "tiktok": "TikTok Ads",
      "tiktok-ads": "TikTok Ads",
      "tiktokAds": "TikTok Ads",
      "snapchat": "Snapchat",
      "pinterest": "Pinterest",
    };

    // TW summary-page returns data in various structures
    // Try multiple known patterns
    const dataContainers = [
      twData.data,
      twData.services,
      twData.channels,
      twData.summary,
      twData,
    ];

    for (const container of dataContainers) {
      if (!container || typeof container !== "object" || upsertRows.length > 0) continue;

      for (const [key, value] of Object.entries(container)) {
        const canal = channelMap[key.toLowerCase()] || channelMap[key];
        if (!canal || !value || typeof value !== "object") continue;

        const v = value as any;
        
        // Extract metrics - TW uses various field names
        const revenue = v.totalSales || v.revenue || v.totalRevenue || v.pixelRevenue || v.sales || 0;
        const spend = v.adSpend || v.spend || v.totalSpend || v.cost || 0;
        const orders = v.totalOrders || v.orders || v.purchases || v.conversions || 0;

        if (revenue > 0 || spend > 0 || orders > 0) {
          upsertRows.push({
            brand,
            date: startDate,
            canal,
            ventas_brutas: revenue,
            pedidos: orders,
            anuncios: spend,
            source: "triple_whale",
          });
        }
      }
    }

    // --- Step 4: Upsert to daily_metrics ---
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
      upserted++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: upserted,
        date: startDate,
        shop: twShop,
        rawResponseKeys: Object.keys(twData || {}),
        message: upserted > 0
          ? `Synced ${upserted} channel(s) for ${startDate}`
          : `No channel data matched. Raw keys: ${Object.keys(twData || {}).join(", ")}. Check logs for full response structure.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sync-triple-whale error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
