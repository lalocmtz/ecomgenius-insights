"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[#8b949e] text-xs">{label}</Label>
        <span className="text-sm font-semibold text-[#f97316]">{value}%</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(val) => {
          const newVal = typeof val === "number" ? val : val[0];
          onChange(newVal);
        }}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function computeMargin(
  precioVenta: number,
  costoProducto: number,
  costoEsPorcentaje: boolean,
  comisionTikTok: number,
  retenciones: number,
  descuento: number,
  comisionAfiliado: number
) {
  const precioConDescuento = precioVenta * (1 - descuento / 100);
  const comisionTTAmount = precioConDescuento * (comisionTikTok / 100);
  const retencionesAmount = precioConDescuento * (retenciones / 100);
  const comisionAfiliadoAmount = precioConDescuento * (comisionAfiliado / 100);
  const costoProductoAmount = costoEsPorcentaje
    ? precioVenta * (costoProducto / 100)
    : costoProducto;

  const ingresoNeto = precioConDescuento - comisionTTAmount - retencionesAmount;
  const margenPorPieza = ingresoNeto - comisionAfiliadoAmount - costoProductoAmount;
  const margenPct = precioConDescuento > 0 ? (margenPorPieza / precioConDescuento) * 100 : 0;

  return {
    precioConDescuento,
    ingresoNeto,
    comisionAfiliadoAmount,
    costoProductoAmount,
    margenPorPieza,
    margenPct,
  };
}

