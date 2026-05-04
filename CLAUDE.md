# CLAUDE.md – Guía para Claude Code

## Proyecto

Repositorio monorepo para aplicaciones de aeropuertos bolivianos (NAABOL).

## Estructura

```
widget/    — Widget de salidas de vuelos para iOS (Scriptable)
pwa/       — Progressive Web App de vuelos (salidas y llegadas, deployada en GitHub Pages)
proxy/     — Cloudflare Worker para CORS proxy (deployado manualmente via wrangler)
```

### Widget (`widget/`)

- `widget-vuelos-naabol.js` — Script principal del widget (Scriptable API, no importable en Node)
- `loader-scriptable.js` — Auto-loader desde GitHub con cache iCloud
- `helpers.js` — Funciones puras extraídas del widget, exportadas como CommonJS para testing
- `__tests__/` — Suite de tests Jest

### PWA (`pwa/`)

- `index.html` — App completa: HTML + CSS + JS inline, sin framework ni build tools
- `manifest.json` — PWA manifest (standalone, tema negro)
- `icons/` — SVG icons para PWA y favicon
- **URL:** `https://apps.lepesqueur.net/Aeropuertos-Bolivia/pwa/`

## Comandos

- `cd widget && npm test` — Ejecuta todos los tests con Jest (1 suite)
- `cd widget && npm install` — Instala dependencias (solo jest como devDependency)
- `cd pwa && python3 -m http.server` — Dev server local para la PWA
- `curl -s "https://fids.naabol.gob.bo/Fids/itin/vuelos?aero=Viru%20Viru&tipo=S" | python3 -m json.tool` — Consultar API NAABOL (tipo=S salidas, tipo=L llegadas)
- `cd proxy && npx wrangler deploy` — Deploy proxy a Cloudflare (requiere auth en Cloudflare)

## Tests

Los tests cubren las funciones puras en `widget/helpers.js`:
- Normalización de horas, aerolíneas, destinos y estados de vuelo
- Integridad de mapas IATA (aerolíneas y destinos)
- Variantes con/sin acentos

Para agregar tests: crear archivos `widget/__tests__/*.test.js`

## Consideraciones

### Workflow
- **Siempre `git pull` antes de editar:** Otras sesiones de Claude Code pueden haber pusheado cambios via PRs. Hacer pull al inicio para evitar conflictos.
- **Sincronización crítica:** Al modificar funciones helper, copiar cambios entre `widget-vuelos-naabol.js` ↔ `helpers.js` (son copias, no comparten código)
- **Sincronización PWA↔Widget:** Los mapas IATA y helpers están duplicados en `pwa/index.html` y `widget/widget-vuelos-naabol.js`. Al modificar uno, actualizar el otro.

### API NAABOL
- Datos de vuelos vienen de `fids.naabol.gob.bo` — endpoints de itinerario (hora programada) y operativo (hora real + estado)
- **Endpoint operativo NAABOL caído:** `/Fids/operativo/vuelos` devuelve 404. PWA y widget funcionan solo con itinerario. Si vuelve, se usará automáticamente.
- **Output CLI minimalista**: `cli/consultar-vuelo.mjs` omite el campo `nota` cuando `matches[]` trae items — solo aparece sin resultados. Mantener outputs minimalistas para no confundir LLMs que wrapean el CLI (ver CHANGELOG 2026-05-04).
- **RUTA0 vs RUTA:** `-` como separador en RUTA0, `>>` en RUTA. Ambos indican multidestino.
- **Estados arrivals:** La API usa "EN TIERRA" para vuelos aterrizados. `statusInfo()` detecta TIERRA, ATERRI y LANDED.

### PWA
- **Cantidad de vuelos responsive:** Calcula dinámicamente cuántos vuelos mostrar según viewport (mín 5). Se recalcula al rotar/redimensionar.
- **PWA como ícono iOS:** No hay service worker. Para forzar actualización tras deploy, eliminar ícono y re-agregar desde Safari.
- **Dev local sin datos:** `python3 -m http.server` sirve la PWA pero el proxy CORS rechaza localhost. Para probar con datos reales, deployar a GitHub Pages.
- **Proxy CORS:** Cloudflare Worker en `https://aeropuertos-proxy.carlos-cb4.workers.dev`. Se administra desde dashboard de Cloudflare (cuenta carlos-cb4), no desde este repo.

### Widget
- `widget-vuelos-naabol.js` usa APIs de Scriptable (`ListWidget`, `Color`, `Request`, `SFSymbol`, `args`) — no se puede ejecutar en Node
- Los 12 aeropuertos bolivianos están hardcodeados en `AIRPORTS`. Default: VVI (Viru Viru, Santa Cruz)
- El loader baja el widget desde `raw.githubusercontent.com` con fallback a cache iCloud
