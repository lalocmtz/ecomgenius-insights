/**
 * Utilidades compartidas para cálculos de simulador lives
 * Usado en ambos modos: "Planificar Live" y "Live en Curso"
 */

export interface LiveCalcInput {
  gmv?: number;
  pedidos?: number;
  aov?: number;
  roas?: number;
  hasAds: boolean;
  productCostMode: "pct" | "fixed";
  productCostPct?: number;
  productCostFixed?: number;
  guiasPct: number;
  ttCommissionPct: number;
  ivaAdsPct: number;
  retencionBasePct: number;
  costoHost: number;
  gastoAdsActual?: number; // Para Live en Curso
}

export interface LiveCalcResult {
  gmv: number;
  pedidos: number;
  aov: number;
  gastoAds: number;
  ivaAds: number;
  productCost: number;
  productCostUnit: number;
  guias: number;
  ttComm: number;
  retenciones: number;
  totalVariableCosts: number;
  grossMargin: number;
  grossMarginPct: number;
  netProfit: number;
  netMarginPct: number;
  marginPerUnit: number;
  breakEvenPedidos: number;
  breakEvenGMV: number;
  pedidosDelta: number;
  roasBreakEven: number | null;
  roasActual: number | null;
}

/**
 * Modo PLANIFICAR: calcula basado en GMV target + ROAS
 * - Input: GMV target, AOV, ROAS
 * - Output: Pedidos proyectados, costos estimados, rentabilidad
 */
export function computePlanningLive(input: LiveCalcInput): LiveCalcResult | null {
  const gmv = input.gmv || 0;
  if (gmv === 0) return null;

  const aov = input.aov || 349;
  const pedidos = Math.ceil(gmv / aov);

  // Si no hay pauta, gastoAds = 0
  const gastoAds = !input.hasAds ? 0 : input.roas && input.roas > 0 ? gmv / input.roas : 0;
  const ivaAds = gastoAds * (input.ivaAdsPct / 100);

  // Costos
  const productCostUnit =
    input.productCostMode === "fixed"
      ? input.productCostFixed || 0
      : (input.aov || aov) * ((input.productCostPct || 0) / 100);
  const productCost = productCostUnit * pedidos;

  const guias = gmv * (input.guiasPct / 100);
  const ttComm = gmv * (input.ttCommissionPct / 100);
  const baseImponible = gmv * (1 - input.ttCommissionPct / 100 - input.guiasPct / 100);
  const retenciones = baseImponible * (input.retencionBasePct / 100);

  const totalVariableCosts = productCost + guias + ttComm + retenciones + gastoAds + ivaAds;
  const grossMargin = gmv - totalVariableCosts;
  const grossMarginPct = gmv > 0 ? (grossMargin / gmv) * 100 : 0;

  const netProfit = grossMargin - input.costoHost;
  const netMarginPct = gmv > 0 ? (netProfit / gmv) * 100 : 0;

  const variableUnit = totalVariableCosts / pedidos;
  const marginPerUnit = aov - variableUnit;

  // Break-even
  const breakEvenPedidos = marginPerUnit > 0 ? Math.ceil(input.costoHost / marginPerUnit) : 0;
  const breakEvenGMV = breakEvenPedidos * aov;
  const pedidosDelta = pedidos - breakEvenPedidos;

  // ROAS break-even
  const productPctEffective =
    input.productCostMode === "fixed"
      ? (input.productCostFixed || 0) / Math.max(aov, 1)
      : (input.productCostPct || 0) / 100;
  const fixedVarPct =
    productPctEffective +
    input.guiasPct / 100 +
    input.ttCommissionPct / 100 +
    (baseImponible / gmv) * (input.retencionBasePct / 100);
  const ivaMultiplier = 1 + input.ivaAdsPct / 100;
  const remainder = 1 - fixedVarPct - (gmv > 0 ? input.costoHost / gmv : 0);
  const roasBreakEven = remainder > 0 ? ivaMultiplier / remainder : null;

  return {
    gmv,
    pedidos,
    aov,
    gastoAds,
    ivaAds,
    productCost,
    productCostUnit,
    guias,
    ttComm,
    retenciones,
    totalVariableCosts,
    grossMargin,
    grossMarginPct,
    netProfit,
    netMarginPct,
    marginPerUnit,
    breakEvenPedidos,
    breakEvenGMV,
    pedidosDelta,
    roasBreakEven,
    roasActual: null,
  };
}

/**
 * Modo DURANTE: calcula basado en datos reales capturados
 * - Input: Venta actual, pedidos reales, gasto ads real
 * - Output: Métricas en tiempo real (ROAS actual, AOV real, rentabilidad)
 */
