

## Plan: Simplify Platform + Fix Build Errors + Triple Whale Integration

### What changes

1. **Remove pages**: Creativos & Pauta, Orgánico Social
2. **Merge Finanzas + KPIs Financieros** into a single "Finanzas" page with tabs
3. **Update sidebar and router** to reflect removals
4. **Fix 3 TypeScript build errors** (dynamic `{ [field]: value }` update patterns)
5. **Add Triple Whale data sync section** in Configuracion page

### Detailed steps

#### Step 1 — Fix build errors (3 files)
The `{ [field]: value }` pattern produces `{ [x: string]: unknown }` which the strict Supabase types reject. Fix by casting to `as any` in three places:
- `src/hooks/useSupabaseData.ts` line 156: `.update({ [field]: value } as any)`
- `src/hooks/useObjetivos.ts` line 176: `.update({ [field]: value } as any)`
- `src/pages/Lives.tsx` line 125: `.update({ ... } as any)`

#### Step 2 — Remove pages from sidebar and router
- **AppSidebar.tsx**: Remove nav items for "Creativos & Pauta" (`/creativos`), "Orgánico Social" (`/organico`), and "KPIs Financieros" (`/kpis`)
- **App.tsx**: Remove routes for `/creativos`, `/organico`, `/kpis`. Remove imports for CreativosYPauta, OrganicoSocial, KPIsFinancieros

#### Step 3 — Merge Finanzas + KPIs into one page
- Rewrite `Finanzas.tsx` to have two tabs: "Simulador de Márgenes" (current Finanzas content) and "KPIs Financieros" (current KPIs content)
- Delete `KPIsFinancieros.tsx` or leave unused

#### Step 4 — Triple Whale integration setup
- Add a new section in `Configuracion.tsx` for "Sincronización de Datos"
- Show a card explaining Triple Whale connection with a button to configure API key
- Create an edge function `supabase/functions/sync-triple-whale/index.ts` that:
  - Reads Triple Whale API key from secrets
  - Fetches daily sales data (Meta, TikTok Ads, GMV Max, Lives, Google)
  - Upserts into `daily_metrics` table
- Use the `add_secret` tool to request the Triple Whale API key from the user
- Add a manual "Sync Now" button + show last sync timestamp
- The edge function can be scheduled via pg_cron for daily auto-sync

### Technical notes
- Triple Whale API provides unified ecommerce analytics across Meta, TikTok, Google channels
- The sync function will map Triple Whale channel data to existing `daily_metrics` canal values
- Will ask user for API key before implementing the sync function

