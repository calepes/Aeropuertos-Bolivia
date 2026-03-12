# PWA Salidas de Vuelos — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a PWA that shows real-time flight departures from Bolivian airports, replicating the existing Scriptable widget's split-flap board style in a browser.

**Architecture:** Single `index.html` with inline CSS+JS, consuming NAABOL endpoints via a Cloudflare Worker CORS proxy. All business logic (merge, normalization, maps) ported from `widget/widget-vuelos-naabol.js`. No framework, no build tools, no service worker.

**Tech Stack:** Vanilla HTML/CSS/JS (all inline, no ES modules), Cloudflare Workers (proxy), GitHub Pages (hosting)

**Spec:** `docs/superpowers/specs/2026-03-12-pwa-salidas-design.md`

**Reference:** Combustible PWA at `/Users/calepes/Documents/Claude Projects/Personal/Apps/Combustible/repo/` — same deployment pattern.

**Prerequisites:**
- Cloudflare account authenticated via `npx wrangler login` (same account as `combustible-proxy`: `carlos-cb4`)
- Git configured with SSH access to `git@github.com:calepes/Aeropuertos-Bolivia.git`

---

## File Structure

```
proxy/
├── worker.js           ← Cloudflare Worker CORS proxy (whitelist fids.naabol.gob.bo)
└── wrangler.toml       ← Worker config

pwa/
├── index.html          ← Single page: CSS inline + JS inline (all logic)
├── manifest.json       ← PWA manifest (standalone, black theme)
└── icons/
    ├── icon.svg        ← Favicon (airplane departure)
    ├── icon-192.svg    ← PWA icon 192×192
    └── icon-512.svg    ← PWA icon 512×512
```

---

## Chunk 1: Proxy + PWA Assets

### Task 1: Cloudflare Worker CORS Proxy

**Files:**
- Create: `proxy/worker.js`
- Create: `proxy/wrangler.toml`

- [ ] **Step 1: Create `proxy/wrangler.toml`**

```toml
name = "aeropuertos-proxy"
main = "worker.js"
compatibility_date = "2024-01-01"
```

- [ ] **Step 2: Create `proxy/worker.js`**

```javascript
const ALLOWED_DOMAINS = ['fids.naabol.gob.bo'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function isDomainAllowed(hostname) {
  return ALLOWED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith('.' + domain)
  );
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing ?url= parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    if (!isDomainAllowed(parsed.hostname)) {
      return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AeropuertosProxy/1.0)',
        },
      });

      const body = await response.arrayBuffer();

      return new Response(body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
          'Cache-Control': 'public, max-age=60',
          ...CORS_HEADERS,
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Fetch failed', detail: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
  },
};
```

- [ ] **Step 3: Deploy proxy**

Requires Cloudflare auth. If not logged in: `npx wrangler login`

```bash
cd proxy && npx wrangler deploy
```

Note the resulting URL (e.g., `https://aeropuertos-proxy.carlos-cb4.workers.dev`). This URL goes into the `PROXY_URL` constant in `pwa/index.html`.

- [ ] **Step 4: Test proxy manually**

```bash
curl "https://aeropuertos-proxy.carlos-cb4.workers.dev/?url=https://fids.naabol.gob.bo/Fids/itin/vuelos?aero=Viru%20Viru&tipo=S"
```

Expected: JSON array of flight data with CORS headers.

- [ ] **Step 5: Commit**

```bash
git add proxy/
git commit -m "Add Cloudflare Worker CORS proxy for NAABOL"
```

---

### Task 2: PWA Icons + Manifest

**Files:**
- Create: `pwa/icons/icon.svg`
- Create: `pwa/icons/icon-192.svg`
- Create: `pwa/icons/icon-512.svg`
- Create: `pwa/manifest.json`
- Delete: `pwa/.gitkeep` and `pwa/.gitkeep 2` (if exists)

