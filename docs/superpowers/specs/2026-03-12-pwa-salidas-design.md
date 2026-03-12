# PWA Salidas de Vuelos — Design Spec

## Objetivo

PWA que muestra salidas de vuelos en tiempo casi real desde aeropuertos NAABOL (Bolivia), replicando la funcionalidad y estilo visual del widget Scriptable existente, pero accesible desde cualquier navegador móvil.

## Arquitectura

```
pwa/
├── index.html          ← Página única, CSS + JS inline
├── manifest.json       ← PWA metadata (standalone, theme negro)
└── icons/
    ├── icon.svg        ← Favicon
    ├── icon-192.svg    ← PWA icon 192x192
    └── icon-512.svg    ← PWA icon 512x512

proxy/
├── worker.js           ← Cloudflare Worker (CORS proxy)
└── wrangler.toml       ← Config del worker
```

### Decisiones clave

- **Sin framework** — vanilla HTML/CSS/JS con ES modules
- **Sin build tools** — archivos estáticos servidos as-is
- **Sin service worker** — siempre requiere conexión
- **Sin dependencias npm** — zero dependencies
- **Proxy CORS obligatorio** — `fids.naabol.gob.bo` no envía headers CORS

## Proxy Cloudflare

Worker idéntico al patrón de Combustible (`combustible-proxy`):

- Nombre: `aeropuertos-proxy`
- Whitelist: solo `fids.naabol.gob.bo`
- Cache: 60 segundos
- Métodos: GET, OPTIONS (preflight)
- CORS headers: `Access-Control-Allow-Origin: *`
- Deploy: `cd proxy && npx wrangler deploy`

URL resultante: `https://aeropuertos-proxy.<account>.workers.dev`

## Fuentes de datos

Dos endpoints NAABOL, consultados via proxy:

1. **Itinerario**: `https://fids.naabol.gob.bo/Fids/itin/vuelos?aero={query}&tipo=S`
   - Hora programada, ruta, aerolínea, número de vuelo
2. **Operativo**: `https://fids.naabol.gob.bo/Fids/operativo/vuelos?aero={query}&tipo=S`
   - Hora real, estado del vuelo

## Lógica de negocio

Reutilizada del widget existente (`widget/widget-vuelos-naabol.js`), adaptada a DOM:

- **Merge**: Itinerario define vuelos, operativo complementa con hora real + estado
- **Indexación**: Por `código aerolínea + número de vuelo`
- **Ventana**: Próximas 12 horas (`HOURS_AHEAD = 12`)
- **Máximo**: 13 vuelos mostrados (`MAX_FLIGHTS = 13`)
- **Fix día siguiente**: Horas menores a la actual se asumen del día siguiente
- **Estados activos** (PRE, EMB, DEM): Se muestran siempre aunque la hora haya pasado
- **Orden**: Por hora real (si existe), sino hora programada

### Normalización

- **Aerolíneas**: Diccionario IATA principal + fallback para variantes no estándar (BOA, LATAM, Copa, etc.)
- **Destinos**: Primer destino como código IATA, `+` si tiene escalas
- **Estados**: PRE, EMB, DEM, CAN, OK (detectados en español e inglés)
- **Horas**: Formato HH:MM normalizado

## Interfaz

### Selector de aeropuerto

- Dropdown `<select>` al tope de la página
- 12 aeropuertos NAABOL
- Default: VVI (Viru Viru, Santa Cruz)
- Al cambiar, recarga datos automáticamente

### Tabla de vuelos — Estilo split-flap board

Réplica visual del widget:

- **Fondo**: Negro `#0A0A0A`
- **Cards**: Oscuras `#1C1C1E` por carácter individual
- **Fuente**: Monoespaciada bold

#### Header
- Icono avión (emoji o SVG) + "DEPARTURES" en blanco + reloj en verde `#4CAF50`

#### Columnas

| Columna | Chars | Descripción |
|---------|-------|-------------|
| TIME | 5 | HH:MM |
| DST | 4 | Código IATA destino + `+` si escalas |
| FLIGHT | 6 | Aerolínea + número |
| RMKS | 3 | Estado |

#### Colores de datos

| Elemento | Color |
|----------|-------|
| Hora programada | Amarillo `#FFD600` |
| Hora actualizada | Naranja `#FF9800` |
| Estado OK | Blanco `#FFFFFF` |
| Estado PRE | Amarillo `#FFD600` |
| Estado EMB | Verde `#4CAF50` |
| Estado DEM/CAN | Rojo `#FF3D00` |
| Títulos columna | Gris `#CCCCCC` |

### Responsive

- Ancho completo en móvil
- Cards se escalan proporcionalmente al ancho de pantalla
- Max-width en desktop para mantener legibilidad

### Refresh

- Botón de refresh manual en el header
- Auto-refresh cada 5 minutos
- Indicador visual de última actualización

## PWA Manifest

```json
{
  "name": "Aeropuertos Bolivia — Salidas",
  "short_name": "Salidas",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#0A0A0A",
  "theme_color": "#0A0A0A",
  "icons": [
    { "src": "icons/icon-192.svg", "sizes": "192x192", "type": "image/svg+xml" },
    { "src": "icons/icon-512.svg", "sizes": "512x512", "type": "image/svg+xml" }
  ]
}
```

## Deploy

- **PWA**: GitHub Pages desde el repo `Aeropuertos-Bolivia` (carpeta `pwa/`)
- **Proxy**: Cloudflare Workers via `wrangler deploy`

## Diferencias con el widget Scriptable

| Aspecto | Widget | PWA |
|---------|--------|-----|
| Selector aeropuerto | Parámetro fijo en widget config | Dropdown interactivo |
| Refresh | Controlado por iOS | Botón manual + auto 5min |
| Layout | Fijo al tamaño del widget | Responsive, llena pantalla |
| CORS | No aplica | Proxy Cloudflare |
| Offline | Cache iCloud via loader | No soportado |
| Plataforma | Solo iOS con Scriptable | Cualquier navegador |

## Fuera de alcance

- Llegadas de vuelos
- Service worker / cache offline
- Notificaciones push
- Búsqueda de vuelos
- Múltiples aeropuertos simultáneos
