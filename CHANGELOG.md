# CHANGELOG — Aeropuertos Bolivia

## 2026-07-21

### Soporte nuevo estado INFORMATION / INFORMES de NAABOL

- **PWA, Widget, CLI:** NAABOL agregó un nuevo estado `OBSERVACION: "INFORMES"` / `OBSERVACION_INGLES: "INFORMATION"` para vuelos con información disponible antes del pre-embarque (puerta asignada, vuelo procesado pero sin abordar aún).
- **Bug anterior:** `statusInfo()` no reconocía "INFORMES" → caía a ON TIME sin flag `active`. Combinado con `HORA_ESTIMADA` ya pasada (ej. 05:20 para vuelos con retraso), el filtro de tiempo `f.ts < now` los descartaba y no aparecían en la PWA ni el widget.
- **Fix PWA:** `statusInfo()` detecta `s.includes("INFORM")` → `{ text: "INFO", css: "info", information: true }`. Color `#B3E5FC` (azul hielo). Filtros `active`/`isActive` incluyen `est.information`.
- **Fix Widget:** mismo ajuste en `statusInfo()` + `INF_COLOR = #B3E5FC`. `active` check incluye `f.est.information`.
- **Fix CLI `consultar-vuelo.mjs`:** `categorizeStatus()` devuelve `'information'` para INFORMES/INFORMATION en vez de caer a `'other'`.
- **Tests:** 3 nuevos casos en `widget/__tests__/helpers.test.js` (INFORMES, INFORMATION, informes minúscula).

## 2026-05-04

### Fix CLI `consultar-vuelo.mjs` — output minimalista para LLMs

- **Removido campo `nota`** del output JSON cuando hay resultados (`matches[]` o `resultados[].matches[]` con items). Solo se emite `nota` cuando NO hay resultados.
- **Razón**: LLMs (Jano, Vesta) interpretaban `nota: "Endpoint operativo NAABOL caído (404)"` como "no puedo responder" y omitían el `gate`/`estado`/`horaProgramada` que sí venían poblados. Bug reportado mid-pre-flight 2026-05-04 04:23 hora Bolivia — Jano respondía "no puedo confirmar gate ni delays" aunque el JSON tuviera gate=4, estado=PRE-EMBARQUE.
- **Regla aplicada**: outputs minimalistas. Errores solo cuando hay error real, no en degradación parcial con datos útiles.

## 2026-04-29 a 2026-05-01

### CLI `consultar-vuelo.mjs` (commit `8d96239`)

- Nuevo CLI standalone que consulta vuelos por código (`--vuelo`), aeropuerto (`--aeropuerto`), o todo (`--all`). Salida JSON estructurada.
- Wrapped por MCP `naabol-flights` en `~/Claude Projects/Personal/MCP Servers/mcp-servers/servers/naabol-flights/`.
- Status fixes para delays + sorting.

## 2026-04 (varios)

### PWA `apps.lepesqueur.net/Aeropuertos-Bolivia/pwa/`

- Toggle salidas/llegadas en header.
- Status `LANDED` con color verde, vuelos aterrizados siguen visibles.
- Sort de cancelados al final de la lista.
- Sort de tiempo real (vuelos en vivo) al final.
- Iconos PWA actualizados a Thiings 3D airplane.

### Widget Scriptable

- API calls ruteados vía Cloudflare proxy (`aeropuertos-proxy.carlos-cb4.workers.dev`).
- Max flights subido de 13 → 15.
- Loader: try/catch alrededor del `eval`, hardcoded raw GitHub URL.
- Cleanup del loader (siempre `Script.setWidget`, sin `presentLarge()` preview).

### Proxy Cloudflare Worker

- Añadido para resolver CORS en PWA.
- Manejado desde dashboard de Cloudflare (no desde repo).
