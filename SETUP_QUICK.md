# 🚀 Quick Start: Últimos 60 Días + Claude Cowork

## ✅ Ya Configurado

Los últimos cambios implementan:

1. **Backend Endpoints** 
   - ✅ `/api/seller-center-sync-v2` - Extrae vía Cowork
   - ✅ `/api/seller-center-history` - Obtiene histórico

2. **React Component**
   - ✅ `SellerCenterAnalytics` - Panel de 60 días
   - ✅ Integrado en `SimuladorLivesDuring`

3. **Database Table**
   - ⏳ `live_sessions` - NECESITA CREAR (ver instrucciones)

4. **Environment**
   - ✅ Variables agregadas a `.env.local`
   - ⏳ Token de Cowork - NECESITA CONFIGURAR

---

## 🔧 Pasos Faltantes (15 minutos)

### Paso 1: Crear Tabla en Supabase (1 minuto)

📖 Ver instrucciones completas: [docs/SETUP_LIVE_SESSIONS_TABLE.md](docs/SETUP_LIVE_SESSIONS_TABLE.md)

**Quick:**
1. Abre: https://app.supabase.com/project/YOUR_PROJECT/sql/new
2. Copia SQL desde [docs/SETUP_LIVE_SESSIONS_TABLE.md](docs/SETUP_LIVE_SESSIONS_TABLE.md)
3. Ejecuta con `Ctrl+Enter`

✅ Tabla creada cuando la veas en Table Editor

### Paso 2: Configurar Token de Cowork (5 minutos)

📖 Ver instrucciones completas: [docs/COWORK_INTEGRATION.md](docs/COWORK_INTEGRATION.md)

**Quick:**
```bash
# Editar .env.local
nano .env.local

# Buscar:
# COWORK_API_TOKEN=your-cowork-api-token-here

# Reemplazar:
# COWORK_API_TOKEN=tu-token-real-aqui
```

Obtener token:
- **Local**: `cowork mcp start --port 3001 --token xyz123`
- **Cloud**: https://cowork.dashboard.com/api-keys

### Paso 3: Reiniciar Servidor (1 segundo)

```bash
# Presiona Ctrl+C en terminal de npm
# Luego:
npm run dev
```

### Paso 4: Probar (2 minutos)

1. Abre simulador en navegador
2. Mira panel izquierdo → "Análisis últimos 60 días"
3. Haz click para expandir
4. Si está vacío, haz click en botón "Seller Center" (verde)
5. Espera a que termine la extracción
6. Verás datos aparecer ✨

---

## 📊 Qué Verás

### Panel de Analytics
- Gráfico de tendencias GMV vs Ads
- 6 tarjetas de métricas
- Tabla con últimas 15 sesiones
- Cálculos automáticos: ROI, Margen, ROAS

### Botón "Seller Center"
- Verde con icono ↻ (refresh)
- Al hacer click:
  - Muestra spinner
  - Sales a buscar datos
  - Auto-actualiza simulador
  - Toast de confirmación

### Datos Guardados
- Automáticamente en tabla `live_sessions`
- Pueden verse en Supabase Table Editor
- Persistentes entre sessions

---

## 🐛 Debugging

Si algo no funciona:

```bash
# 1. Ver logs del servidor
npm run dev
# Busca: [Cowork], [seller-center], [Supabase]

# 2. Verificar env vars
grep COWORK .env.local
# Debe mostrar 4 líneas con COWORK_*

# 3. Chequear tabla existe
# Supabase → Table Editor → debe estar "live_sessions"

# 4. Firefox DevTools (F12) → Network
# Click "Seller Center" → ver request a /api/seller-center-sync-v2
# Status debe ser 200, response debe tener { success: true, data: {...} }
```

---

## 📚 Documentación Completa

- [docs/SETUP_LIVE_SESSIONS_TABLE.md](docs/SETUP_LIVE_SESSIONS_TABLE.md) - Crear tabla
- [docs/COWORK_INTEGRATION.md](docs/COWORK_INTEGRATION.md) - Configurar Cowork
- [CLAUDE.md](CLAUDE.md) - Guía general del proyecto

---

## ✨ Resumen Técnico

**Flujo:**
```
Simulador
  ↓
[Panel] Análisis 60 días → GET /api/seller-center-history → Supabase
  ↓
[Botón] Seller Center → POST /api/seller-center-sync-v2 → Cowork → Supabase
  ↓
Analytics Panel actualiza con gráficos y stats
```

**Stack:**
- Frontend: React + TypeScript + Recharts (gráficos)
- Backend: Next.js API Routes
- DB: Supabase PostgreSQL + RLS
- AI: Claude Cowork MCP (extracción)

**Archivos:**
```
pages/api/
  seller-center-sync-v2.ts ---- Endpoint Cowork
  seller-center-history.ts ---- Endpoint Histórico

components/rentabilidad/
  SellerCenterAnalytics.tsx ---- Panel Analytics
  SimuladorLivesDuring.tsx ----- Integración

lib/
  seller-center.ts ------------ Utilitarios

docs/
  SETUP_LIVE_SESSIONS_TABLE.md - SQL Setup
  COWORK_INTEGRATION.md -------- Config Cowork
```

---

## 🎯 Estado Actual

| Item | Estado | Acción |
|------|--------|--------|
| Backend endpoints | ✅ | Listos |
| React components | ✅ | Listos |
| Lib utilities | ✅ | Listos |
| Supabase table | ⏳ | Crear SQL |
| Cowork token | ⏳ | Configurar |
| Testing | ⏳ | Probar flujo |

---

**Próximo: Sigue los 4 pasos de arriba → ¡Listo! 🚀**
