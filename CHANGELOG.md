# CHANGELOG — Aeropuertos Bolivia

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
