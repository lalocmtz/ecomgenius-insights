# 🤖 Integración Claude Cowork - Seller Center Extraction

## Descripción

El sistema automático extrae datos del TikTok Seller Center (México) usando Claude Cowork. Cuando haces clic en el botón "Seller Center", Cowork:

1. Abre el Seller Center en una sesión de navegador automatizada
2. Extrae datos de hoy: GMV, gasto en ads, pedidos
3. Extrae histórico de los últimos 60 días
4. Guarda todo en la tabla `live_sessions` de Supabase
5. Actualiza el simulador automáticamente

---

## 🔧 Configuración

### 1. Variables de Entorno

Agrega a tu `.env.local`:

```bash
# Endpoint del servidor MCP que ejecuta Cowork
# Para desarrollo local (default): http://localhost:3001/cowork
# Para producción: https://your-cowork-server.com/extract
COWORK_MCP_ENDPOINT=http://localhost:3001/cowork

# Token de autenticación para Cowork
# Obtenerlo de: https://cowork.example.com/dashboard/api-keys
COWORK_API_TOKEN=your-token-here

# URL del Seller Center (usar como referencia)
COWORK_SELLER_CENTER_URL=https://seller-mx.tiktok.com/homepage

# Debug mode - muestra logs detallados
COWORK_DEBUG=true
```

### 2. Token de Cowork

Para obtener tu `COWORK_API_TOKEN`:

1. **Si Cowork está localmente instalado:**
   ```bash
   # Iniciar servidor MCP de Cowork
   cowork mcp start --port 3001 --token xyz123
   ```
   → Token disponible en salida del comando

2. **Si usas Cowork Cloud:**
   - Ve a: https://cowork.example.com/dashboard
   - API Keys → Create New
   - Copia el token
   - Guárdalo en `.env.local`

3. **Si usas Cowork como Docker container:**
   ```bash
   docker run -e COWORK_API_TOKEN=your-token cowork:latest
   ```

---

## 🚀 Cómo Funciona

### Flujo de Extracción

```
Usuario hace click en "Seller Center"
    ↓
Frontend llama → POST /api/seller-center-sync-v2
    ↓
Backend verifica auth
    ↓
Backend llama → Cowork MCP Endpoint
    ↓
Prompt para Cowork:
  "Abre Seller Center, extrae:
   - GMV de hoy
   - Gasto ads de hoy
   - Pedidos de hoy
   - Histórico 60 días (si disponible)
   - Detalles de creadores/afiliados"
    ↓
Cowork abre navegador automatizado → navega a Seller Center
    ↓
Cowork extrae datos usando selectores CSS
    ↓
Retorna JSON:
  {
    "current": { "gmv": 2500, "gastoAdsActual": 893.94, ... },
    "historical": [ { "date": "2026-04-12", "gmv": 2500, ... }, ... ],
    "summary": { "gmv_60d": 150000, ... }
  }
    ↓
Backend guarda en live_sessions table
    ↓
Frontend actualiza:
  - ventaActual = 2500
  - gastoAdsActual = 893.94
  - Recalcula P&L
    ↓
Toast: "✓ Datos actualizado desde Seller Center"
```

### Datos Extraídos

```typescript
// ACTUAL (Hoy)
{
  gmv: 2500,                    // Ventas brutas
  gastoAdsActual: 893.94,       // Ads invertidos
  pedidosActuales: 8,           // Número de pedidos
  creativeSales: {              // Desglose por fuente
    live_principal: 1250,
    creador_a: 450,
    creador_b: 600,
    otros: 200
  }
}

// HISTÓRICO (Últimos 60 días)
[
  {
    date: "2026-04-12",
    gmv: 2500,
    gastoAds: 893.94,
    pedidos: 8,
    roi: 2.8,                   // Retorno
    margen: 0.35                // 35% de margen
  },
  ...
]

// RESUMEN (60 días)
{
  gmv_60d: 150000,              // Total vendido
  gasto_ads_60d: 45000,         // Total en ads
  roi_promedio: 2.4,            // Promedio retorno
  margen_promedio: 0.32,        // Promedio margen
  total_lives: 42               // Número de lives
}
```

---

## 🔐 Seguridad

### Autenticación
- ✅ Solo usuarios autenticados pueden extraer datos
- ✅ Backend verifica que `userId` == auth usuario
- ✅ RLS en Supabase: usuarios solo ven sus datos