export function computeDuringLive(input: LiveCalcInput): LiveCalcResult | null {
  const gmv = input.gmv || 0;
  const pedidos = input.pedidos || 0;

  if (gmv === 0 || pedidos === 0) return null;

  const aov = gmv / pedidos;
  const gastoAds = input.gastoAdsActual || 0;
  const roasActual = gastoAds > 0 ? gmv / gastoAds : 0;
  const ivaAds = gastoAds * (input.ivaAdsPct / 100);

  // Costos
  const productCostUnit =
    input.productCostMode === "fixed"
      ? input.productCostFixed || 0
      : aov * ((input.productCostPct || 0) / 100);
  const productCost = productCostUnit * pedidos;

  const guias = gmv * (input.guiasPct / 100);
  const ttComm = gmv * (input.ttCommissionPct / 100);
  const baseImponible = gmv * (1 - input.ttCommissionPct / 100 - input.guiasPct / 100);
  const retenciones = baseImponible * (input.retencionBasePct / 100);

  const totalVariableCosts = productCost + guias + ttComm + retenciones + gastoAds + ivaAds;
  const grossMargin = gmv - totalVariableCosts;
  const grossMarginPct = gmv > 0 ? (grossMargin / gmv) * 100 : 0;

  const netProfit = grossMargin - input.costoHost;
  const netMarginPct = gmv > 0 ? (netProfit / gmv) * 100 : 0;

  const variableUnit = totalVariableCosts / pedidos;
  const marginPerUnit = aov - variableUnit;

  // Break-even (para referencia, aunque ya estemos en vivo)
  const breakEvenPedidos = marginPerUnit > 0 ? Math.ceil(input.costoHost / marginPerUnit) : 0;
  const breakEvenGMV = breakEvenPedidos * aov;
  const pedidosDelta = pedidos - breakEvenPedidos;

  // ROAS break-even para referencia
  const productPctEffective =
    input.productCostMode === "fixed"
      ? (input.productCostFixed || 0) / Math.max(aov, 1)
      : (input.productCostPct || 0) / 100;
  const fixedVarPct =
    productPctEffective +
    input.guiasPct / 100 +
    input.ttCommissionPct / 100 +
    (baseImponible / gmv) * (input.retencionBasePct / 100);
  const ivaMultiplier = 1 + input.ivaAdsPct / 100;
  const remainder = 1 - fixedVarPct - (gmv > 0 ? input.costoHost / gmv : 0);
  const roasBreakEven = remainder > 0 ? ivaMultiplier / remainder : null;

  return {
    gmv,
    pedidos,
    aov,
    gastoAds,
    ivaAds,
    productCost,
    productCostUnit,
    guias,
    ttComm,
    retenciones,
    totalVariableCosts,
    grossMargin,
    grossMarginPct,
    netProfit,
    netMarginPct,
    marginPerUnit,
    breakEvenPedidos,
    breakEvenGMV,
    pedidosDelta,
    roasBreakEven,
    roasActual,
  };
}

/**
 * Formateo de moneda MXN
 */
export function formatMX(v: number, compact = false): string {
  if (compact && Math.abs(v) >= 1000) {
    return `MX$ ${(v / 1000).toFixed(1)}k`;
  }
  return `MX$ ${v.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Formateo de porcentaje
 */
export function pct(v: number): string {
  return `${v.toFixed(1)}%`;
}

/**
 * Color para margen neto %
 */
export function getMarginColor(m: number): string {
  if (m >= 25) return "text-green-400";
  if (m >= 10) return "text-amber-400";
  return "text-red-400";
}

/**
 * Background color para margen neto %
 */
export function getMarginBg(m: number): string {
  if (m >= 25) return "bg-green-950/60 border-green-900/50";
  if (m >= 10) return "bg-amber-950/60 border-amber-900/50";
  return "bg-red-950/60 border-red-900/50";
}

/**
 * Color para ROAS
 */
export function getRoasColor(roas: number): string {
  if (roas >= 3) return "#22c55e";
  if (roas >= 2) return "#f59e0b";
  return "#ef4444";
}

/**
 * Generar insights dinámicos para Planificar Live
 */
export function getPlanningInsights(
  result: LiveCalcResult | null,
  costoHost: number,
  pedidos: number
): string[] {
  if (!result) return [];

  const insights: string[] = [];

  if (result.netMarginPct >= 20) {
    insights.push(`🎯 Live rentable con ${pct(result.netMarginPct)}`);
  } else if (result.netMarginPct >= 0) {
    insights.push(`⚠️ Margen ajustado — revisa host o ROAS`);
    insights.push(
      `Para llegar a 20%, necesitas ${formatMX((result.gmv * 0.2 - result.netProfit) * 1.05)} más en ventas`
    );
  } else {
    insights.push(`❌ Live en pérdida`);
    insights.push(`Necesitas ${formatMX(Math.abs(result.netProfit))} más en ventas para cero pérdida`);
    if (result.roasBreakEven && result.roasBreakEven > 0) {
      insights.push(`O reducir ROAS a máximo ${result.roasBreakEven.toFixed(2)}x`);
    }
  }

  if (costoHost > 0 && result.breakEvenPedidos > 0) {
    insights.push(
      `Punto de equilibrio: ${result.breakEvenPedidos} pedidos (${formatMX(result.breakEvenGMV)})`
    );
  }

  return insights;
}

/**
 * Generar insights dinámicos para Live en Curso
 */
export function getDuringLiveInsights(
  result: LiveCalcResult | null,
  currentMarginTarget = 20
): string[] {
  if (!result) return [];

  const insights: string[] = [];

  if (result.netMarginPct >= currentMarginTarget) {
    insights.push(
      `✅ ¡Excelente! Live rentable con ${pct(result.netMarginPct)} de margen`
    );
    insights.push(
      `Cada pedido adicional te genera ${formatMX(result.marginPerUnit)} de utilidad`
    );
  } else if (result.netMarginPct >= 0) {
    insights.push(`⚠️ Vas bien con ${pct(result.netMarginPct)} de margen`);
    const neededForTarget = (result.gmv * (currentMarginTarget / 100) - result.netProfit) * 1.05;
    insights.push(
      `Para llegar a ${currentMarginTarget}%, necesitas ${formatMX(neededForTarget)} más`
    );
    insights.push(
      `O ${Math.ceil(neededForTarget / result.aov)} pedidos más al AOV actual de ${formatMX(result.aov)}`
    );
  } else {
    insights.push(`❌ Live en pérdida con ${pct(result.netMarginPct)}`);
    insights.push(
      `Necesitas ${formatMX(Math.abs(result.netProfit))} más en ventas para cero pérdida`
    );
    insights.push(`Eso equivale a ${Math.ceil(Math.abs(result.netProfit) / result.aov)} pedidos`);
  }

  return insights;
}
