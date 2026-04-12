# 🐝 CoWork - Herramienta de Extracción Automática del Seller Center

Herramienta CLI que automatiza la extracción de datos del TikTok Shop Seller Center. Se conecta automáticamente, navega por todas las secciones y descarga los datos.

## ⚡ Instalación Rápida

```bash
cd apps/cowork
npm install
npm run dev setup
```

## 🚀 Uso

### 1. **Primera vez: Configurar credenciales**

```bash
npm run dev setup
```

Te pedirá:
- Email del Seller Center
- Contraseña (se encripta localmente)
- ID de la marca (opcional)

### 2. **Extraer datos**

```bash
npm run dev extract
```

O simplemente:

```bash
npm run dev
```

Se abrirá automáticamente:
1. ✅ Navegador (puedes monitorear)
2. ✅ Login automático
3. ✅ Navegación a cada sección
4. ✅ Descarga de datos
5. ✅ Sincronización con Supabase

### 3. **Listar períodos extraídos**

```bash
npm run dev list
```

## 📂 Estructura de Datos

Los datos se guardan en: `~/.cowork/data/{brand_id}/`

```
├── 2024-04-12_2024-04-12.json     # Overview, Campaigns, Products, etc.
├── 2024-04-13_2024-04-13.json
└── 2024-04-14_2024-04-14.json
```

También se sincroniza con Supabase en la tabla `extracted_data`.

## 🔒 Seguridad

- Credenciales guardadas localmente en `~/.cowork/config.json` (no se envían)
- Contraseña encriptada cuando se envía a Supabase (nunca se almacena)
- Archivos locales: solo lectura/escritura de tu usuario

## 📦 Datos Extraídos

Cada extracción incluye:

```json
{
  "overview": { /* Métricas principales */ },
  "campaigns": [ /* Lista de campañas */ ],
  "products": [ /* Lista de productos */ ],
  "affiliates": [ /* Afiliados */ ],
  "creatives": [ /* Creativos de video */ ]
}
```

## 🛠️ Desarrollo

```bash
# Build TypeScript
npm run build

# Tests
npm test

# Start production
npm start
```

## ⚙️ Configuración Avanzada

Edita `~/.cowork/config.json`:

```json
{
  "seller_email": "tu-email@gmail.com",
  "seller_password": "tu-contraseña",
  "user_id": "uuid-de-supabase",
  "brand_id": "uuid-de-la-marca"
}
```

## 🐛 Troubleshooting

### "Configuración no disponible"

```bash
npm run dev setup
```

### "Error al iniciar sesión"

- Verifica email/contraseña
- Comprueba que TikTok Shop no requiera CAPTCHA/2FA
- Intenta con incógnito: `npm run dev extract -- --incognito`

### Datos no se sincronizan

- Verifica que `NEXT_PUBLIC_SUPABASE_URL` esté en `.env`
- Comprueba permisos en Supabase table `extracted_data`

## 🔄 Automatización (próximo)

Para extraer automáticamente cada mañana:

```bash
# macOS/Linux
0 9 * * * cd ~/ecomgenius-intelligence/apps/cowork && npm run dev extract
```

Agrega a: `crontab -e`