### Validaciones
- ✅ Input validation en backend
- ✅ SQL injection prevention (prepared queries)
- ✅ API token solo en env vars (nunca en código)
- ✅ CORS/CSRF protección en production

### Datos Sensibles
- 🔒 Credenciales TikTok: Las maneja Cowork (nunca pasan por nuestra app)
- 🔒 Auth token Cowork: Solo en backend .env.local
- 🔒 User data: Encrypted en Supabase con auth keys

---

## 🛠️ Troubleshooting

### Problema: "Cowork no está configurado"

**Solución:**
```bash
# 1. Verificar variables en .env.local
grep COWORK /Users/eduardo/ecomgenius-intelligence/.env.local

# Expected output:
# COWORK_MCP_ENDPOINT=http://localhost:3001/cowork
# COWORK_API_TOKEN=...
# COWORK_DEBUG=true
```

### Problema: "Cowork API error: 401"

**Solución:**
- ❌ Token inválido
- ✅ Regenera token en dashboard de Cowork
- ✅ Verifica que esté en .env.local
- ✅ Reinicia servidor Next.js: `npm run dev`

### Problema: "No data returned"

**Solución:**
```bash
# 1. Habilitar debug
# En .env.local: COWORK_DEBUG=true

# 2. Check logs
# Verás en terminal qué endpoint Cowork está llamando
# Ejemplo: [Cowork] Intentando extraer...
#          [Cowork] Response status: 200
#          [Cowork] Data: { gmv: 2500, ... }

# 3. Verificar que Seller Center URL es correcta
# Debe ser: https://seller-mx.tiktok.com/homepage
```

### Problema: "Timeout en extracción"

**Solución:**
- Cowork demora >60 segundos
- ✅ Aumentar timeout en backend (ver seller-center-sync-v2.ts línea 45)
- ✅ Verificar que Cowork tienes acceso a internet
- ✅ Revisar si Seller Center está lento

---

## 📊 Panel de Analytics

Una vez integrada, el panel mostrará:

```
┌─ ANÁLISIS ÚLTIMOS 60 DÍAS ─────────────┐
│                                        │
│  GMV Total: $150,000   ▮▮▮▮           │
│  Gasto Ads: $45,000    ▮▮▮            │
│  Pedidos: 480          ▮▮▮▮▮▮         │
│  ROI Promedio: 240%    ▮▮▮            │
│  Margen: 32%           ▮▮▮▮           │
│  ROAS: 333%            ▮▮▮▮▮          │
│                                        │
│  [Gráfico de tendencias]               │
│  GMV vs Ads (línea temporal)           │
│                                        │
│  [Tabla de últimas 15 sesiones]        │
│  Fecha | GMV | Ads | Pedidos | ROI    │
└────────────────────────────────────────┘
```

---

## 💡 Tips & Tricks

### Debugging

```javascript
// En browser console, si está habilitado COWORK_DEBUG:
// Los logs están en Next.js server terminal
// Búsca: [Cowork] o [seller-center-sync]
```

### Caché y Performance

- Historical data se carga 1 vez al abrir panel
- Seller Center button hace request real cada vez
- Para actualizar histórico: cierra/abre panel

### Integración Custom

Si quieres llamar endpoints directamente desde code:

```typescript
// Frontend
import { syncSellerCenterData } from '@/lib/seller-center';

const data = await syncSellerCenterData(brandId, userId);
console.log(data.gmv, data.historical);

// Backend
POST /api/seller-center-sync-v2
{
  "brandId": "xxx",
  "userId": "yyy",
  "liveDate": "2026-04-12"
}
```

---

## 📞 Soporte

Si tienes problemas:

1. **Check logs**: `npm run dev` y mira salida del server
2. **Habilitar debug**: Set `COWORK_DEBUG=true`
3. **Verificar variables**: `grep COWORK .env.local`
4. **Reiniciar server**: `Ctrl+C` y `npm run dev`

---

## 🎯 Checklist Configuración

- [ ] Tabla `live_sessions` creada en Supabase
- [ ] COWORK_MCP_ENDPOINT agregado a .env.local
- [ ] COWORK_API_TOKEN configurado
- [ ] Servidor Cowork está corriendo (si local)
- [ ] Next.js app reiniciada (`npm run dev`)
- [ ] Panel Analytics aparece en simulador
- [ ] Click "Seller Center" funciona
- [ ] Datos aparecen en tabla `live_sessions`

---

**¡Listo! Ahora tienes full integration con Claude Cowork para auto-extracción de datos.**
