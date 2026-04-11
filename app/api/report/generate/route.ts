import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildReportPrompt, streamReport } from "@/lib/claude";
import { formatMXN, formatPercent } from "@/lib/format";

interface GenerateBody {
  brandId: string;
  startDate: string;
  endDate: string;
  reportType: string;
}

function buildFinancialSummary(
  dailyRows: Array<Record<string, unknown>>
): string {
  if (dailyRows.length === 0) return "No hay datos financieros disponibles.";

  interface FinancialTotals {
    gmv: number;
    refunds: number;
    gmvCofunding: number;
    itemsSold: number;
    customers: number;
    orders: number;
    pageViews: number;
  }

  const totals = dailyRows.reduce<FinancialTotals>(
    (acc, row) => ({
      gmv: acc.gmv + (Number(row.gmv) || 0),
      refunds: acc.refunds + (Number(row.refunds) || 0),
      gmvCofunding:
        acc.gmvCofunding + (Number(row.gmv_with_cofunding) || 0),
      itemsSold: acc.itemsSold + (Number(row.items_sold) || 0),
      customers: acc.customers + (Number(row.unique_customers) || 0),
      orders: acc.orders + (Number(row.orders) || 0),
      pageViews: acc.pageViews + (Number(row.page_views) || 0),
    }),
    {
      gmv: 0,
      refunds: 0,
      gmvCofunding: 0,
      itemsSold: 0,
      customers: 0,
      orders: 0,
      pageViews: 0,
    }
  );

  const avgConversion =
    dailyRows.reduce((s, r) => s + (Number(r.conversion_rate) || 0), 0) /
    dailyRows.length;

  return [
    `GMV total: ${formatMXN(totals.gmv)}`,
    `Reembolsos: ${formatMXN(totals.refunds)}`,
    `GMV con cofunding: ${formatMXN(totals.gmvCofunding)}`,
    `Items vendidos: ${totals.itemsSold}`,
    `Clientes unicos: ${totals.customers}`,
    `Ordenes: ${totals.orders}`,
    `Vistas de pagina: ${totals.pageViews}`,
    `Conversion rate promedio: ${formatPercent(avgConversion)}`,
    `Dias analizados: ${dailyRows.length}`,
  ].join("\n");
}

function buildCampaignSummary(
  productCampaigns: Array<Record<string, unknown>>,
  liveCampaigns: Array<Record<string, unknown>>
): string {
  const lines: string[] = [];

  if (productCampaigns.length > 0) {
    lines.push("--- Campanas GMV Max (Producto) ---");
    for (const c of productCampaigns) {
      lines.push(
        `${c.campaign_name}: Costo ${formatMXN(Number(c.cost) || 0)}, ` +
          `Revenue ${formatMXN(Number(c.gross_revenue) || 0)}, ` +
          `ROI ${Number(c.roi) || 0}x, ` +
          `Ordenes ${c.sku_orders}, ` +
          `CPO ${formatMXN(Number(c.cost_per_order) || 0)}`
      );
    }
  }

  if (liveCampaigns.length > 0) {
    lines.push("--- Campanas Lives ---");
    for (const c of liveCampaigns) {
      lines.push(
        `${c.campaign_name}: Costo ${formatMXN(Number(c.cost) || 0)}, ` +
          `Revenue ${formatMXN(Number(c.gross_revenue) || 0)}, ` +
          `ROI ${Number(c.roi) || 0}x, ` +
          `Ordenes ${c.sku_orders}, ` +
          `Live views ${c.live_views}, ` +
          `CPO ${formatMXN(Number(c.cost_per_order) || 0)}`
      );
    }
  }

  return lines.length > 0
    ? lines.join("\n")
    : "No hay datos de campanas disponibles.";
}

function buildCreativeSummary(
  creatives: Array<Record<string, unknown>>
): string {
  if (creatives.length === 0) return "No hay datos de creativos disponibles.";

  const sorted = [...creatives].sort(
    (a, b) => (Number(b.gross_revenue) || 0) - (Number(a.gross_revenue) || 0)
  );
  const top = sorted.slice(0, 15);

  return top
    .map(
      (c) =>
        `"${c.video_title}" (${c.tiktok_account}): ` +
        `Revenue ${formatMXN(Number(c.gross_revenue) || 0)}, ` +
        `ROI ${Number(c.roi) || 0}x, ` +
        `Costo ${formatMXN(Number(c.cost) || 0)}, ` +
        `Impressions ${c.impressions}, ` +
        `CTR ${formatPercent(Number(c.click_rate) || 0)}, ` +
        `CVR ${formatPercent(Number(c.ad_conversion_rate) || 0)}, ` +
        `VR 2s ${formatPercent(Number(c.view_rate_2s) || 0)}, ` +
        `VR 6s ${formatPercent(Number(c.view_rate_6s) || 0)}`
    )
    .join("\n");
}

