# SAIKI EMOTES — ROBLOX EMOTE CATALOG

Una GUI de catálogo de **emotes UGC reales de Roblox**: buscar, explorar,
marcar favoritos, ver datos y copiar el **asset ID** verdadero de cada emote.
El diseño replica una interfaz tipo GUI flotante de Roblox: panel central
gris claro, botones circulares (tema / bloqueo), buscador, cuadrícula de
5 × 3 tarjetas, paginación y barra inferior con EMOTES · FAVORITES · COPY ·
SETTINGS.

> ⚠️ Catálogo **no oficial** de fans. Todos los emotes, nombres, creadores,
> precios y miniaturas pertenecen a sus creadores y a Roblox Corporation.

---

## ✅ Datos reales (no inventados)

Cada emote del catálogo es un **asset real del Marketplace de Roblox**:

| Campo | Origen |
|---|---|
| Nombre, creador, precio, favoritos, fecha, descripción | `catalog.roblox.com/v1/search/items/details` (categoría 12 / subcategoría 39 — *Emotes*, asset type 61) |
| Miniaturas | `thumbnails.roblox.com/v1/assets` (URLs firmadas de la CDN `tr.rbxcdn.com`) |
| Verificación por ID | `economy.roblox.com/v2/assets/{id}/details` |

El catálogo **solo** incluye emotes UGC (los publicados por la cuenta
oficial de Roblox se excluyen / se marcan). No se inventa ningún
identificador: si un dato no está disponible, se muestra como
*no disponible*, y no se puede añadir ningún emote sin verificarlo antes
contra la API de Roblox.

### Dos fuentes de datos

1. **Base de datos incluida** — `data/emotes.js`: 149 emotes UGC verificados
   (los más marcados como favoritos) con miniaturas firmadas. Se genera con
   `scripts/update-db.mjs` y se ensambla con `scripts/build-db.mjs`.
2. **Catálogo en vivo** — el navegador consulta la API pública de Roblox a
   través del espejo comunitario **roproxy.com** (que añade `Access-Control-
   Allow-Origin: *`; las APIs de Roblox no envían CORS). Se fusiona con la
   base incluida, amplía el catálogo hasta ~360 emotes y habilita
   *"Search all Roblox emotes…"*. Si no hay conexión, la GUI sigue
   funcionando al 100 % con la base incluida (chip de estado arriba a la
   derecha). Todas las peticiones van con *rate-limit* y caché.

## 🧭 Funciones

- 🔍 **Buscar** — filtra al instante la colección cargada y, en modo live,
  busca además en **todo** el catálogo de emotes de Roblox (≥3 caracteres,
  con debounce y caché).
- 🖼️ **Miniaturas reales** de la CDN de Roblox; si un asset fue eliminado o
  la URL firmada caducó, la tarjeta muestra *"Thumbnail unavailable"* en
  lugar de datos falsos.
- ⭐ **Favoritos** persistentes (localStorage) + pestaña FAVORITES.
- 📄 **Detalles** — modal con creador (badge de verificado), precio, nº de
  favoritos, fecha, descripción, origen del dato y botón **"Check on
  Roblox"** que verifica el asset en vivo (a la venta / retirado /
  eliminado).
- 📋 **COPY** — copia el asset ID real del emote seleccionado; también
  snippet de **Luau** para usar el emote en una experiencia.
- ➕ **Añadir emotes por ID** (Settings) — verificación obligatoria contra
  Roblox: solo se aceptan assets reales de tipo emote (61).
- 🌓 Tema claro/oscuro, 🔒 bloqueo de posición (la ventana se puede
  arrastrar por la cabecera), paginación, export/import de tus datos.
- 📱 Responsive (5 → 4 → 3 → 2 columnas).

## 🚀 Ejecutar

Es una web estática sin dependencias ni build:

```bash
# opción A — Python
python3 -m http.server 8000 --bind 0.0.0.0

# opción B — Node
npx serve .
```

Abre `http://localhost:8000`. (Abrir `index.html` con doble clic también
funciona en la mayoría de navegadores.)

## 🛠️ Ampliar el catálogo

```bash
node scripts/update-db.mjs           # re-descarga 5 páginas (150 emotes)
PAGES=10 node scripts/update-db.mjs  # hasta 600 emotes
```

Esto regenera `raw/` (snapshots) y `data/emotes.js`. La GUI no necesita
ningún cambio: la cuadrícula, la paginación y el buscador se adaptan
automáticamente a cualquier cantidad de emotes. También puedes:

- añadir emotes por ID desde **Settings → Add UGC emote** (se guardan en tu
  navegador), o
- editar `data/emotes.js` a mano respetando el esquema
  (`id, name, creator, creatorType, creatorId, creatorVerified, price,
  favorites, created, description, thumb`).

## 📁 Estructura

```
index.html            GUI (panel, buscador, grid, paginación, barra inferior)
css/style.css         Tema claro/oscuro, estilos Roblox-style
js/roblox-api.js      Cliente API de Roblox vía roproxy (throttle + caché)
js/app.js             Lógica del catálogo (vistas, búsqueda, favoritos, modal…)
data/emotes.js        Base de datos incluida (emotes UGC reales verificados)
raw/                  Snapshots crudos del catálogo (entradas del build)
scripts/build-db.mjs  Ensambla data/emotes.js desde raw/ (sin red)
scripts/update-db.mjs Re-descarga del catálogo de Roblox (con red)
```
