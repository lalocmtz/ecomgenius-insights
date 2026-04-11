import { createServerSupabase } from "@/lib/supabase/server";
import { UploadZone } from "@/components/upload/UploadZone";
import { FILE_TYPE_PATTERNS } from "@/components/upload/FileTypeMapper";
import { FileSpreadsheet } from "lucide-react";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = createServerSupabase();

  // Fetch brand
  const { data: brand } = await supabase
    .from("brands")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!brand) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-[#8b949e]">Marca no encontrada</p>
      </div>
    );
  }

  // Fetch last upload dates for each table
  const tables = [
    "daily_overview",
    "product_traffic",
    "products",
    "video_performance",
    "creatives",
    "live_campaigns",
    "product_campaigns",
    "affiliate_metrics",
    "creators",
  ] as const;

  const lastUploadDates: Record<string, string | null> = {};

  const results = await Promise.all(
    tables.map((table) =>
      supabase
        .from(table)
        .select("uploaded_at")
        .eq("brand_id", brand.id)
        .order("uploaded_at", { ascending: false })
        .limit(1)
    )
  );

  tables.forEach((table, i) => {
    const row = results[i].data?.[0];
    lastUploadDates[table] = row?.uploaded_at ?? null;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#e6edf3]">
          Subir archivos
        </h1>
        <p className="mt-1 text-sm text-[#8b949e]">
          Sube los reportes de TikTok Shop para {brand.name}
        </p>
      </div>

      <UploadZone brandId={brand.id} />

      {/* Reference table */}
      <div className="rounded-xl border border-[#30363d] bg-[#1c2128]">
        <div className="border-b border-[#30363d] px-4 py-3">
          <h2 className="text-sm font-semibold text-[#e6edf3]">
            Tipos de archivo aceptados
          </h2>
        </div>
        <div className="divide-y divide-[#30363d]">
          {FILE_TYPE_PATTERNS.map((entry) => {
            const lastDate = lastUploadDates[entry.table];
            return (
              <div
                key={entry.type}
                className="flex items-center gap-3 px-4 py-3"
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-green-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#e6edf3]">
                    {entry.label}
                  </p>
                  <p className="text-xs text-[#8b949e]">
                    {entry.pattern.source.replace(/\\/g, "").replace(/\^/g, "")}*
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {lastDate ? (
                    <span className="text-xs text-green-400">
                      {new Date(lastDate).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  ) : (
                    <span className="text-xs text-[#484f58]">Sin datos</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
