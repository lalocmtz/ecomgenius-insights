

## Plan: Registro de Ofertas/Pruebas por Live

### Concepto
Cada live podrá tener múltiples "segmentos de prueba" — rangos de tiempo donde se registra una comunicación diferente con sus propias métricas (ventas, pauta, pedidos). Esto permite comparar qué comunicación/oferta funcionó mejor dentro del mismo live, aislando factores como host, día y hora.

### 1. Nueva tabla `live_offer_tests`

```text
live_offer_tests
├── id (uuid, PK)
├── live_id (uuid, FK → lives_analysis.id, ON DELETE CASCADE)
├── brand (text)
├── hora_inicio (time)      -- ej: "14:00"
├── hora_fin (time)         -- ej: "15:00"
├── comunicacion (text)     -- descripción libre de la oferta/ángulo
├── ventas (numeric)
├── pedidos (integer)
├── gasto_ads (numeric)
├── created_at (timestamptz)
```

RLS: público (igual que las demás tablas del proyecto).

### 2. Hook `useOfferTests`
En `src/hooks/useSupabaseData.ts`:
- `useOfferTests(liveId)` — trae segmentos de un live específico
- `useAddOfferTest()` — inserta nuevo segmento
- `useDeleteOfferTest()` — elimina segmento

### 3. UI en la tabla de Lives (expandible)
En `src/pages/Lives.tsx`:
- Cada fila de la tabla tendrá un botón de expandir (chevron) que al hacer click despliega una sub-sección debajo de esa fila
- La sub-sección muestra los segmentos de prueba registrados para ese live en una mini-tabla: Hora inicio → Hora fin | Comunicación | Ventas | Pedidos | Ads | AOV | ROAS
- Botón "+ Agregar Prueba" dentro de la sub-sección para registrar un nuevo segmento inline (campos editables directos, sin modal)
- Métricas derivadas calculadas automáticamente (AOV, ROAS) por segmento
- Indicador visual en la fila principal si ese live tiene pruebas registradas (badge con cantidad)

### 4. Sección de comparación
Debajo de la tabla principal, una sección colapsable "Comparativa de Ofertas" que:
- Agrupa todos los segmentos de prueba de todos los lives filtrados
- Muestra una tabla comparativa: Comunicación | # Pruebas | Ventas Totales | Pedidos | AOV Prom | ROAS Prom
- Permite ver qué comunicaciones/ofertas han rendido mejor históricamente
- Se filtra automáticamente por host si hay filtro activo

### Archivos a modificar
- **Nueva migración SQL** — crear tabla `live_offer_tests`
- **`src/hooks/useSupabaseData.ts`** — hooks para CRUD de offer tests
- **`src/pages/Lives.tsx`** — filas expandibles + sección comparativa

### Flujo del usuario
1. Registra un live normalmente (fecha, host, venta total, ads total)
2. Expande la fila del live → agrega segmentos de prueba con hora inicio/fin, comunicación usada, ventas y pedidos de ese tramo
3. Ve la comparativa al fondo de la página para evaluar qué comunicaciones funcionan mejor

