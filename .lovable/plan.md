

# Plan: Rediseño EcomGenius — 6 Pasos

## Prerequisito: Habilitar Lovable Cloud

El proyecto **no tiene Supabase conectado** actualmente. Antes de implementar cualquier paso, necesito habilitar Lovable Cloud, que creará automáticamente la instancia de Supabase con base de datos, auth y edge functions.

**Acción requerida del usuario**: Aprobar la habilitación de Lovable Cloud cuando aparezca el prompt.

---

## Paso 1: Supabase + Datos Reales

### Schema (8 tablas vía migraciones)
- `daily_metrics` — métricas diarias por marca/canal con todos los campos de costos
- `lives_analysis` — análisis individual de lives con campos completos incluyendo `notas`
- `creativos` — nueva tabla para tracking de creativos con `tags text[]`
- `organico_posts` — posts orgánicos con métricas sociales y `es_viral`
- `kpis_monthly` — KPIs con unique constraint `(brand, periodo, kpi_slug)`
- `okrs` — objetivos con `kr_items jsonb`
- `margin_scenarios` — escenarios del simulador
- `agent_conversations` — historial de agentes IA

Todas con: uuid PK, `created_at`/`updated_at`, RLS habilitado (policy authenticated read/write).

### Datos seed (vía insert tool)
- 8 lives de Feel Ink (marzo 2025)
- KPIs Feel Ink MAR-2025 (5 KPIs) + Skinglow MAR-2025 (4 KPIs)
- 3 creativos (FI-V001, FI-V002, SG-V001)

### Frontend
- Eliminar `src/data/mockData.ts`
- Crear `src/integrations/supabase/client.ts` con el cliente Supabase
- Crear hooks con react-query: `useLives()`, `useKPIs()`, `useCreativos()`, `useDailyMetrics()`, etc.
- Actualizar Dashboard, Lives, Finanzas, KPIs, AgentesIA para usar los hooks en vez de mockData

---

## Paso 2: Edición en Tiempo Real

- Componente `EditableCell`: click → input, Enter → save via Supabase `.update()`, toast confirmación, Escape cancela
- Toggle `editMode` en Zustand store, botón en header [✏️ Editar] / [👁 Ver]
- Supabase Realtime: suscripción a cambios en tablas principales para sync multi-usuario
- **Selector de fechas global funcional**: dropdown con botones rápidos (Hoy, 7D, 30D, Este mes, Mes pasado, Q1, YTD, Personalizado con date-range picker). Actualiza `dateRange` en Zustand, todas las queries filtran por este rango.

---

## Paso 3: Dashboard — Profit Estimado

- Panel full-width encima de KPIs: 4 columnas (Ventas Brutas, Costos Totales, Gasto Ads, Profit Estimado con margen%)
- Barra visual break-even + desglose por canal
- Fórmula real de costos: COGS 12% + guías 6% + comisión TTS 8% + IVA CPA 4% + retenciones 9.03% + ads + host
- Segunda línea verde de profit en la gráfica de ventas 30D (calculada con la fórmula)

---

## Paso 4: 8 Páginas Faltantes

| Página | Ruta | Descripción |
|--------|------|-------------|
| Ventas | `/ventas` | Tabla editable daily_metrics agrupada día/canal, barras apiladas, +Agregar día, Export CSV |
| TikTok Shop | `/tiktok-shop` | KPIs GMV/pedidos/AOV, tabla canal=tiktok, gráfica GMV 30D con dots en días de live |
| Shopify | `/shopify` | KPIs ventas/ticket/descuento%, tabla canal=shopify, panel alertas Skinglow |
| Meta Ads | `/meta-ads` | KPIs spend/ROAS/CPA, gráfica ROAS diario + línea target 3.5x, grid creativos top |
| Creativos | `/creativos` | Grid cards con ROAS coloreado, filtros, modal nuevo creativo, panel Creative Intelligence, fatigue badge |
| Orgánico Social | `/organico` | KPIs, feed grid 3cols, badge viral, botón Convertir a Paid, heatmap horarios |
| OKRs | `/okrs` | Tabla editable con semáforo, barras progreso, expandible a KR items, resumen |
| Configuración | `/configuracion` | Usuarios, agentes toggle, API keys, export CSV |

- Agregar `Palette` (Creativos) al sidebar
- Registrar todas las rutas en App.tsx

---

## Paso 5: Agentes IA con Claude API (via Lovable AI)

- Edge Function `claude-agent`: recibe agentId, brand, messages, consulta datos frescos de Supabase, llama Lovable AI Gateway con system prompt específico por agente, guarda en `agent_conversations`
- 7 agentes: Director, Financiero, Publicidad, Lives, Logística, Datos, Creativo (nuevo)
- System prompts en español MX con contexto financiero real
- Streaming SSE para respuestas en tiempo real
- Conectar: Director → Dashboard panel, Financiero → KPIs Editorial Pulse, Creativo → Creativos Intelligence
- Usar `LOVABLE_API_KEY` (ya disponible)

---

## Paso 6: Automatización Diaria

- Edge Function `claude-agent-daily`: ejecuta los 7 agentes para ambas marcas (skip lives para Skinglow)
- Tabla `agent_daily_runs` para tracking de ejecuciones
- Indicador en header: ● verde(<2h), amarillo(2-6h), rojo(>6h) basado en última ejecución
- En página Agentes: "Última ejecución · Próxima: mañana 00:00"
- CRON via pg_cron (migración SQL)

---

## Detalles Técnicos

### Estructura de archivos nuevos
```text
src/
  integrations/supabase/
    client.ts
    types.ts
  hooks/
    useLives.ts
    useKPIs.ts
    useDailyMetrics.ts
    useCreativos.ts
    useOrganicoPosts.ts
    useOKRs.ts
    useAgents.ts
    useEditMode.ts
    useRealtimeSync.ts
  components/
    EditableCell.tsx
    DateRangePicker.tsx
    ProfitPanel.tsx
    CreativoCard.tsx
    OKRRow.tsx
    HeatmapHorarios.tsx
  pages/
    Ventas.tsx
    TikTokShop.tsx
    ShopifyPage.tsx
    MetaAds.tsx
    Creativos.tsx
    OrganicoSocial.tsx
    OKRs.tsx
    Configuracion.tsx
supabase/
  functions/claude-agent/index.ts
  functions/claude-agent-daily/index.ts
```

### Diseño (sin cambios)
Feel Ink: bg #0F0F0F, accent #FF5722. Skinglow: bg #F8F6F0, accent #1A8A72. Inter 400/500. Sin sombras. rounded-lg.

