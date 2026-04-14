

## Plan: Agregar función para crear hosts nuevos

### Problema actual
Los hosts están hardcodeados como `const HOSTS = ['DENISSE', 'EMILIO', 'FER', 'KARO']` en `Lives.tsx`. No hay forma de agregar nuevos hosts desde la plataforma.

### Solución

**1. Crear tabla `hosts` en la base de datos**
- Columnas: `id` (uuid), `name` (text, unique), `brand` (text), `color` (text), `created_at` (timestamp)
- RLS: lectura pública, inserción pública (no hay auth implementada)
- Insertar los 4 hosts existentes como seed data

**2. Crear hook `useHosts`** en `useSupabaseData.ts`
- Query que trae hosts filtrados por `activeBrand` (o globales)
- Mutation para insertar nuevo host

**3. Modificar `Lives.tsx`**
- Reemplazar `const HOSTS` hardcodeado por datos del hook `useHosts`
- Agregar un pequeño modal/dialog para crear host nuevo: solo pide nombre y color
- El botón para agregar host aparece al final de los filtros de host (un "+" junto a los pills)
- Los selects de host en la tabla editable y en el modal "Agregar Live" también usan la lista dinámica
- Asignar colores automáticos de un pool predefinido si no se elige uno

### Archivos a modificar
- **Nueva migración SQL**: crear tabla `hosts` con seed data
- **`src/hooks/useSupabaseData.ts`**: agregar `useHosts()` y `useAddHost()`
- **`src/pages/Lives.tsx`**: reemplazar HOSTS hardcodeado, agregar UI para nuevo host

