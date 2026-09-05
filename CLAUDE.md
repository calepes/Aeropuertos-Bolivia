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
- **⚠️ Divergencia deliberada desde 2026-09-05:** el fix de fechas (`dateWithHHMM`) se aplicó SOLO a la PWA. `widget/helpers.js:114` y `widget/widget-vuelos-naabol.js:170` conservan el `todayWithHHMM` viejo con el bug del tablero en blanco de noche. Cal confirmó que **ya no usa el widget de iOS**, así que no se tocó. Si alguna vez se reactiva, portar el fix antes de usarlo.

### API NAABOL
- Datos de vuelos vienen de `fids.naabol.gob.bo` — endpoints de itinerario (hora programada) y operativo (hora real + estado)
- **Endpoint operativo NAABOL caído:** `/Fids/operativo/vuelos` devuelve 404 (reconfirmado 2026-09-05, responde HTML). PWA y widget funcionan solo con itinerario. Si vuelve, se usará automáticamente — por eso la rama `flightsFromOps` sigue en el código aunque hoy nunca ejecute (`opsMap` siempre vacío).
- **Solo devuelve HOY, y no acepta fecha.** Probados `?fecha=`, `?FECHA=` y `?dia=` (2026-09-05): los tres se ignoran, siempre responde el día en curso. No hay forma de traer el itinerario de mañana.
- **`HORA_PROGRAMADA` no existe en el payload.** Los campos reales son `HORA_ESTIMADA` y `HORA_REAL`. Cualquier `f.HORA_PROGRAMADA || f.HORA_ESTIMADA` cae siempre al segundo.
- **Cada fila trae `FECHA`** (ej. `"2026-09-05 00:00:00.000"`). Es la fuente de verdad del día — no inferirlo comparando la hora contra el reloj (ver el bug de abajo).
- **Poda los vuelos ya operados con rezago de ~1-1,5 h**, no al instante ni a fin de día. Medido 2026-09-05 14:51: Trinidad seguía listando su salida de las 13:30. Consecuencia: la lista casi siempre contiene filas cuya hora ya pasó.
- **La página oficial (`fids.naabol.gob.bo`) usa este MISMO endpoint** (`js/inti.js`) y lo renderiza crudo, sin filtrar. Si la oficial muestra algo y la PWA no, la diferencia es siempre filtrado nuestro.
- **Output CLI minimalista**: `cli/consultar-vuelo.mjs` omite el campo `nota` cuando `matches[]` trae items — solo aparece sin resultados. Mantener outputs minimalistas para no confundir LLMs que wrapean el CLI (ver CHANGELOG 2026-05-04).
- **RUTA0 vs RUTA:** `-` como separador en RUTA0, `>>` en RUTA. Ambos indican multidestino.
- **Estados arrivals:** La API usa "EN TIERRA" para vuelos aterrizados. `statusInfo()` detecta TIERRA, ATERRI y LANDED.

### PWA
- **Cantidad de vuelos responsive:** Calcula dinámicamente cuántos vuelos mostrar según viewport (mín 5). Se recalcula al rotar/redimensionar.
- **PWA como ícono iOS:** No hay service worker. Para forzar actualización tras deploy, eliminar ícono y re-agregar desde Safari.
- **Dev local sin datos:** `python3 -m http.server` sirve la PWA pero el proxy CORS rechaza localhost. Para probar con datos reales, deployar a GitHub Pages.
- **Proxy CORS:** Cloudflare Worker en `https://aeropuertos-proxy.carlos-cb4.workers.dev`, código en `proxy/worker.js`, deploy con `wrangler deploy` desde `proxy/`. Endurecido 2026-09-05: allowlist de dominio por match exacto, solo `https:`, `Content-Type` fijo + `nosniff`, `Access-Control-Allow-Origin` acotado a `apps.lepesqueur.net`, y rate limiting por IP (binding `RATE_LIMITER`, 20 req/60s).
- **Caché de borde en workers.dev — verificado, no asumido (2026-09-05):** pese a que `workers.dev` no tiene configuración de caché de zona, el `Cache-Control: public, max-age=60` que devuelve el worker SÍ hace que Cloudflare sirva de borde: repetir la MISMA URL 26 veces no invoca el Worker ni una sola vez (0 llegaron al rate limiter). Con URL cache-busted el Worker sí corre y el límite dispara. **Consecuencia al testear:** cualquier prueba contra el worker que necesite ejecutarlo de verdad tiene que variar la query string, o vas a medir la caché y no tu código.
- **`wrangler deploy` necesita login OAuth propio.** El `CF_API_TOKEN` de 1Password (vault `Daemons`) NO alcanza — está scopeado a KV/Queues y falla con `Authentication error [code: 10000]`. Y `wrangler login` es interactivo: hay que correrlo en una Terminal real, no desde Claude Code. Ver memoria `reference_wrangler_config_path_movida`.
- **Bug del tablero vacío de noche (resuelto en la PWA 2026-09-05):** `todayWithHHMM()` asumía que una hora ya pasada era "de mañana" y sumaba 24 h. Como NAABOL deja los vuelos operados en la lista (ver API arriba), de noche TODAS las filas se empujaban a +17/+23 h, caían fuera de `HOURS_AHEAD` (12 h) y el tablero quedaba en blanco mientras la página oficial sí mostraba vuelos. Reemplazado por `dateWithHHMM(f.FECHA, f.HORA_ESTIMADA)`, que ancla al día que trae el payload. Se eliminó también el contra-hack `if (isActive && ...) prog.setDate(-1)`, que existía solo para deshacer ese empujón. Y si no queda nada por delante, en vez de tablero en blanco se muestra la cola de lo que NAABOL sigue listando (`todos.slice(-maxFlights())`) — igual que la oficial.
- **Deploy de la PWA:** NO va por `calepes.github.io`. `Aeropuertos-Bolivia` tiene **Pages propio** (`source: main /`), servido como project page bajo el dominio del user site → `apps.lepesqueur.net/Aeropuertos-Bolivia/pwa/`. Push a `main` de ESTE repo = deploy. Sigue en pipeline `legacy` (Jekyll), no `workflow`; `https_enforced` está en `false`.

### Widget
- `widget-vuelos-naabol.js` usa APIs de Scriptable (`ListWidget`, `Color`, `Request`, `SFSymbol`, `args`) — no se puede ejecutar en Node
- Los 12 aeropuertos bolivianos están hardcodeados en `AIRPORTS`. Default: VVI (Viru Viru, Santa Cruz)
- El loader baja el widget desde `raw.githubusercontent.com` con fallback a cache iCloud
