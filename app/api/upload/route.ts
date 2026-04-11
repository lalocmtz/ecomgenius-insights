import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { parseOverview } from "@/lib/parsers/parseOverview";
import { parseProducts } from "@/lib/parsers/parseProducts";
import { parseVideoPerformance } from "@/lib/parsers/parseVideoPerformance";
import { parseProductCampaigns } from "@/lib/parsers/parseProductCampaigns";
import { parseLiveCampaigns } from "@/lib/parsers/parseLiveCampaigns";
import { parseCreatives } from "@/lib/parsers/parseCreatives";
import { parseAffiliateMetrics } from "@/lib/parsers/parseAffiliateMetrics";
import { parseCreatorList } from "@/lib/parsers/parseCreatorList";
import { parseProductTraffic } from "@/lib/parsers/parseProductTraffic";
import type { FileType } from "@/components/upload/FileTypeMapper";

const TABLE_MAP: Record<FileType, string> = {
  overview: "daily_overview",
  product_traffic: "product_traffic",
  products: "products",
  video_performance: "video_performance",
  creatives: "creatives",
  live_campaigns: "live_campaigns",
  product_campaigns: "product_campaigns",
  affiliate_metrics: "affiliate_metrics",
  creators: "creators",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParserFn = (buffer: Buffer) => any[];

const PARSERS: Record<FileType, ParserFn> = {
  overview: parseOverview,
  product_traffic: parseProductTraffic,
  products: parseProducts,
  video_performance: parseVideoPerformance,
  creatives: parseCreatives,
  live_campaigns: parseLiveCampaigns,
  product_campaigns: parseProductCampaigns,
  affiliate_metrics: parseAffiliateMetrics,
  creators: parseCreatorList,
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const brandId = formData.get("brandId") as string | null;
    const fileType = formData.get("fileType") as FileType | null;

    if (!file || !brandId || !fileType) {
      return Response.json(
        { success: false, error: "Missing file, brandId, or fileType" },
        { status: 400 }
      );
    }

    if (!TABLE_MAP[fileType]) {
      return Response.json(
        { success: false, error: `Unknown file type: ${fileType}` },
        { status: 400 }
      );
    }

    const parser = PARSERS[fileType];
    if (!parser) {
      return Response.json(
        { success: false, error: `No parser for file type: ${fileType}` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const rows = parser(buffer);

    if (!rows.length) {
      return Response.json(
        { success: false, error: "No data rows found in file" },
        { status: 400 }
      );
    }

    // Add brand_id and uploaded_at to each row
    const now = new Date().toISOString();
    const enrichedRows = rows.map((row) => ({
      ...row,
      brand_id: brandId,
      uploaded_at: now,
    }));

    const supabase = createServerSupabase();
    const tableName = TABLE_MAP[fileType];

    // Upsert in batches of 500
    const batchSize = 500;
    let totalProcessed = 0;
    const errors: string[] = [];

    for (let i = 0; i < enrichedRows.length; i += batchSize) {
      const batch = enrichedRows.slice(i, i + batchSize);
      const { error } = await supabase.from(tableName).upsert(batch);

      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        totalProcessed += batch.length;
      }
    }

    return Response.json({
      success: errors.length === 0,
      rowsProcessed: totalProcessed,
      errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { success: false, error: message, rowsProcessed: 0, errors: [message] },
      { status: 500 }
    );
  }
}
