"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Loader2, Copy, Save, ChevronDown, ChevronUp, Brain } from "lucide-react";
import type { Brand, AIReport } from "@/types";

interface Props {
  brandId: string;
  brand: Brand;
}

type AnalysisType = "full" | "campaigns" | "team";
type PeriodType = "last" | "3m";

const LOADING_MESSAGES = [
  "Analizando ventas...",
  "Evaluando creativos...",
  "Calculando punto de equilibrio real...",
  "Generando diagnostico...",
];

export function AsesorIATab({ brandId, brand }: Props) {
  const [periodType, setPeriodType] = useState<PeriodType>("last");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("full");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [pastReports, setPastReports] = useState<AIReport[]>([]);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Cycle loading messages
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const loadPastReports = useCallback(async () => {
    const { data } = await supabase
      .from("ai_reports")
      .select("*")
      .eq("brand_id", brandId)
      .like("report_type", "advisor_%")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setPastReports(data as AIReport[]);
  }, [brandId]);

  useEffect(() => {
    loadPastReports();
  }, [loadPastReports]);

  function getDateRange() {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (periodType === "last") {
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
    } else {
      start = startOfMonth(subMonths(now, 3));
      end = endOfMonth(subMonths(now, 1));
    }

    return {
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    };
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setReportContent("");
    setSaved(false);
    setLoadingMsgIdx(0);

    const { startDate, endDate } = getDateRange();

    try {
      const response = await fetch("/api/advisor/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          startDate,
          endDate,
          analysisType,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Error generando analisis");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setReportContent(accumulated);
      }

      setSaved(true);
      await loadPastReports();
    } catch (err) {
      console.error("Generation error:", err);
      setReportContent(
        `Error: ${err instanceof Error ? err.message : "No se pudo generar el analisis"}`
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

  const analysisTypeLabel =
    analysisType === "full"
      ? "Diagnostico completo"
      : analysisType === "campaigns"
        ? "Solo campanas"
        : "Solo equipo/costos";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-6">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="h-6 w-6 text-[#f97316]" />
          <h2 className="text-lg font-bold text-[#e6edf3]">
            Asesor Estrategico
          </h2>
        </div>
        <p className="text-sm text-[#8b949e]">
          Analisis financiero · TikTok Shop · {brand.name}
        </p>
        <p className="text-xs text-[#8b949e] mt-1 italic">
          &quot;Contexto completo de tu operacion. Diagnostico directo. Acciones
          concretas.&quot;
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-[#8b949e]">
              Periodo de analisis
            </label>
            <div className="flex gap-2">
              {[
                { key: "last" as PeriodType, label: "Ultimo mes" },
                { key: "3m" as PeriodType, label: "Ultimos 3 meses" },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriodType(p.key)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    periodType === p.key
                      ? "bg-[#f97316] text-white"
                      : "bg-[#161b22] text-[#8b949e] hover:text-[#e6edf3]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[#8b949e]">
              Tipo de analisis
            </label>
            <div className="flex gap-2">
              {[
                { key: "full" as AnalysisType, label: "Diagnostico completo" },
                { key: "campaigns" as AnalysisType, label: "Solo campanas" },
                { key: "team" as AnalysisType, label: "Solo equipo/costos" },
              ].map((a) => (
                <button
                  key={a.key}
                  onClick={() => setAnalysisType(a.key)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    analysisType === a.key
                      ? "bg-[#f97316] text-white"
                      : "bg-[#161b22] text-[#8b949e] hover:text-[#e6edf3]"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#f97316] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {LOADING_MESSAGES[loadingMsgIdx]}
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              Generar analisis
            </>
          )}
        </button>
      </div>

      {/* Report output */}
      {(reportContent || isGenerating) && (
        <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#e6edf3]">
              {analysisTypeLabel}
            </h2>
            {reportContent && !isGenerating && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-1.5 text-xs text-[#8b949e] transition-colors hover:border-[#8b949e] hover:text-[#e6edf3]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copiado" : "Copiar"}
                </button>
                {!saved && (
                  <button
                    onClick={async () => {
                      const { startDate, endDate } = getDateRange();
                      await supabase.from("ai_reports").insert({
                        brand_id: brandId,
                        report_type: `advisor_${analysisType}`,
                        period_start: startDate,
                        period_end: endDate,
                        prompt_used: "",
                        report_content: reportContent,
                      });
                      setSaved(true);
                      await loadPastReports();
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-1.5 text-xs text-[#8b949e] transition-colors hover:border-[#8b949e] hover:text-[#e6edf3]"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Guardar
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="mb-3 mt-6 text-lg font-bold text-[#f97316]">
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
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-[#f97316] pl-4 italic text-[#8b949e]">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {reportContent}
            </ReactMarkdown>
          </div>

          {isGenerating && !reportContent && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[#8b949e]">
              <Loader2 className="h-4 w-4 animate-spin" />
              {LOADING_MESSAGES[loadingMsgIdx]}
            </div>
          )}
        </div>
      )}

      {/* Past reports */}
      {pastReports.length > 0 && (
        <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#e6edf3]">
            Analisis anteriores
          </h2>
          <div className="space-y-3">
            {pastReports.map((report) => {
              const isExpanded = expandedReportId === report.id;
              const typeLabel = report.report_type
                .replace("advisor_", "")
                .replace("full", "Diagnostico completo")
                .replace("campaigns", "Solo campanas")
                .replace("team", "Solo equipo/costos");
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
                            h2: ({ children }) => (
                              <h2 className="mb-3 mt-5 text-lg font-bold text-[#f97316]">
                                {children}
                              </h2>
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
                        >
                          {report.report_content}
                        </ReactMarkdown>
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