- [ ] **Step 1: Create SVG icons**

All three use an airplane silhouette on dark background.

`pwa/icons/icon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0A0A0A"/>
  <text x="16" y="22" text-anchor="middle" font-size="18">✈️</text>
</svg>
```

`pwa/icons/icon-192.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="38" fill="#0A0A0A"/>
  <text x="96" y="120" text-anchor="middle" font-size="100">✈️</text>
</svg>
```

`pwa/icons/icon-512.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#0A0A0A"/>
  <text x="256" y="320" text-anchor="middle" font-size="260">✈️</text>
</svg>
```

- [ ] **Step 2: Create `pwa/manifest.json`**

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

- [ ] **Step 3: Remove old .gitkeep files and commit**

```bash
git rm -f pwa/.gitkeep "pwa/.gitkeep 2" 2>/dev/null
git add pwa/icons/ pwa/manifest.json
git commit -m "Add PWA manifest and icons, remove .gitkeep"
```

---

## Chunk 2: PWA Implementation

### Task 3: Create `pwa/index.html` — HTML + CSS

**Files:**
- Create: `pwa/index.html`

This step creates the complete HTML structure and all CSS. No JS yet — just the static shell.

- [ ] **Step 1: Create `pwa/index.html` with HTML structure and CSS**

The complete file content for this step:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <title>Salidas — Aeropuertos Bolivia</title>
  <link rel="manifest" href="manifest.json">
  <link rel="icon" href="icons/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="icons/icon-192.svg">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

    body {
      font-family: -apple-system, 'SF Pro Text', system-ui, sans-serif;
      background: #0A0A0A;
      color: #FFD600;
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
      padding: max(12px, env(safe-area-inset-top)) 12px 12px 12px;
    }

    .container { max-width: 480px; margin: 0 auto; }

    /* Selector */
    .selector { margin-bottom: 10px; }
    .selector select {
      width: 100%;
      padding: 8px 12px;
      background: #1C1C1E;
      color: #FFFFFF;
      border: 1px solid #333;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
    }

    /* Header */
    .board-header {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    .board-header .icon { font-size: 20px; margin-right: 6px; }
    .board-header .title {
      font: bold 16px 'SF Mono', 'Menlo', 'Courier New', monospace;
      color: #FFFFFF;
      flex: 1;
    }
    .board-header .clock {
      font: bold 16px 'SF Mono', 'Menlo', 'Courier New', monospace;
      color: #4CAF50;
    }
    .refresh-btn {
      background: none;
      border: none;
      color: #4CAF50;
      font-size: 18px;
      cursor: pointer;
      margin-left: 8px;
      padding: 2px 4px;
    }
    .refresh-btn:active { opacity: 0.5; }
    .refresh-btn.spinning { animation: spin 0.8s linear; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Column headers */
    .col-headers {
      display: flex;
      gap: 1px;
      margin-bottom: 6px;
    }
    .col-label {
      font: bold 8px 'SF Mono', 'Menlo', 'Courier New', monospace;
      color: #CCCCCC;
      text-align: center;
    }
    /* Widths match flap card layout: TIME=5 cards (4×14 + 1×6 + 4×1gap = 66), DST=4 (4×14+3=59), FLIGHT=6 (6×14+5=89), RMKS=3 (3×14+2=44) */
    /* Plus separator cards between columns: 1 card (14px) + 1px gap on each side */
    .col-time { width: 66px; }
    .col-dst { width: 59px; margin-left: 15px; }
    .col-flight { width: 89px; margin-left: 15px; }
    .col-rmks { width: 44px; margin-left: 15px; }

    /* Flight rows */
    .flight-row {
      display: flex;
      gap: 1px;
      margin-bottom: 2px;
    }

    /* Flap cards */
    .flap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 20px;
      background: #1C1C1E;
      border-radius: 2px;
      font: bold 12px 'SF Mono', 'Menlo', 'Courier New', monospace;
    }
    .flap-colon { width: 6px; }

    /* Status message */
    #status {
      text-align: center;
      padding: 20px 0;
      font: 14px 'SF Mono', 'Menlo', 'Courier New', monospace;
      color: #555555;
    }
    #status.error { color: #FF3D00; }

    /* Footer */
    .footer {
      text-align: center;
      padding: 8px 0;
      font-size: 10px;
      color: #555555;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="selector">
      <select id="airport-select"></select>
    </div>
    <div class="board-header">
      <span class="icon">🛫</span>
      <span class="title">DEPARTURES — <span id="airport-code">VVI</span></span>
      <span class="clock" id="clock"></span>
      <button class="refresh-btn" id="refresh-btn" onclick="manualRefresh()">↻</button>
    </div>
    <div class="col-headers">
      <span class="col-label col-time">TIME</span>
      <span class="col-label col-dst">DST</span>
      <span class="col-label col-flight">FLIGHT</span>
      <span class="col-label col-rmks">RMKS</span>
    </div>
    <div id="flights"></div>
    <div id="status">Cargando...</div>
    <div class="footer" id="footer"></div>
  </div>
  <script>
    // JS goes here in Task 4
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify HTML renders locally**

```bash
cd pwa && python3 -m http.server 8000
```

Open `http://localhost:8000`. Should see black page with dropdown (empty), header, column labels, and "Cargando..." message. No flights yet (no JS).

- [ ] **Step 3: Commit**

```bash
git add pwa/index.html
git commit -m "Add PWA HTML shell with split-flap board CSS"
```

---

### Task 4: Add JavaScript — Data Maps + Helpers

**Files:**
- Modify: `pwa/index.html` (add JS inside `<script>` tag)

This step adds the `PROXY_URL` constant, all data maps ported from the widget, and all helper functions. No fetch/render logic yet.

- [ ] **Step 1: Add data maps and helpers to `<script>` in `pwa/index.html`**

Replace the `<script>` block contents with:

```javascript
// ===== CONFIG =====
const PROXY_URL = 'https://aeropuertos-proxy.carlos-cb4.workers.dev';
const HOURS_AHEAD = 12;
const MAX_FLIGHTS = 13;

// ===== AIRPORTS (exact copy from widget) =====
const AIRPORTS = {
  VVI: { name: "Viru Viru (VVI)", city: "Santa Cruz", query: "Viru%20Viru" },
  LPB: { name: "El Alto (LPB)", city: "La Paz", query: "El%20Alto" },
  CBB: { name: "Cochabamba (CBB)", city: "Cochabamba", query: "Cochabamba" },
  TJA: { name: "Tarija (TJA)", city: "Tarija", query: "Tarija" },
  SRE: { name: "Sucre (SRE)", city: "Sucre", query: "Sucre" },
  ORU: { name: "Oruro (ORU)", city: "Oruro", query: "Oruro" },
  UYU: { name: "Uyuni (UYU)", city: "Uyuni", query: "Uyuni" },
  CIJ: { name: "Cobija (CIJ)", city: "Cobija", query: "Cobija" },
  RIB: { name: "Riberalta (RIB)", city: "Riberalta", query: "Riberalta" },
  RBQ: { name: "Rurrenabaque (RBQ)", city: "Rurrenabaque", query: "Rurrenabaque" },
  TDD: { name: "Trinidad (TDD)", city: "Trinidad", query: "Trinidad" },
  GYA: { name: "Guayaramerín (GYA)", city: "Guayaramerín", query: "Guayaramerin" }
};

// ===== AIRLINE MAPS (exact copy from widget) =====
const AIRLINE_IATA = {
  "BOLIVIANA DE AVIACION": "OB", "BOLIVIANA DE AVIACIÓN": "OB", "BOA": "OB",
  "ECOJET": "EO", "ECO JET": "EO",
  "AMASZONAS": "Z8",
  "LATAM": "LA", "LATAM AIRLINES": "LA", "LATAM AIRLINES GROUP": "LA",
  "LAN": "LA", "LAN AIRLINES": "LA",
  "SKY": "H2", "AVIANCA": "AV", "COPA": "CM",
  "AMERICAN AIRLINES": "AA", "UNITED": "UA", "IBERIA": "IB", "FLYBONDI": "FU"
};

const AIRLINE_BACKUP = {
  "PARANAIR": "PZ", "PARANAIR S.A.": "PZ", "PARANA AIR": "PZ",
  "GOL": "G3", "GOL LINHAS AEREAS": "G3", "GOL LINHAS AÉREAS": "G3",
  "MINERA SAN CRISTOBAL": "MSC", "MINERA SAN CRISTÓBAL": "MSC",
  "AIR EUROPA": "UX", "AIR EUROPA LINEAS AEREAS": "UX", "AIR EUROPA LÍNEAS AÉREAS": "UX"
};

// ===== DESTINATION MAP (exact copy from widget) =====
const DEST_IATA = {
  "SANTA CRUZ": "VVI", "VIRU VIRU": "VVI",
  "LA PAZ": "LPB", "EL ALTO": "LPB",
  "COCHABAMBA": "CBB", "SUCRE": "SRE", "TARIJA": "TJA",
  "ORURO": "ORU", "UYUNI": "UYU", "COBIJA": "CIJ",
  "RIBERALTA": "RIB", "RURRENABAQUE": "RBQ",
  "TRINIDAD": "TDD", "GUAYARAMERIN": "GYA", "GUAYARAMERÍN": "GYA",
  "LIMA": "LIM", "CUSCO": "CUZ", "CUZCO": "CUZ",
  "SANTIAGO": "SCL", "SANTIAGO DE CHILE": "SCL", "IQUIQUE": "IQQ",
  "BUENOS AIRES": "EZE", "SAO PAULO": "GRU", "SÃO PAULO": "GRU",
  "ASUNCION": "ASU", "ASUNCIÓN": "ASU",
  "PANAMA": "PTY", "PANAMÁ": "PTY",
  "MIAMI": "MIA", "MADRID": "MAD", "WASHINGTON": "IAD",
  "BOGOTA": "BOG", "BOGOTÁ": "BOG",
  "PUNTA DEL ESTE": "PDP",
  "TUCUMAN": "TUC", "TUCUMÁN": "TUC",
  "CUIABA": "CGB", "CUIABÁ": "CGB"
};

// ===== HELPER FUNCTIONS (exact logic from widget) =====
function airlineCode(name) {
  const key = (name || "").toUpperCase().trim();
  return AIRLINE_IATA[key] || AIRLINE_BACKUP[key] || null;
}

function normalizeHHMM(x) {
  const m = String(x || "").match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : null;
}

function todayWithHHMM(x) {
  const h = normalizeHHMM(x);
  if (!h) return null;
  const [hh, mm] = h.split(":").map(Number);
  const now = new Date();
  const d = new Date(now);
  d.setHours(hh, mm, 0, 0);
  if (d < now) d.setDate(d.getDate() + 1);
  return d;
}

function hhmm(d) {
  return d
    ? d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "     ";
}

function destinationIATA(route) {
  if (!route) return "--- ";
  const parts = route.split("-").map(x => x.trim()).filter(Boolean);
  const first = parts[0].toUpperCase();
  const extra = parts.length - 1;
  const iata = DEST_IATA[first] || "---";
  return extra > 0 ? `${iata}+` : `${iata} `;
}

function statusInfo(obs) {
  const s = (obs || "").toUpperCase();
  if (s.includes("PRE")) return { text: "PRE", preBoarding: true };
  if (s.includes("EMBAR") || s.includes("ABORD")) return { text: "EMB", boarding: true };
  if (s.includes("DEMOR") || s.includes("DELAY")) return { text: "DEM", delayed: true };
  if (s.includes("CANCEL")) return { text: "CAN", canceled: true };
  return { text: "OK" };
}

function getHoraReal(op, f) {
  return f?.HORA_REAL || op?.HORA_REAL_SALIDA || op?.HORA_SALIDA_REAL || null;
}
```

- [ ] **Step 2: Commit**

```bash
git add pwa/index.html
git commit -m "Add data maps and helper functions to PWA"
```

---

### Task 5: Add JavaScript — Fetch, Merge, Render + Interactivity

**Files:**
- Modify: `pwa/index.html` (append to `<script>` block after helpers)

This step adds all the fetch/merge logic (ported from widget lines 205-297), DOM rendering, selector, clock, and auto-refresh.

- [ ] **Step 1: Add fetch + merge logic after helpers**

Append this code after the helpers in the `<script>` block:

```javascript
// ===== PROXY FETCH =====
async function proxyFetch(url) {
  const r = await fetch(PROXY_URL + '/?url=' + encodeURIComponent(url));
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ===== FETCH + MERGE (ported from widget lines 205-297) =====
async function fetchFlights(airportCode) {
  const airport = AIRPORTS[airportCode] || AIRPORTS.VVI;
  const urlItin = `https://fids.naabol.gob.bo/Fids/itin/vuelos?aero=${airport.query}&tipo=S`;
  const urlOps = `https://fids.naabol.gob.bo/Fids/operativo/vuelos?aero=${airport.query}&tipo=S`;

  const [itin, ops] = await Promise.all([
    proxyFetch(urlItin).catch(() => []),
    proxyFetch(urlOps).catch(() => [])
  ]);

  // Build ops map indexed by airline code + flight number
  const opsMap = {};
  for (const o of ops) {
    const code = airlineCode(o.NOMBRE_AEROLINEA);
    const num = String(o.NRO_VUELO || "").trim();
    const key = code ? `${code}${num}` : num;
    opsMap[key] = o;
  }

  const now = Date.now();
  const max = now + HOURS_AHEAD * 3600 * 1000;

  // Pass 1: flights from itinerario, enriched with ops
  const seenFlights = new Set();
  const flightsFromItin = (itin || [])
    .map(f => {
      const prog = todayWithHHMM(f.HORA_PROGRAMADA || f.HORA_ESTIMADA);
      if (!prog) return null;

      const code = airlineCode(f.NOMBRE_AEROLINEA);
      const num = String(f.NRO_VUELO || "").trim();
      const vuelo = code ? `${code}${num}` : num;
      seenFlights.add(vuelo);

      const op = opsMap[vuelo] || {};
      const est = statusInfo(op.ESTADO || op.COMENTARIOS || f.OBSERVACION);

      return {
        prog,
        real: todayWithHHMM(getHoraReal(op, f)),
        ts: prog.getTime(),
        vuelo,
        est,
        dest: destinationIATA(f.RUTA0 || f.RUTA || op.DESTINO)
      };
    })
    .filter(f => {
      if (!f) return false;
      const active = f.est.delayed || f.est.preBoarding || f.est.boarding;
      if (active) return true;
      return f.ts >= now && f.ts <= max;
    });

  // Pass 2: flights only in ops (not in itinerario)
  const flightsFromOps = (ops || [])
    .map(o => {
      const code = airlineCode(o.NOMBRE_AEROLINEA);
      const num = String(o.NRO_VUELO || "").trim();
      const vuelo = code ? `${code}${num}` : num;

      if (seenFlights.has(vuelo)) return null;

      const prog = todayWithHHMM(o.HORA_ESTIMADA || o.HORA_PROGRAMADA);
      if (!prog) return null;

      const est = statusInfo(o.ESTADO || o.COMENTARIOS);

      return {
        prog,
        real: todayWithHHMM(o.HORA_REAL || o.HORA_REAL_SALIDA),
        ts: prog.getTime(),
        vuelo,
        est,
        dest: destinationIATA(o.DESTINO || o.RUTA)
      };
    })
    .filter(f => {
      if (!f) return false;
      const active = f.est.delayed || f.est.preBoarding || f.est.boarding;
      if (active) return true;
      return f.ts >= now && f.ts <= max;
    });

  // Combine, sort by real time (fallback to programmed), limit
  return [...flightsFromItin, ...flightsFromOps]
    .sort((a, b) => {
      const tA = a.real ? a.real.getTime() : a.ts;
      const tB = b.real ? b.real.getTime() : b.ts;
      return tA - tB;
    })
    .slice(0, MAX_FLIGHTS);
}
```

- [ ] **Step 2: Add DOM rendering after fetch logic**

```javascript
// ===== DOM RENDERING =====
// Colors
const COLORS = {
  text: '#FFD600',    // default / scheduled time
  updated: '#FF9800', // real (updated) time
  ok: '#FFFFFF',
  pre: '#FFD600',
  emb: '#4CAF50',
  dem: '#FF3D00',
  can: '#FF3D00',
  muted: '#555555'
};

