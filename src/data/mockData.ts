export const livesData = [
  { id: '1', fecha: '2025-04-01', hora: '14:08', duracion: '3h', host: null, pedidos: 13, aov: 158, roas_live: 2.65, venta: 2049.98, ads: 775.01, mercancias: 246, costo_host: 0, utilidad: 308, margen: 0.1501 },
  { id: '2', fecha: '2025-04-01', hora: '10:54', duracion: '3h', host: null, pedidos: 13, aov: 164, roas_live: 3.08, venta: 2137.32, ads: 694.29, mercancias: 256, costo_host: 0, utilidad: 457, margen: 0.2137 },
  { id: '3', fecha: '2025-03-31', hora: '13:16', duracion: '45min', host: null, pedidos: 3, aov: 152, roas_live: 2.00, venta: 455.87, ads: 227.97, mercancias: 55, costo_host: 0, utilidad: -7, margen: -0.0153 },
  { id: '4', fecha: '2025-03-31', hora: '10:00', duracion: '3h14min', host: null, pedidos: 15, aov: 168, roas_live: 5.91, venta: 2518.67, ads: 426.20, mercancias: 302, costo_host: 0, utilidad: 979, margen: 0.3887 },
  { id: '5', fecha: '2025-03-29', hora: '14:00', duracion: '3h', host: 'FER', pedidos: 9, aov: 276, roas_live: 4.41, venta: 2486, ads: 564, mercancias: 298, costo_host: 500, utilidad: 298, margen: 0.12 },
  { id: '6', fecha: '2025-03-28', hora: '11:00', duracion: '3h', host: 'EMILIO', pedidos: 8, aov: 213, roas_live: 0.00, venta: 1705, ads: 0, mercancias: 205, costo_host: 500, utilidad: 457, margen: 0.2678 },
  { id: '7', fecha: '2025-03-27', hora: '13:00', duracion: '3h', host: 'EMILIO', pedidos: 10, aov: 223, roas_live: 5.48, venta: 2225, ads: 406, mercancias: 267, costo_host: 500, utilidad: 316, margen: 0.142 },
  { id: '8', fecha: '2025-03-27', hora: '10:00', duracion: '3h', host: 'DENISSE', pedidos: 18, aov: 221, roas_live: 11.20, venta: 3977, ads: 355, mercancias: 477, costo_host: 500, utilidad: 1488, margen: 0.374 },
  { id: '9', fecha: '2025-03-26', hora: '14:00', duracion: '3h', host: 'FER', pedidos: 23, aov: 117, roas_live: 5.12, venta: 2686, ads: 525, mercancias: 322, costo_host: 500, utilidad: 471, margen: 0.1752 },
  { id: '10', fecha: '2025-03-25', hora: '10:00', duracion: '3h', host: 'DENISSE', pedidos: 25, aov: 217, roas_live: 4.38, venta: 5434.10, ads: 1240, mercancias: 652, costo_host: 500, utilidad: 1386, margen: 0.2551 },
];

export const kpisFeelInk = [
  { slug: 'ventas_totales', name: 'Ventas Totales', clasificacion: 'Rentabilidad', valor: 1245000, target: 1100000, unidad: 'MXN', status: 'bien' },
  { slug: 'pct_utilidad', name: '% Utilidad', clasificacion: 'Rentabilidad', valor: 24.5, target: 20.0, unidad: '%', status: 'bien' },
  { slug: 'pct_cogs', name: '% COGS Total', clasificacion: 'Costos', valor: 32.8, target: 30.0, unidad: '%', status: 'alerta' },
  { slug: 'pct_mercancias', name: '% Gasto de Mercancía', clasificacion: 'Costos', valor: 28.2, target: 30.0, unidad: '%', status: 'bien' },
  { slug: 'pct_envios', name: '% Gastos de Envíos', clasificacion: 'Costos', valor: 12.4, target: 8.0, unidad: '%', status: 'critico' },
  { slug: 'tasa_contracargos', name: 'Tasa de Contracargos', clasificacion: 'Control', valor: 0.45, target: 1.0, unidad: '%', status: 'bien' },
  { slug: 'ticket_promedio', name: 'Ticket Promedio', clasificacion: 'Rentabilidad', valor: 84.20, target: 80.00, unidad: 'MXN', status: 'bien' },
  { slug: 'pct_exactitud_tp', name: '% Exactitud TP/TW', clasificacion: 'Control', valor: 94.8, target: 98.0, unidad: '%', status: 'alerta' },
];

