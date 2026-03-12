# CLAUDE.md – Guía para Claude Code

## Proyecto

Repositorio monorepo para aplicaciones de aeropuertos bolivianos (NAABOL).

## Estructura

```
widget/    — Widget de salidas de vuelos para iOS (Scriptable)
pwa/       — Progressive Web App de salidas (en desarrollo, ver spec)
proxy/     — Cloudflare Worker CORS proxy (por crear)
docs/      — Specs de diseño
```

### Widget (`widget/`)

- `widget-vuelos-naabol.js` — Script principal del widget (Scriptable API, no importable en Node)
- `loader-scriptable.js` — Auto-loader desde GitHub con cache iCloud
- `helpers.js` — Funciones puras extraídas del widget, exportadas como CommonJS para testing
- `functions/exchange.js` — Cloudflare Worker para tipo de cambio USD/BOB (ESM)
- `index.html` — Página web de tipo de cambio
- `__tests__/` — Suite de tests Jest

### PWA (`pwa/`) — En desarrollo

Spec de diseño: `docs/superpowers/specs/2026-03-12-pwa-salidas-design.md`

## Comandos

- `cd widget && npm test` — Ejecuta todos los tests con Jest (46 tests, 2 suites)
- `cd widget && npm install` — Instala dependencias (solo jest como devDependency)
- `cd pwa && python3 -m http.server` — Dev server local para la PWA
- `cd proxy && npx wrangler deploy` — Deploy del proxy CORS a Cloudflare

## Tests

Los tests cubren las funciones puras en `widget/helpers.js` y la lógica del endpoint `widget/functions/exchange.js`:
- Normalización de horas, aerolíneas, destinos y estados de vuelo
- Integridad de mapas IATA (aerolíneas y destinos)
- Variantes con/sin acentos
- Endpoint de tipo de cambio (mock de fetch/Response)

Para agregar tests: crear archivos `widget/__tests__/*.test.js`

## Consideraciones

- `widget-vuelos-naabol.js` usa APIs de Scriptable (`ListWidget`, `Color`, `Request`, `SFSymbol`, `args`) — no se puede ejecutar en Node directamente
- `functions/exchange.js` usa ESM (`export`) — los tests replican la lógica inline en vez de importar
- **Sincronización crítica:** Al modificar funciones helper en `widget-vuelos-naabol.js`, copiar los cambios a `helpers.js` manualmente (no comparten código, son copias)
- Los 12 aeropuertos bolivianos están hardcodeados en `AIRPORTS`
- El widget por defecto muestra VVI (Viru Viru, Santa Cruz)
- El loader (`loader-scriptable.js`) baja el widget desde `raw.githubusercontent.com` (no usa la API de GitHub) con fallback a cache iCloud
- Datos de vuelos vienen de `fids.naabol.gob.bo` — endpoints de itinerario (hora programada) y operativo (hora real + estado)