function statusColor(est) {
  if (est.preBoarding) return COLORS.pre;
  if (est.boarding) return COLORS.emb;
  if (est.delayed) return COLORS.dem;
  if (est.canceled) return COLORS.can;
  return COLORS.ok;
}

function createFlap(ch, color) {
  const el = document.createElement('span');
  el.className = ch === ':' ? 'flap flap-colon' : 'flap';
  el.style.color = color;
  if (ch && ch !== ' ') el.textContent = ch;
  return el;
}

function createSegment(text, color) {
  const frag = document.createDocumentFragment();
  for (const ch of text) frag.appendChild(createFlap(ch, color));
  return frag;
}

function createSeparator() {
  return createFlap(' ', COLORS.text);
}

function renderBoard(flights) {
  const container = document.getElementById('flights');
  const status = document.getElementById('status');
  container.innerHTML = '';

  if (flights.length === 0) {
    status.textContent = 'No hay vuelos programados';
    status.className = '';
    status.id = 'status';
    return;
  }

  status.textContent = '';

  for (const f of flights) {
    const row = document.createElement('div');
    row.className = 'flight-row';

    const hasReal = !!f.real;
    const timeStr = hasReal ? hhmm(f.real) : hhmm(f.prog);
    const timeColor = hasReal ? COLORS.updated : COLORS.text;
    const estColor = statusColor(f.est);

    // TIME (5 chars: HH:MM)
    row.appendChild(createSegment(timeStr, timeColor));
    // Separator
    row.appendChild(createSeparator());
    // DST (4 chars, padded)
    row.appendChild(createSegment(f.dest.padEnd(4).slice(0, 4), COLORS.text));
    // Separator
    row.appendChild(createSeparator());
    // FLIGHT (6 chars, padded)
    row.appendChild(createSegment(f.vuelo.padEnd(6).slice(0, 6), COLORS.text));
    // Separator
    row.appendChild(createSeparator());
    // RMKS (3 chars, padded)
    row.appendChild(createSegment(f.est.text.padEnd(3).slice(0, 3), estColor));
    // Trailing empty card
    row.appendChild(createSeparator());

    container.appendChild(row);
  }
}
```

- [ ] **Step 3: Add interactivity (selector, clock, refresh, auto-refresh)**

```javascript
// ===== SELECTOR =====
let currentAirport = 'VVI';

