"use client";

import { use, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useDateRange } from "@/hooks/use-date-range";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { Loader2, Copy, Save, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { AIReport, Brand } from "@/types";

const reportTypes = [
  { label: "Resumen semanal", value: "weekly_summary" },
  { label: "Analisis de creativos", value: "creative_analysis" },
  { label: "Analisis financiero", value: "financial_analysis" },
  { label: "Reporte completo", value: "full_report" },
] as const;

type ReportTypeValue = (typeof reportTypes)[number]["value"];

export default function ReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { dateRange } = useDateRange();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [selectedType, setSelectedType] = useState<ReportTypeValue>("weekly_summary");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [pastReports, setPastReports] = useState<AIReport[]>([]);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadBrand() {
      const { data } = await supabase
        .from("brands")
        .select("*")
        .eq("slug", slug)
        .single();
      if (data) setBrand(data as Brand);
    }
    loadBrand();
  }, [slug]);

  const loadPastReports = useCallback(async () => {
    if (!brand) return;
    const { data } = await supabase
      .from("ai_reports")
      .select("*")
      .eq("brand_id", brand.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setPastReports(data as AIReport[]);
  }, [brand]);

  useEffect(() => {
    loadPastReports();
  }, [loadPastReports]);

  async function handleGenerate() {
    if (!brand) return;
    setIsGenerating(true);
    setReportContent("");
    setSaved(false);

    const startDate = format(dateRange.start, "yyyy-MM-dd");
    const endDate = format(dateRange.end, "yyyy-MM-dd");

    try {
      const response = await fetch("/api/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brand.id,
          startDate,
          endDate,
          reportType: selectedType,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Error generando reporte");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setReportContent(accumulated);
      }

      setSaved(true);
      await loadPastReports();
    } catch (err) {
      console.error("Generation error:", err);
      setReportContent(
        `Error: ${err instanceof Error ? err.message : "No se pudo generar el reporte"}`
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    if (!brand || !reportContent || saved) return;

    const startDate = format(dateRange.start, "yyyy-MM-dd");
    const endDate = format(dateRange.end, "yyyy-MM-dd");

    await supabase.from("ai_reports").insert({
      brand_id: brand.id,
      report_type: selectedType,
      period_start: startDate,
      period_end: endDate,
      prompt_used: "",
      report_content: reportContent,
    });

    setSaved(true);
    await loadPastReports();
  }

  const reportTypeLabel =
    reportTypes.find((t) => t.value === selectedType)?.label || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e6edf3]">Reporte AI</h1>
        <p className="mt-1 text-sm text-[#8b949e]">
          Genera reportes inteligentes con analisis de datos de{" "}
          {brand?.name || slug}
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <DateRangePicker />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#8b949e]">
            Tipo de reporte
          </label>
          <div className="flex flex-wrap gap-2">
            {reportTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedType === type.value
                    ? "bg-[#f97316] text-white"
                    : "bg-[#161b22] text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !brand}
          className="flex items-center gap-2 rounded-lg bg-[#f97316] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generar reporte
            </>
          )}
        </button>
      </div>

      {/* Report output */}
      {(reportContent || isGenerating) && (
        <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#e6edf3]">
              {reportTypeLabel}
            </h2>
            {reportContent && !isGenerating && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-1.5 text-xs text-[#8b949e] transition-colors hover:border-[#8b949e] hover:text-[#e6edf3]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copiado" : "Copiar reporte"}
                </button>
                {!saved && (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-1.5 text-xs text-[#8b949e] transition-colors hover:border-[#8b949e] hover:text-[#e6edf3]"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Guardar reporte
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-4 mt-6 text-xl font-bold text-[#e6edf3]">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-3 mt-5 text-lg font-semibold text-[#e6edf3]">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 mt-4 text-base font-semibold text-[#e6edf3]">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 text-sm leading-relaxed text-[#c9d1d9]">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-[#f97316]">
                    {children}
                  </strong>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 ml-4 list-disc space-y-1 text-sm text-[#c9d1d9]">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-[#c9d1d9]">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-[#f97316] pl-4 italic text-[#8b949e]">
                    {children}
                  </blockquote>
                ),
              }}
            />
          </div>

          {isGenerating && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[#8b949e]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando reporte...
            </div>
          )}
        </div>
      )}

      {/* Past reports */}
      {pastReports.length > 0 && (
        <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#e6edf3]">
            Reportes anteriores
          </h2>
          <div className="space-y-3">
            {pastReports.map((report) => {
              const isExpanded = expandedReportId === report.id;
              const typeLabel =
                reportTypes.find((t) => t.value === report.report_type)
                  ?.label || report.report_type;
              const createdDate = new Date(report.created_at);

              return (
                <div
                  key={report.id}
                  className="rounded-lg border border-[#30363d] bg-[#161b22]"
                >
                  <button
                    onClick={() =>
                      setExpandedReportId(isExpanded ? null : report.id)
                    }
                    className="flex w-full items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-[#f97316]/10 px-2 py-0.5 text-xs font-medium text-[#f97316]">
                        {typeLabel}
                      </span>
                      <span className="text-sm text-[#e6edf3]">
                        {format(createdDate, "dd/MM/yyyy HH:mm")}
                      </span>
                      <span className="text-xs text-[#8b949e]">
                        {report.period_start} - {report.period_end}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-[#8b949e]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#8b949e]" />
                    )}
                  </button>

                  {!isExpanded && (
                    <p className="px-4 pb-3 text-xs text-[#8b949e] line-clamp-2">
                      {report.report_content.slice(0, 200)}...
                    </p>
                  )}

                  {isExpanded && (
                    <div className="border-t border-[#30363d] p-4">
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h1 className="mb-4 mt-6 text-xl font-bold text-[#e6edf3]">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="mb-3 mt-5 text-lg font-semibold text-[#e6edf3]">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="mb-2 mt-4 text-base font-semibold text-[#e6edf3]">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="mb-3 text-sm leading-relaxed text-[#c9d1d9]">
                                {children}
                              </p>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-[#f97316]">
                                {children}
                              </strong>
                            ),
                            ul: ({ children }) => (
                              <ul className="mb-3 ml-4 list-disc space-y-1 text-sm text-[#c9d1d9]">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-[#c9d1d9]">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="leading-relaxed">{children}</li>
                            ),
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