export const kpisSkinglow = [
  { slug: 'ventas_totales', name: 'Ventas Totales', clasificacion: 'Rentabilidad', valor: 942300, target: 1020000, unidad: 'MXN', status: 'alerta' },
  { slug: 'pct_utilidad_neta', name: '% Utilidad Neta', clasificacion: 'Rentabilidad', valor: 18.2, target: 15.0, unidad: '%', status: 'bien' },
  { slug: 'pct_gasto_ads', name: '% Gasto en Ads', clasificacion: 'Publicidad', valor: 34.1, target: 30.0, unidad: '%', status: 'alerta' },
  { slug: 'pct_cogs', name: '% COGS Total', clasificacion: 'Costos', valor: 29.5, target: 32.0, unidad: '%', status: 'bien' },
  { slug: 'pct_nomina', name: '% Nómina', clasificacion: 'Costos', valor: 8.4, target: 10.0, unidad: '%', status: 'bien' },
  { slug: 'pct_mercancias', name: '% Mercancía', clasificacion: 'Costos', valor: 22.1, target: 25.0, unidad: '%', status: 'bien' },
  { slug: 'pct_envios', name: '% Envíos', clasificacion: 'Costos', valor: 7.2, target: 7.5, unidad: '%', status: 'bien' },
  { slug: 'pct_incidencias', name: '% Gasto Incidencias', clasificacion: 'Costos', valor: 3.8, target: 1.5, unidad: '%', status: 'critico' },
  { slug: 'tasa_contracargos', name: 'Tasa de Contracargos', clasificacion: 'Control', valor: 0.8, target: 1.0, unidad: '%', status: 'bien' },
  { slug: 'ratio_fijo_variable', name: 'Ratio Fijo/Variable', clasificacion: 'Análisis', valor: 22, target: 25, unidad: 'ratio', status: 'bien' },
  { slug: 'break_even_daily', name: 'Break-even Daily', clasificacion: 'Rentabilidad', valor: 12400, target: 12000, unidad: 'MXN', status: 'bien' },
  { slug: 'ticket_promedio', name: 'Ticket Promedio', clasificacion: 'Rentabilidad', valor: 112.50, target: 105.00, unidad: 'MXN', status: 'bien' },
  { slug: 'pct_exactitud_tp', name: '% Exactitud TP', clasificacion: 'Control', valor: 96.2, target: 98.0, unidad: '%', status: 'alerta' },
];

export const salesData30d = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2025, 2, 3 + i);
  const base = 35000 + Math.random() * 15000;
  return {
    date: date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
    ventas: Math.round(base),
    meta: 42000,
  };
});

export const channelDistribution = [
  { name: 'TikTok Shop', value: 42, amount: 52080 },
  { name: 'Meta Ads', value: 28, amount: 34720 },
  { name: 'Shopify Org.', value: 15, amount: 18600 },
  { name: 'Mayoreo', value: 15, amount: 18600 },
];

export const agents = [
  { id: 'director', name: 'Director / CEO', icon: 'Target', description: 'Visión estratégica total de ambas marcas', lastAnalysis: 'Se detecta un incremento de retención del 24% en los contenidos de "UGC Industrial" comparado con la semana anterior. Acción sugerida: Incrementar la frecuencia de TikTok Lives entre las 20:00 y 22:00 para capitalizar el tráfico orgánico de Meta.' },
  { id: 'financiero', name: 'Analista Financiero', icon: 'DollarSign', description: 'P&L, márgenes, cashflow y KPIs financieros' },
  { id: 'publicidad', name: 'Analista de Publicidad', icon: 'Megaphone', description: 'ROAS, creativos y distribución de presupuesto' },
  { id: 'lives', name: 'Analista de Lives', icon: 'Video', description: 'Rentabilidad por sesión y host' },
  { id: 'logistica', name: 'Analista de Logística', icon: 'Truck', description: 'Envíos, inventario y contracargos' },
  { id: 'datos', name: 'Analista de Datos', icon: 'BarChart2', description: 'Síntesis diaria y anomalías' },
];