function initSelector() {
  const sel = document.getElementById('airport-select');
  for (const [code, info] of Object.entries(AIRPORTS)) {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = `${code} — ${info.name}`;
    if (code === currentAirport) opt.selected = true;
    sel.appendChild(opt);
  }
  sel.addEventListener('change', () => {
    currentAirport = sel.value;
    document.getElementById('airport-code').textContent = currentAirport;
    loadFlights();
  });
}

// ===== CLOCK =====
function updateClock() {
  document.getElementById('clock').textContent = hhmm(new Date());
}

// ===== LOAD + RENDER =====
async function loadFlights() {
  const status = document.getElementById('status');
  try {
    const flights = await fetchFlights(currentAirport);
    renderBoard(flights);
    document.getElementById('footer').textContent =
      'Actualizado: ' + new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch (e) {
    status.textContent = 'Error de conexión';
    status.className = 'error';
    status.id = 'status';
  }
}

function manualRefresh() {
  const btn = document.getElementById('refresh-btn');
  btn.classList.add('spinning');
  loadFlights().finally(() => {
    setTimeout(() => btn.classList.remove('spinning'), 800);
  });
}

// ===== AUTO-REFRESH with visibility =====
let refreshTimer = null;

function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimer = setInterval(loadFlights, 5 * 60 * 1000);
}