function buildAffiliateSummary(
  affiliateMetrics: Array<Record<string, unknown>>,
  creators: Array<Record<string, unknown>>
): string {
  const lines: string[] = [];

  if (affiliateMetrics.length > 0) {
    interface AffiliateTotals {
      gmv: number;
      items: number;
      commission: number;
      videos: number;
      liveStreams: number;
      samplesSent: number;
    }

    const agg = affiliateMetrics.reduce<AffiliateTotals>(
      (acc, r) => ({
        gmv: acc.gmv + (Number(r.gmv_affiliates) || 0),
        items: acc.items + (Number(r.affiliate_items_sold) || 0),
        commission: acc.commission + (Number(r.estimated_commission) || 0),
        videos: acc.videos + (Number(r.videos) || 0),
        liveStreams: acc.liveStreams + (Number(r.live_streams) || 0),
        samplesSent: acc.samplesSent + (Number(r.samples_sent) || 0),
      }),
      { gmv: 0, items: 0, commission: 0, videos: 0, liveStreams: 0, samplesSent: 0 }
    );

    lines.push(
      `GMV afiliados: ${formatMXN(agg.gmv)}`,
      `Items vendidos: ${agg.items}`,
      `Comision estimada: ${formatMXN(agg.commission)}`,
      `Videos: ${agg.videos}`,
      `Lives: ${agg.liveStreams}`,
      `Muestras enviadas: ${agg.samplesSent}`
    );
  }

  if (creators.length > 0) {
    const topCreators = [...creators]
      .sort((a, b) => (Number(b.gmv) || 0) - (Number(a.gmv) || 0))
      .slice(0, 10);

    lines.push("\n--- Top Creadores ---");
    for (const c of topCreators) {
      lines.push(
        `${c.creator_name}: GMV ${formatMXN(Number(c.gmv) || 0)}, ` +
          `Ordenes ${c.attributed_orders}, ` +
          `Videos ${c.videos}, ` +
          `Lives ${c.live_streams}, ` +
          `Comision ${formatMXN(Number(c.estimated_commission) || 0)}`
      );
    }
  }

  return lines.length > 0
    ? lines.join("\n")
    : "No hay datos de afiliados disponibles.";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateBody;
    const { brandId, startDate, endDate, reportType } = body;

    if (!brandId || !startDate || !endDate || !reportType) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    const [
      brandResult,
      dailyResult,
      productCampaignResult,
      liveCampaignResult,
      creativeResult,
      affiliateResult,
      creatorResult,
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
        .gte("period_start", startDate)
        .lte("period_end", endDate),
      supabase
        .from("live_campaigns")
        .select("*")
        .eq("brand_id", brandId)
        .gte("period_start", startDate)
        .lte("period_end", endDate),
      supabase
        .from("creatives")
        .select("*")
        .eq("brand_id", brandId)
        .gte("period_start", startDate)
        .lte("period_end", endDate),
      supabase
        .from("affiliate_metrics")
        .select("*")
        .eq("brand_id", brandId)
        .gte("period_start", startDate)
        .lte("period_end", endDate),
      supabase
        .from("creators")
        .select("*")
        .eq("brand_id", brandId)
        .gte("period_start", startDate)
        .lte("period_end", endDate),
    ]);

    if (brandResult.error || !brandResult.data) {
      return Response.json({ error: "Brand not found" }, { status: 404 });
    }

    const brand = brandResult.data;
    const financialSummary = buildFinancialSummary(dailyResult.data || []);
    const campaignSummary = buildCampaignSummary(
      productCampaignResult.data || [],
      liveCampaignResult.data || []
    );
    const creativeSummary = buildCreativeSummary(creativeResult.data || []);
    const affiliateSummary = buildAffiliateSummary(
      affiliateResult.data || [],
      creatorResult.data || []
    );

    const prompt = buildReportPrompt(
      brand.name,
      startDate,
      endDate,
      financialSummary,
      campaignSummary,
      creativeSummary,
      affiliateSummary
    );

    let fullReport = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamReport(prompt)) {
            fullReport += chunk;
            controller.enqueue(new TextEncoder().encode(chunk));
          }

          // Save the completed report to ai_reports table
          await supabase.from("ai_reports").insert({
            brand_id: brandId,
            report_type: reportType,
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
    console.error("Report generation error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
