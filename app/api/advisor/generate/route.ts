import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildAdvisorPrompt } from "@/lib/advisor-prompt";
import { streamReport } from "@/lib/claude";

interface GenerateBody {
  brandId: string;
  startDate: string;
  endDate: string;
  analysisType: "full" | "campaigns" | "team";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateBody;
    const { brandId, startDate, endDate, analysisType } = body;

    if (!brandId || !startDate || !endDate) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Fetch all data in parallel
    const [
      brandResult,
      dailyResult,
      productCampaignResult,
      liveCampaignResult,
      creativeResult,
      affiliateResult,
      creatorResult,
      teamResult,
      fixedCostsResult,
    ] = await Promise.all([
      supabase.from("brands").select("*").eq("id", brandId).single(),
      supabase
        .from("daily_overview")
        .select("*")
        .eq("brand_id", brandId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true }),
      supabase
        .from("product_campaigns")
        .select("*")
        .eq("brand_id", brandId)
        .or(`and(period_start.lte.${endDate},period_end.gte.${startDate}),period_start.is.null`),
      supabase
        .from("live_campaigns")
        .select("*")
        .eq("brand_id", brandId)
        .or(`and(period_start.lte.${endDate},period_end.gte.${startDate}),period_start.is.null`),
      supabase
        .from("creatives")
        .select("*")
        .eq("brand_id", brandId)
        .or(`and(period_start.lte.${endDate},period_end.gte.${startDate}),period_start.is.null`),
      supabase
        .from("affiliate_metrics")
        .select("*")
        .eq("brand_id", brandId)
        .or(`and(period_start.lte.${endDate},period_end.gte.${startDate}),period_start.is.null`),
      supabase
        .from("creators")
        .select("*")
        .eq("brand_id", brandId)
        .or(`and(period_start.lte.${endDate},period_end.gte.${startDate}),period_start.is.null`)
        .order("gmv", { ascending: false }),
      supabase
        .from("team_members")
        .select("*")
        .eq("brand_id", brandId)
        .eq("active", true),
      supabase
        .from("fixed_costs")
        .select("*")
        .eq("brand_id", brandId)
        .eq("active", true),
    ]);

    if (brandResult.error || !brandResult.data) {
      return Response.json({ error: "Brand not found" }, { status: 404 });
    }

    const brand = brandResult.data;
    const daily = dailyResult.data ?? [];
    const productCampaigns = productCampaignResult.data ?? [];
    const liveCampaigns = liveCampaignResult.data ?? [];
    const creatives = creativeResult.data ?? [];
    const affiliateMetrics = affiliateResult.data ?? [];
    const creators = creatorResult.data ?? [];
    const team = teamResult.data ?? [];
    const fixedCosts = fixedCostsResult.data ?? [];

    // Compute aggregates
    const totalGmv = daily.reduce((s, d) => s + (Number(d.gmv) || 0), 0);
    const totalRefunds = daily.reduce((s, d) => s + (Number(d.refunds) || 0), 0);
    const totalOrders = daily.reduce((s, d) => s + (Number(d.orders) || 0), 0);
    const totalCustomers = daily.reduce((s, d) => s + (Number(d.unique_customers) || 0), 0);
    const aov = totalOrders > 0 ? totalGmv / totalOrders : 0;
    const refundRate = totalGmv > 0 ? (totalRefunds / totalGmv) * 100 : 0;

    const gmvMaxSpend = productCampaigns.reduce((s, c) => s + (Number(c.cost) || 0), 0);
    const gmvMaxRevenue = productCampaigns.reduce((s, c) => s + (Number(c.gross_revenue) || 0), 0);
    const gmvMaxRoi = gmvMaxSpend > 0 ? gmvMaxRevenue / gmvMaxSpend : 0;

    const livesSpend = liveCampaigns.reduce((s, c) => s + (Number(c.cost) || 0), 0);
    const livesRevenue = liveCampaigns.reduce((s, c) => s + (Number(c.gross_revenue) || 0), 0);
    const livesRoi = livesSpend > 0 ? livesRevenue / livesSpend : 0;

    const totalAdSpend = gmvMaxSpend + livesSpend;
    const roasBlended = totalAdSpend > 0 ? totalGmv / totalAdSpend : 0;

    const productCostPct = brand.product_cost_pct ?? 12;
    const productCost = totalGmv * (productCostPct / 100);
    const affiliatesCost = totalGmv * ((brand.commission_affiliates ?? 6) / 100);
    const ttCommission = totalGmv * ((brand.commission_tiktok ?? 8) / 100);
    const baseImponible = totalGmv * (1 - (brand.commission_tiktok ?? 8) / 100 - (brand.commission_affiliates ?? 6) / 100);
    const taxRetention = baseImponible * 0.105;
    const ivaAds = totalAdSpend * ((brand.iva_ads_pct ?? 16) / 100);

    const grossMargin = totalGmv - totalRefunds - productCost - affiliatesCost - ttCommission - taxRetention - totalAdSpend - ivaAds;
    const grossMarginPct = totalGmv > 0 ? (grossMargin / totalGmv) * 100 : 0;

    const totalTeamCost = team.reduce((s, t) => s + (Number(t.cost_monthly) || 0), 0);
    const totalOpsCost = fixedCosts.reduce((s, c) => s + (Number(c.amount_monthly) || 0), 0);
    const totalFixedCosts = totalTeamCost + totalOpsCost;
    const netProfit = grossMargin - totalFixedCosts;
    const netMarginPct = totalGmv > 0 ? (netProfit / totalGmv) * 100 : 0;

    // Top/worst creatives
    const sortedCreatives = [...creatives].sort(
      (a, b) => (Number(b.roi) || 0) - (Number(a.roi) || 0)
    );
    const topCreatives = sortedCreatives.slice(0, 5);
    const worstCreatives = [...creatives]
      .filter((c) => (Number(c.cost) || 0) > 0)
      .sort((a, b) => (Number(a.roi) || 0) - (Number(b.roi) || 0))
      .slice(0, 3);

    // Affiliate data
    const affiliateGmv = affiliateMetrics.reduce((s, m) => s + (Number(m.gmv_affiliates) || 0), 0);
    const topCreator = creators.length > 0 ? creators[0] : null;
    const estimatedCommission = affiliateMetrics.reduce((s, m) => s + (Number(m.estimated_commission) || 0), 0);

    const context = {
      brandName: brand.name,
      period: `${startDate} a ${endDate}`,
      gmv: totalGmv,
      refunds: totalRefunds,
      refundRate,
      orders: totalOrders,
      aov,
      uniqueCustomers: totalCustomers,
      totalAdSpend,
      roasBlended,
      gmvMaxSpend,
      gmvMaxRoi,
      livesSpend,
      livesRoi,
      productCostPct,
      productCost,
      affiliatesCost,
      ttCommission,
      taxRetention,
      ivaAds,
      grossMargin,
      grossMarginPct,
      team,
      fixedCosts,
      totalTeamCost,
      totalOpsCost,
      totalFixedCosts,
      netProfit,
      netMarginPct,
      topCreatives,
      worstCreatives,
      affiliateGmv,
      topCreator: topCreator?.creator_name ?? "N/A",
      topCreatorGmv: topCreator ? Number(topCreator.gmv) || 0 : 0,
      estimatedCommission,
    };

    const prompt = buildAdvisorPrompt(context);

    let fullReport = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamReport(prompt)) {
            fullReport += chunk;
            controller.enqueue(new TextEncoder().encode(chunk));
          }

          // Save the completed report
          await supabase.from("ai_reports").insert({
            brand_id: brandId,
            report_type: `advisor_${analysisType}`,
            period_start: startDate,
            period_end: endDate,
            prompt_used: prompt,
            report_content: fullReport,
          });

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Advisor generation error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
