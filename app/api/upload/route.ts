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
import { extractPeriodFromFilename } from "@/lib/parsers/utils";
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

/**
 * Tables with unique(brand_id, date) constraint. These use upsert with
 * ON CONFLICT DO UPDATE to handle re-uploads cleanly.
 */
const DAILY_TABLES = new Set([
  "daily_overview",
  "video_performance",
  "product_traffic",
]);

/**
 * Tables without date-based unique constraints. For re-uploads, we delete
 * existing rows for the same brand_id + period, then insert fresh.
 */
const REPLACE_TABLES = new Set([
  "products",
  "creatives",
  "live_campaigns",
  "product_campaigns",
  "affiliate_metrics",
  "creators",
]);

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

    let rows: Record<string, unknown>[];
    try {
      rows = parser(buffer);
    } catch (parseErr) {
      const msg =
        parseErr instanceof Error ? parseErr.message : "Parse error";
      return Response.json(
        {
          success: false,
          error: `Failed to parse file: ${msg}`,
          rowsProcessed: 0,
          errors: [msg],
        },
        { status: 400 }
      );
    }

    if (!rows.length) {
      return Response.json(
        { success: false, error: "No data rows found in file" },
        { status: 400 }
      );
    }

    // Extract period from filename for tables that need it
    const filenamePeriod = extractPeriodFromFilename(file.name);

    // Add brand_id and uploaded_at to each row
    const now = new Date().toISOString();
    const enrichedRows = rows.map((row) => {
      const enriched: Record<string, unknown> = {
        ...row,
        brand_id: brandId,
        uploaded_at: now,
      };

      // For tables that have period_start/period_end, fill from filename if missing
      if (
        filenamePeriod &&
        !enriched.period_start &&
        !enriched.period_end
      ) {
        enriched.period_start = filenamePeriod.periodStart;
        enriched.period_end = filenamePeriod.periodEnd;
      }

      return enriched;
    });

    const supabase = createServerSupabase();
    const tableName = TABLE_MAP[fileType];

    // For non-daily tables, delete existing data for this brand + period first
    if (REPLACE_TABLES.has(tableName)) {
      await deleteExistingRows(supabase, tableName, brandId, enrichedRows);
    }

    // Insert/upsert in batches of 500
    const batchSize = 500;
    let totalProcessed = 0;
    const errors: { batch: number; message: string; detail?: string }[] = [];

    for (let i = 0; i < enrichedRows.length; i += batchSize) {
      const batch = enrichedRows.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;

      try {
        if (DAILY_TABLES.has(tableName)) {
          // Upsert with ON CONFLICT on (brand_id, date)
          const { error } = await supabase
            .from(tableName)
            .upsert(batch, { onConflict: "brand_id,date" });

          if (error) {
            errors.push({
              batch: batchNum,
              message: error.message,
              detail: error.details ?? error.hint ?? undefined,
            });
          } else {
            totalProcessed += batch.length;
          }
        } else {
          // Standard insert (we already deleted old rows above)
          const { error } = await supabase.from(tableName).insert(batch);

          if (error) {
            errors.push({
              batch: batchNum,
              message: error.message,
              detail: error.details ?? error.hint ?? undefined,
            });
          } else {
            totalProcessed += batch.length;
          }
        }
      } catch (batchErr) {
        const msg =
          batchErr instanceof Error ? batchErr.message : "Unknown batch error";
        errors.push({ batch: batchNum, message: msg });
      }
    }

    return Response.json({
      success: errors.length === 0,
      rowsProcessed: totalProcessed,
      totalRows: enrichedRows.length,
      table: tableName,
      errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      {
        success: false,
        error: message,
        rowsProcessed: 0,
        errors: [{ batch: 0, message }],
      },
      { status: 500 }
    );
  }
}

/**
 * Delete existing rows for a brand before re-inserting.
 * Uses period_start/period_end if available, otherwise just brand_id.
 */
async function deleteExistingRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tableName: string,
  brandId: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  // Find period bounds from the rows
  const periodStart = rows[0]?.period_start as string | undefined;
  const periodEnd = rows[0]?.period_end as string | undefined;

  let query = supabase.from(tableName).delete().eq("brand_id", brandId);

  if (periodStart && periodEnd) {
    query = query
      .eq("period_start", periodStart)
      .eq("period_end", periodEnd);
  }

  await query;
}
