"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMXN, formatPercent } from "@/lib/format";

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}

function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
}: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[#8b949e] text-xs">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8b949e]">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`bg-[#0d1117] border-[#30363d] text-[#e6edf3] ${prefix ? "pl-10" : ""} ${suffix ? "pr-8" : ""}`}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8b949e]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ResultCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "green" | "amber" | "red" | "neutral";
}) {
  const colorMap = {
    green: "text-[#22c55e]",
    amber: "text-[#f97316]",
    red: "text-[#ef4444]",
    neutral: "text-[#e6edf3]",
  };
  const color = highlight ? colorMap[highlight] : "text-[#e6edf3]";

  return (
    <div className="flex items-center justify-between py-2 border-b border-[#30363d] last:border-b-0">
      <span className="text-sm text-[#8b949e]">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}

export function RentabilityCalculator() {
  const [ventaTotal, setVentaTotal] = useState(0);
  const [gastoAds, setGastoAds] = useState(0);
  const [costoHost, setCostoHost] = useState(0);
  const [pedidos, setPedidos] = useState(1);
  const [comisionTikTok, setComisionTikTok] = useState(8);
  const [guiasAfiliados, setGuiasAfiliados] = useState(6);
  const [ivaAds, setIvaAds] = useState(16);
  const [retenciones, setRetenciones] = useState(9.03);
  const [costoProductoPct, setCostoProductoPct] = useState(12);

  const results = useMemo(() => {
    const safePedidos = pedidos > 0 ? pedidos : 1;
    const aov = ventaTotal / safePedidos;
    const roas = gastoAds > 0 ? ventaTotal / gastoAds : 0;
    const costoProducto = ventaTotal * (costoProductoPct / 100);
    const guias = ventaTotal * (guiasAfiliados / 100);
    const ivaAdsAmount = gastoAds * (ivaAds / 100);
    const comisionTT = ventaTotal * (comisionTikTok / 100);
    const retencionesAmount = ventaTotal * (retenciones / 100);

    const totalCostos =
      costoProducto +
      guias +
      ivaAdsAmount +
      comisionTT +
      retencionesAmount +
      gastoAds +
      costoHost;

    const utilidad = ventaTotal - totalCostos;
    const margen = ventaTotal > 0 ? (utilidad / ventaTotal) * 100 : 0;

    // Punto de equilibrio ROAS: the ROAS at which utilidad = 0
    // utilidad = ventaTotal - (costoProducto + guias + comisionTT + retenciones + gastoAds + ivaAds + costoHost) = 0
    // Let pctTotal = costoProductoPct + guiasAfiliados + comisionTikTok + retenciones (percentages on venta)
    // ventaTotal * (1 - pctTotal/100) = gastoAds * (1 + ivaAds/100) + costoHost
    // ventaTotal / gastoAds = (1 + ivaAds/100) + costoHost/gastoAds) / (1 - pctTotal/100)
    const pctTotal =
      costoProductoPct + guiasAfiliados + comisionTikTok + retenciones;
    const denominator = 1 - pctTotal / 100;
    const puntoEquilibrioROAS =
      denominator > 0 && gastoAds > 0
        ? ((1 + ivaAds / 100) + costoHost / gastoAds) / denominator
        : denominator > 0
          ? (1 + ivaAds / 100) / denominator
          : 0;

    return {
      aov,
      roas,
      costoProducto,
      guias,
      ivaAdsAmount,
      comisionTT,
      retencionesAmount,
      totalCostos,
      utilidad,
      margen,
      puntoEquilibrioROAS,
    };
  }, [
    ventaTotal,
    gastoAds,
    costoHost,
    pedidos,
    comisionTikTok,
    guiasAfiliados,
    ivaAds,
    retenciones,
    costoProductoPct,
  ]);

  const margenColor: "green" | "amber" | "red" =
    results.margen > 25 ? "green" : results.margen >= 10 ? "amber" : "red";

  const trafficLightBg =
    margenColor === "green"
      ? "bg-[#22c55e]"
      : margenColor === "amber"
        ? "bg-[#f97316]"
        : "bg-[#ef4444]";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <Card className="bg-[#1c2128] border-[#30363d] ring-0">
        <CardHeader>
          <CardTitle className="text-[#e6edf3]">Datos de Venta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Venta Total"
              value={ventaTotal}
              onChange={setVentaTotal}
              prefix="MX$"
              step={100}
            />
            <InputField
              label="Gasto Ads"
              value={gastoAds}
              onChange={setGastoAds}
              prefix="MX$"
              step={100}
            />
            <InputField
              label="Costo Host (opcional)"
              value={costoHost}
              onChange={setCostoHost}
              prefix="MX$"
              step={50}
            />
            <InputField
              label="Pedidos"
              value={pedidos}
              onChange={(v) => setPedidos(Math.max(1, v))}
              step={1}
            />
          </div>

          <div className="mt-6">
            <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">
              Porcentajes
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="% Comision TikTok"
                value={comisionTikTok}
                onChange={setComisionTikTok}
                suffix="%"
                step={0.5}
              />
              <InputField
                label="% Guias/Afiliados"
                value={guiasAfiliados}
                onChange={setGuiasAfiliados}
                suffix="%"
                step={0.5}
              />
              <InputField
                label="% IVA Ads"
                value={ivaAds}
                onChange={setIvaAds}
                suffix="%"
                step={1}
              />
              <InputField
                label="% Retenciones"
                value={retenciones}
                onChange={setRetenciones}
                suffix="%"
                step={0.01}
              />
              <InputField
                label="% Costo Producto"
                value={costoProductoPct}
                onChange={setCostoProductoPct}
                suffix="%"
                step={0.5}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {/* Traffic light indicator */}
        <Card className="bg-[#1c2128] border-[#30363d] ring-0">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${trafficLightBg} shadow-lg`} />
              <div>
                <p className="text-xs text-[#8b949e]">Margen de Utilidad</p>
                <p className={`text-2xl font-bold ${margenColor === "green" ? "text-[#22c55e]" : margenColor === "amber" ? "text-[#f97316]" : "text-[#ef4444]"}`}>
                  {formatPercent(results.margen)}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-[#8b949e]">Utilidad</p>
                <p className={`text-xl font-bold ${results.utilidad >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {formatMXN(results.utilidad)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card className="bg-[#1c2128] border-[#30363d] ring-0">
          <CardHeader>
            <CardTitle className="text-[#e6edf3]">Metricas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultCard label="AOV" value={formatMXN(results.aov)} />
            <ResultCard
              label="ROAS"
              value={results.roas.toFixed(2) + "x"}
              highlight={results.roas >= results.puntoEquilibrioROAS ? "green" : "red"}
            />
            <ResultCard
              label="Punto de Equilibrio ROAS"
              value={results.puntoEquilibrioROAS.toFixed(2) + "x"}
              highlight="neutral"
            />
          </CardContent>
        </Card>

        {/* Cost breakdown */}
        <Card className="bg-[#1c2128] border-[#30363d] ring-0">
          <CardHeader>
            <CardTitle className="text-[#e6edf3]">Desglose de Costos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultCard label="Costo Producto" value={formatMXN(results.costoProducto)} />
            <ResultCard label="Guias/Afiliados" value={formatMXN(results.guias)} />
            <ResultCard label="Gasto Ads" value={formatMXN(gastoAds)} />
            <ResultCard label="IVA Ads" value={formatMXN(results.ivaAdsAmount)} />
            <ResultCard label="Comision TikTok" value={formatMXN(results.comisionTT)} />
            <ResultCard label="Retenciones" value={formatMXN(results.retencionesAmount)} />
            <ResultCard label="Costo Host" value={formatMXN(costoHost)} />
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-[#30363d]">
              <span className="text-sm font-semibold text-[#e6edf3]">Total Costos</span>
              <span className="text-sm font-bold text-[#ef4444]">
                {formatMXN(results.totalCostos)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