function stopAutoRefresh() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAutoRefresh();
  } else {
    loadFlights();
    startAutoRefresh();
  }
});

// ===== INIT =====
initSelector();
updateClock();
setInterval(updateClock, 1000);
loadFlights();
startAutoRefresh();
```

- [ ] **Step 4: Test locally**

```bash
cd pwa && python3 -m http.server 8000
```

Open `http://localhost:8000`. Verify:
- Selector shows 12 airports, default VVI
- Header shows "DEPARTURES — VVI" + live clock
- Flights render in split-flap style with correct colors
- Changing airport reloads flights
- Refresh button spins and reloads

- [ ] **Step 5: Commit**

```bash
git add pwa/index.html
git commit -m "Add complete PWA flight board with fetch, merge, and rendering"
```

---

## Chunk 3: Test + Deploy

### Task 6: Test all airports + edge cases

- [ ] **Step 1: Test VVI (busiest airport)**

Verify: times HH:MM, IATA destinations, flight codes, status colors (PRE=yellow, EMB=green, DEM/CAN=red, OK=white), updated times in orange.

- [ ] **Step 2: Test small airport (UYU)**

Switch to UYU. Likely zero flights → verify "No hay vuelos programados" appears.

- [ ] **Step 3: Test error state**

Temporarily set `PROXY_URL` to `'https://invalid'`. Verify "Error de conexión" in red.

