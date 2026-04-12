# 🎯 Nuevas Funcionalidades: Presets & Sin Pauta

## ✨ Lo Nuevo

### 1. **Presets de Costos** (Tabla de Referencia)
Guarda combinaciones de costos para no tener que configurarlos cada vez.

**Ejemplo:**
- "1 CREMA" = Costo $64.59
- "2 CREMAS" = Costo $116 / $58 unitario
- "Sin Host" = ROAS 4.0, sin costo del host

**Uso:**
1. En el simulador, click en botón **"📋 Cargar Preset de Costos"**
2. Haz simulaciones con diferentes costos
3. Cuando estés satisfecho, click **"Guardar Preset Actual"**
4. Próxima vez: opens la tabla, selecciona el preset → se carga todo automáticamente ✨

**Características:**
- ✅ Guardar presets con nombre y descripción
- ✅ Marcar uno como "default" (estrella)
- ✅ Eliminar presets que no uses
- ✅ Los presets se guardan POR MARCA y POR USUARIO (privado)

---

### 2. **Live Sin Pauta** (Nuevo Variable)
Ahora puedes simular lo que costaría un live SIN gastar en publicidad pagada.

**Uso:**
1. En el simulador de lives, ve a la sección **"Gasto en Pauta"**
2. Verás un botón nuevo: **"Con Pauta"** o **"❌ Sin Pauta"**
3. Click para togglear
4. Cuando está "Sin Pauta":
   - Gasto en Ads = MX$ 0
   - IVA sobre Ads = MX$ 0
   - El ROAS desaparece (no aplica)
   - Ves la utilidad SOLO sin considerar publicidad

**¿Por qué es importante?**
- Antes: no podías simular un live sin pauta
- Ahora: ves exactamente qué margen harías sin gastar en ads
- Perfecto para analizar viabilidad de lives orgánicos o afiliados gratuitos

---

## 🚀 Implementación Técnica

### Base de Datos
Ejecuta esto en Supabase → SQL Editor:

```sql
-- Ejecutar el archivo: database/migrations/cost-presets.sql
```

Esto crea:
- `predefined_cost_presets` — Tabla de presets por marca
- `simulation_logs` — Logs opcionales (para analytics)
- Índices y RLS policies (privaquidad)

### Componentes Nuevos
- `CostPresetsModal` → UI para gestionar presets
- `useCostPresets` → Hook para CRUD de presets
- `SimuladorLivesTab` (actualizado) → Toggle "Sin Pauta" + presets

### APIs
- `GET /api/presets/[brandId]` → Cargar presets de una marca

---

## 📋 PASOS PARA ACTIVAR

### Paso 1: Migration en Supabase (2 min)

1. Supabase → SQL Editor → New Query
2. Abre `database/migrations/cost-presets.sql`
3. Copia TODO y pégalo
4. Click **Run**
5. Espera ✅

### Paso 2: Deploy

```bash
git push origin main
```

Vercel deployará automáticamente.

### Paso 3: Test en Local

```bash
npm run dev
```

1. Ve a `/brands/[tu-brand]/rentabilidad`
2. Click tab **"Simulador Lives"**
3. Deberías ver: **"📋 Cargar Preset de Costos"** (arriba del formulario)
4. Click en **"Con Pauta" / "❌ Sin Pauta"** (abajo del slider de ROAS)

---

## 🎮 Flujo de Usuario

### Guardar un Preset

1. Configura costos en el simulador
   - Costo Producto: MX$ 64.59
   - Comisión TT: 8%
   - ROAS: 2.5x
   - Costo Host: MX$ 500

2. Click **"📋 Cargar Preset de Costos"**
3. Click **"Guardar Preset Actual"**
4. Rellena:
   - Nombre: "1 CREMA"
   - Descripción: "Simulación estándar para crema básica"
5. Click **"Guardar"**
6. ✅ Preset guardado

### Cargar un Preset

1. Click **"📋 Cargar Preset de Costos"**
2. Se abre modal con lista de presets
3. Click en el preset "1 CREMA"
4. ✨ Se carga automáticamente todos los costos
5. La modal cierra
6. Listo para simular con esos costos

### Simular Sin Pauta

1. En el simulador, agrega:
   - Pedidos: 50
   - AOV: MX$ 349

2. Busca la sección **"Gasto en Pauta — ROAS"**
3. Verás dos botones:
   - **"Con Pauta"** (default)
   - **"❌ Sin Pauta"** (click aquí)

4. Cuando clickeas "Sin Pauta":
   - El slider de ROAS desaparece
   - Gasto en Ads = MX$ 0
   - Ves la utilidad SOLO CON COSTOS VARIABLES
   - Perfecto para comparar con otros canales

---

## 🔒 Privacidad

- Los presets son **privados por usuario**
- Cada usuarioVE SOLO sus presets
- RLS policies aseguran que nadie vea presets ajenos
- Datos encriptados en Supabase

---

## 📊 Ejemplos de Uso

### Caso 1: Comparar diferentes packaging
Creas presets para cada CREMA:
- "1 CREMA" → Costo $64.59
- "2 CREMAS" → Costo $58 unitario
- "Gift Box" → Costo $89 + IVA especial

Luego simulas cada uno con mismo ROAS para ver cuál es más rentable.

### Caso 2: Viabilidad de lives orgánicos
- En "Con Pauta": ROAS 2.0x, margen -27% (PÉRDIDA)
- En "Sin Pauta": margen 15% (GANANCIA)

Conclusion: Mejor hacer lives SIN pauta, esperar FYP orgánico.

### Caso 3: Affiliate vs Pauta
- Creás preset "Affiliate" → Sin pauta, sin comisión TT (8% → 0%)
- Lo simulas → Ves que margen es 22%
- Comparas con "Con Pauta" → Margen -5%
- Decisión: Invertir en afiliados en vez de TikTok Ads

---

## ⚠️ Notas

- Los presets **NO influyen en nada** — son solo referencia guardada
- Puedes tener infinitos presets
- El simulador usa los valores actuales, no necesariamente de un preset
- Para usar un preset ⇒ debes clickearlo en el modal
- "Sin Pauta" es una variable nueva ⇒ permite simular gastoAds = 0

---

## 🔧 Troubleshooting

**No veo el botón "Cargar Preset":**
- Verifica que hayas ejecutado la migration en Supabase
- Redeploy: `git push origin main`
- Clear cache del navegador (Cmd+Shift+R)

**No puedo guardar presets:**
- Verifica que estés logged in (como usuario de la marca)
- Revisa que la tabla `predefined_cost_presets` exista en Supabase

**El toggle "Sin Pauta" no funciona:**
- Recarga la página
- Verifica que SimuladorLivesTab esté actualizado

---

**¿Listo?** Ejecuta la migration y comienza a guardar presets. 🎯
