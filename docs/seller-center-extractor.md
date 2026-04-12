# TikTok Seller Center Extractor

Plan para automatizar la extraccion de datos del Seller Center y eliminar el upload manual de Excels.

## Estado actual

Hoy el flujo es:
1. Eduardo entra al Seller Center, descarga reportes (`.xlsx`)
2. Sube los archivos en `/brands/[slug]/upload`
3. La app parsea con `xlsx` y guarda en Supabase

Problemas:
- 100% manual, hay que hacerlo todos los dias
- Reportes a veces fallan, no hay alertas
- No hay manera de hacer pull historico por rangos

## Opcion A: Cowork browser automation (preferida)

[Cowork](https://cowork.com) o [Browserbase](https://www.browserbase.com/) corren un Chromium remoto al que le podemos lanzar comandos via Playwright/Puppeteer. Tambien sirven Apify y AgentQL.

### Arquitectura

```
+---------------------+      +-------------------+      +------------------+
|  Vercel Cron        |----->|  /api/extract     |----->|  Cowork browser  |
|  (cada 6h)          |      |  (Edge function)  |      |  + Playwright    |
+---------------------+      +-------------------+      +------------------+
                                       |                         |
                                       v                         v
                              +-------------------+      +------------------+
                              |  Supabase         |<-----|  Seller Center   |
                              |  daily_overview   |      |  (TikTok Shop)   |
                              +-------------------+      +------------------+
```

### Implementacion (4 fases)

**Fase 1 - Login y session capture**
- Cowork session con flag `keepAlive: true`
- Login manual UNA VEZ con 2FA, capturar `cookies` y `localStorage`
- Guardar en Supabase tabla `tiktok_sessions` (encriptado, una row por brand)
  ```sql
  create table tiktok_sessions (
    brand_id uuid primary key references brands(id),
    cookies jsonb not null,
    local_storage jsonb,
    last_validated_at timestamptz,
    expires_at timestamptz,
    notes text
  );
  ```
- Endpoint `/api/seller-center/login` para refrescar manualmente

**Fase 2 - Scraper de Daily Overview**
- Script `lib/extractors/daily-overview.ts`:
  1. Spawn Cowork session
  2. Inyectar cookies guardadas
  3. Navegar a `seller.tiktokglobalshop.com/dashboard`
  4. Esperar a que cargue el grafico
  5. Click en filtro de fecha, seleccionar rango (default ultimos 7 dias)
  6. Click "Descargar reporte" -> capturar download
  7. Parsear el `.xlsx` con la libreria `xlsx` (ya instalada)
  8. Upsert a `daily_overview` por `(brand_id, date)`
- Cuando el cookie expire (~30 dias), enviar email a Eduardo

**Fase 3 - Reportes adicionales**
- `products` (Product Performance)
- `live_campaigns` (Live Studio Analytics)
- `affiliate_metrics` (Creator Marketplace)
- `creatives` (Video Performance)

Cada uno como su propio archivo en `lib/extractors/` con la misma forma:
```ts
export async function extractProducts(brandId: string, range: DateRange): Promise<{ rows: number; error?: string }>
```

**Fase 4 - Cron + observabilidad**
- `vercel.json` con cron diario a las 5am MX:
  ```json
  {
    "crons": [
      { "path": "/api/extract/daily?all", "schedule": "0 11 * * *" }
    ]
  }
  ```
- Tabla `extraction_runs` para historial:
  ```sql
  create table extraction_runs (
    id uuid primary key default gen_random_uuid(),
    brand_id uuid references brands(id),
    extractor text not null,
    status text not null, -- 'success' | 'failed' | 'partial'
    rows_added int,
    error text,
    started_at timestamptz default now(),
    finished_at timestamptz
  );
  ```
- Vista en `/brands/[slug]/upload` que liste los runs y permita re-disparar

### Costos estimados

| Item | Costo/mes |
|------|-----------|
| Cowork Pro (10h browser/dia) | ~$50 USD |
| Vercel Cron | $0 (incluido en Hobby) |
| Supabase storage extra | $0 (cabe en free tier) |
| **Total** | **~$50 USD** |

Por las 3 marcas iniciales: ~$17 USD/marca/mes

## Opcion B: TikTok Shop API oficial

TikTok tiene Open Platform API pero requiere:
- Aplicacion como developer
- Aprobacion del seller (firmar OAuth)
- Limites de rate
- Solo da datos de los ultimos 90 dias

**Pros**: oficial, estable, sin riesgo de ban
**Contras**: aprobacion lenta (semanas), API limitada vs el dashboard

Plan: aplicar en paralelo a la opcion A. Si llega la aprobacion, migrar.

## Opcion C: Manual con UX mejorada (fallback)

Si las opciones A y B fallan:
- Bookmarklet que se pegue en Seller Center y haga `fetch` directo a las APIs internas (las que usa el dashboard)
- Datos llegan a `/api/upload-bookmark` con auth token

## Riesgos y mitigaciones

| Riesgo | Mitigacion |
|--------|------------|
| TikTok detecta scraping y bloquea cuenta | Cowork con residential IPs, throttle 1 req/3s, simular mouse/scroll |
| Cookies expiran | Email alert + endpoint de refresh manual |
| Cambios de UI rompen el scraper | Tests E2E semanales, fallback a opcion C |
| Costos crecen con mas marcas | Reusar misma session por marca (mismo Cowork) |

## Proximos pasos concretos

1. [ ] Crear cuenta en Cowork (o Browserbase) - 5 min
2. [ ] Probar manualmente login + descarga del Daily Report - 30 min
3. [ ] Crear `tiktok_sessions` table - 5 min
4. [ ] Implementar `lib/extractors/daily-overview.ts` - 4h
5. [ ] Crear endpoint `/api/extract/daily` - 1h
6. [ ] Configurar Vercel cron - 15 min
7. [ ] UI de extraction runs en `/upload` - 2h
8. [ ] Documentar como refrescar cookies - 30 min

**Total estimado**: 1-2 dias de trabajo dedicado

## Decisiones pendientes

- [ ] Cowork vs Browserbase vs Apify (depende de costo y soporte de stealth)
- [ ] Donde guardar cookies cifradas (Supabase Vault vs env vars)
- [ ] Frecuencia del cron (cada 6h vs diario a las 5am)
- [ ] Que hacer cuando la extraccion falla (email vs Slack vs UI alert)