export function AffiliateOfferCalculator() {
  const [precioVenta, setPrecioVenta] = useState(0);
  const [costoProducto, setCostoProducto] = useState(0);
  const [costoEsPorcentaje, setCostoEsPorcentaje] = useState(false);
  const [comisionTikTok, setComisionTikTok] = useState(8);
  const [retenciones, setRetenciones] = useState(9.03);
  const [descuento, setDescuento] = useState(0);
  const [comisionAfiliado, setComisionAfiliado] = useState(0);

  const results = useMemo(
    () =>
      computeMargin(
        precioVenta,
        costoProducto,
        costoEsPorcentaje,
        comisionTikTok,
        retenciones,
        descuento,
        comisionAfiliado
      ),
    [precioVenta, costoProducto, costoEsPorcentaje, comisionTikTok, retenciones, descuento, comisionAfiliado]
  );

  const esRentable = results.margenPct >= 10;

  // Scenario grid: 5 descuento rows x 5 comision cols
  const descuentoSteps = [0, 10, 20, 30, 40];
  const comisionSteps = [0, 5, 10, 15, 20];

  const scenarioGrid = useMemo(() => {
    return descuentoSteps.map((d) =>
      comisionSteps.map((c) =>
        computeMargin(precioVenta, costoProducto, costoEsPorcentaje, comisionTikTok, retenciones, d, c)
      )
    );
  }, [precioVenta, costoProducto, costoEsPorcentaje, comisionTikTok, retenciones]);

  function cellColor(margen: number): string {
    if (margen > 25) return "bg-[#22c55e]/20 text-[#22c55e]";
    if (margen >= 10) return "bg-[#f97316]/20 text-[#f97316]";
    return "bg-[#ef4444]/20 text-[#ef4444]";
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card className="bg-[#1c2128] border-[#30363d] ring-0">
          <CardHeader>
            <CardTitle className="text-[#e6edf3]">Datos del Producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InputField
              label="Precio de venta normal"
              value={precioVenta}
              onChange={setPrecioVenta}
              prefix="MX$"
              step={10}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[#8b949e] text-xs">Costo del producto</Label>
                <button
                  type="button"
                  onClick={() => setCostoEsPorcentaje(!costoEsPorcentaje)}
                  className="text-xs text-[#f97316] hover:text-[#f97316]/80 transition-colors"
                >
                  {costoEsPorcentaje ? "Cambiar a MX$" : "Cambiar a %"}
                </button>
              </div>
              <div className="relative">
                {!costoEsPorcentaje && (
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8b949e]">
                    MX$
                  </span>
                )}
                <Input
                  type="number"
                  step={costoEsPorcentaje ? 0.5 : 1}
                  value={costoProducto}
                  onChange={(e) => setCostoProducto(parseFloat(e.target.value) || 0)}
                  className={`bg-[#0d1117] border-[#30363d] text-[#e6edf3] ${!costoEsPorcentaje ? "pl-10" : ""} ${costoEsPorcentaje ? "pr-8" : ""}`}
                />
                {costoEsPorcentaje && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8b949e]">
                    %
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="% Comision TikTok Shop"
                value={comisionTikTok}
                onChange={setComisionTikTok}
                suffix="%"
                step={0.5}
              />
              <InputField
                label="% Retenciones"
                value={retenciones}
                onChange={setRetenciones}
                suffix="%"
                step={0.01}
              />
            </div>

            <div className="pt-2 space-y-4">
              <SliderField
                label="% Descuento al cliente"
                value={descuento}
                onChange={setDescuento}
                min={0}
                max={50}
                step={1}
              />
              <SliderField
                label="% Comision al afiliado"
                value={comisionAfiliado}
                onChange={setComisionAfiliado}
                min={0}
                max={30}
                step={1}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-[#1c2128] border-[#30363d] ring-0">
          <CardHeader>
            <CardTitle className="text-[#e6edf3]">Resultados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#30363d]">
              <span className="text-sm text-[#8b949e]">Precio con descuento</span>
              <span className="text-sm font-semibold text-[#e6edf3]">
                {formatMXN(results.precioConDescuento)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#30363d]">
              <span className="text-sm text-[#8b949e]">Ingreso neto</span>
              <span className="text-sm font-semibold text-[#e6edf3]">
                {formatMXN(results.ingresoNeto)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#30363d]">
              <span className="text-sm text-[#8b949e]">Comision afiliado</span>
              <span className="text-sm font-semibold text-[#f97316]">
                {formatMXN(results.comisionAfiliadoAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#30363d]">
              <span className="text-sm text-[#8b949e]">Costo producto</span>
              <span className="text-sm font-semibold text-[#e6edf3]">
                {formatMXN(results.costoProductoAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#30363d]">
              <span className="text-sm text-[#8b949e]">Margen por pieza</span>
              <span
                className={`text-sm font-semibold ${results.margenPorPieza >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
              >
                {formatMXN(results.margenPorPieza)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#30363d]">
              <span className="text-sm text-[#8b949e]">Margen %</span>
              <span
                className={`text-sm font-semibold ${results.margenPct > 25 ? "text-[#22c55e]" : results.margenPct >= 10 ? "text-[#f97316]" : "text-[#ef4444]"}`}
              >
                {formatPercent(results.margenPct)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4">
              <span className="text-sm font-semibold text-[#e6edf3]">
                Es rentable esta oferta?
              </span>
              <Badge
                className={
                  esRentable
                    ? "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30"
                    : "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30"
                }
              >
                {esRentable ? "SI - Rentable" : "NO - No rentable"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenario Grid */}
      <Card className="bg-[#1c2128] border-[#30363d] ring-0">
        <CardHeader>
          <CardTitle className="text-[#e6edf3]">
            Matriz de Escenarios: Descuento vs Comision Afiliado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="py-2 px-3 text-left text-xs text-[#8b949e] font-medium">
                    Descuento \ Comision
                  </th>
                  {comisionSteps.map((c) => (
                    <th
                      key={c}
                      className="py-2 px-3 text-center text-xs text-[#8b949e] font-medium"
                    >
                      {c}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {descuentoSteps.map((d, rowIdx) => (
                  <tr key={d}>
                    <td className="py-2 px-3 text-xs text-[#8b949e] font-medium">
                      {d}%
                    </td>
                    {comisionSteps.map((_, colIdx) => {
                      const cell = scenarioGrid[rowIdx][colIdx];
                      return (
                        <td key={colIdx} className="py-1 px-1">
                          <div
                            className={`rounded-md px-2 py-1.5 text-center text-xs font-semibold ${cellColor(cell.margenPct)}`}
                          >
                            {formatPercent(cell.margenPct)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-[#8b949e]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#22c55e]/20" />
              <span>&gt; 25%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#f97316]/20" />
              <span>10-25%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#ef4444]/20" />
              <span>&lt; 10%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
