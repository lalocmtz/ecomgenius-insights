# 🎯 Instrucciones Finales: Panel Admin + CoWork

## ✅ Lo que ya hicimos

- ✅ Panel Admin UI mejorado en `/admin/dashboard`
- ✅ APIs de estadísticas y asignación de marcas
- ✅ Herramienta CoWork para extraer datos del Seller Center
- ✅ Migrations de BD
- ✅ Todo committeado a GitHub

## 📋 PASOS PARA COMPLETAR (haz esto en orden)

### PASO 1: Ejecutar Migration en Supabase (5 min)

1. Ve a: https://app.supabase.com → Tu proyecto
2. **SQL Editor** → **New Query**
3. Abre el archivo: `database/migrations/admin-cowork.sql`
4. Copia TODO el contenido
5. Pégalo en el editor de SQL
6. Click **Run** (o Ctrl+Enter)
7. Espera mensaje: ✅ Success

**Esto crea las tablas para:**
- admin_audit_logs (logs de todas las acciones admin)
- seller_connections (credenciales encriptadas)
- extracted_data (datos del Seller Center)
- extraction_logs (registro de extracciones)

---

### PASO 2: Crear el usuario Admin en Supabase (3 min)

1. Supabase → **Authentication** (menú izq)
2. Click **Create User** (arriba derechita)
3. Completa:
   - Email: `lalocmtz@gmail.com`
   - Password: `America94.`
4. Click **Create User**
5. Espera ✅

---

### PASO 3: Asignar Admin a Todas las Marcas (2 min)

1. **SQL Editor** → **New Query**
2. Copia y pega:

```sql
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'lalocmtz@gmail.com'
)
INSERT INTO user_brands (user_id, brand_id, is_admin)
SELECT admin_user.id, brands.id, true
FROM admin_user, brands
ON CONFLICT DO NOTHING;
```

3. Click **Run**
4. Espera ✅

---

### PASO 4: Agregar API Key a Vercel (2 min)

1. Ve a: Vercel → ecomgenius-intelligence → **Settings**
2. **Environment Variables** (menú izq)
3. Click **Add New**
4. Completa:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: (IRÁ AQUÍ - sigue el próximo paso)

**Primero obtén la key:**
1. Supabase → **Settings** → **API** (al final)
2. Busca: **Project API keys**
3. Copia el valor de **service_role** (línea que empieza con `eyJ...`)
4. Vuelve a Vercel y pégalo en **Value**
5. Selecciona: `Production`, `Preview`, `Development`
6. Click **Save**

---

### PASO 5: Deploy a Vercel (1 min)

```bash
cd /Users/eduardo/ecomgenius-intelligence

git push origin main
```

Vercel detecta el push automáticamente. En 2-3 min deberás ver:
- ✅ Production: Ready

---

### PASO 6: Instalar CoWork Localmente (3 min)

⚠️ **ESTO SOLO EN TU COMPUTADORA** (no en Vercel)

```bash
cd /Users/eduardo/ecomgenius-intelligence/apps/cowork

npm install

npm run dev setup
```

Te pedirá:
- Email del Seller Center
- Contraseña
- ID de marca (opcional)

Eso genera: `~/.cowork/config.json`

---

## 🧪 PRUEBAS

### Test 1: Panel Admin

1. Abre: https://ecomgenius-intelligence.vercel.app/admin/dashboard
2. Inicia sesión como: `lalocmtz@gmail.com` / `America94.`
3. Deberías ver:
   - Dashboard con estadísticas
   - Tabla de usuarios
   - Botón "Editar" para cada usuario

4. Crea un usuario test:
   - Ve a `/signup`
   - Email: `test@example.com`, Pass: `Test1234`

5. Vuelve al dashboard admin:
   - Busca `test@example.com`
   - Click "Editar"
   - Selecciona una marca
   - Click "Guardar"

✅ Si todo funciona → Test passed

### Test 2: CoWork

**LOCAL (en tu Mac):**

```bash
cd apps/cowork

npm run dev extract
```

Se abrirá automáticamente:
1. 🌐 Navegador Chrome
2. 🔐 Login automático
3. 📊 Extrae Overview, Campaigns, Products, etc.
4. 💾 Guarda en `~/.cowork/data/`
5. 🔄 Sincroniza con Supabase

Espera a que terminen todas las extracciones.

**Verifica que funcionó:**

```bash
ls ~/.cowork/data/

# Deberías ver carpetas como:
# default/
# 2024-04-12_2024-04-12.json
```

✅ Si ves los archivos → Test passed

---

## 🎮 USO NORMAL

### Día a día del Admin

1. Abre: https://ecomgenius-intelligence.vercel.app/admin/dashboard
2. Ver usuarios registrados
3. Asignar marcas a nuevos usuarios
4. Ver logs de qué hiciste

### Día a día de CoWork

**Cada mañana O cuando quieras extraer datos:**

```bash
cd ~/ecomgenius-intelligence/apps/cowork

npm run dev extract
```

Eso es. Se abre solo, navega solo, extrae solo. ✨

**Listar lo que ya extrajiste:**

```bash
npm run dev list
```

---

## 🔒 SEGURIDAD & PRIVACY

- ✅ Contraseña del Seller Center se encripta localmente (no se envía)
- ✅ El admin solo ve lo de sus usuarios
- ✅ Cada usuario solo ve sus propios datos extraídos
- ✅ Todos los cambios se logean en `admin_audit_logs`

---

## 🚀 PRÓXIMAS MEJORAS (opcionales)

- [ ] Automatizar CoWork cada mañana (cron job)
- [ ] UI para importar usuarios CSV
- [ ] Reportes por marca
- [ ] Descarga de datos en Excel
- [ ] Notificaciones vía email

---

## 📞 ¿ALGO NO FUNCIONA?

**Panel Admin no carga:**

```bash
npx tsc --noEmit  # Verifica TypeScript
```

**CoWork falla al login:**

- Verifica email/contraseña correctos en `~/.cowork/config.json`
- Si TikTok pide CAPTCHA, haz login manual primero en incógnito

**Datos no aparecen en Supabase:**

- Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté en Vercel Settings
- Redeploy: `git push origin main`

---

## ✨ LISTO

Una vez hagas todos estos pasos:

1. ✅ Tendrás panel admin funcional en `/admin/dashboard`
2. ✅ Tendrás CoWork extrayendo datos automáticamente
3. ✅ Todo sincronizado con Supabase
4. ✅ Pronto para producción

¿Necesitas ayuda en algún paso? Avísame. 🚀