- [ ] **Step 4: Fix any issues found**

- [ ] **Step 5: Commit fixes if any**

```bash
git add pwa/index.html
git commit -m "Fix issues found during PWA testing"
```

---

### Task 7: Push + Deploy

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Configure GitHub Pages**

If not already configured, enable GitHub Pages for the repo pointing to `main` branch. The PWA will be accessible at `https://calepes.github.io/Aeropuertos-Bolivia/pwa/`.

- [ ] **Step 3: Test on GitHub Pages**

Open `https://calepes.github.io/Aeropuertos-Bolivia/pwa/` and verify it works.

- [ ] **Step 4: Update CLAUDE.md with final proxy URL**

Replace the placeholder proxy URL in CLAUDE.md with the actual deployed URL.

- [ ] **Step 5: Commit CLAUDE.md update**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md with deployed proxy URL"
git push origin main
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Cloudflare Worker CORS proxy | `proxy/worker.js`, `proxy/wrangler.toml` |
| 2 | PWA icons + manifest + cleanup | `pwa/icons/*.svg`, `pwa/manifest.json` |
| 3 | HTML structure + CSS (static shell) | `pwa/index.html` |
| 4 | JS data maps + helper functions | `pwa/index.html` |
| 5 | JS fetch, merge, render + interactivity | `pwa/index.html` |
| 6 | Testing all airports + edge cases | `pwa/index.html` (fixes) |
| 7 | Push + deploy to GitHub Pages | Push + configure Pages |
