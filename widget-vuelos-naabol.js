/*************************************************
 * NAABOL – SALIDAS (TODOS LOS AEROPUERTOS)
 * Parametrizable · Ultra denso · Zebra · Fix día siguiente
 *************************************************/

const HOURS_AHEAD = 12;
const MAX_FLIGHTS = 10;

/***********************
 * AEROPUERTOS NAABOL
 ***********************/
const AIRPORT_PARAM = (args.widgetParameter || "VVI").toUpperCase();

const AIRPORTS = {
  VVI: { name: "Viru Viru (VVI)", query: "Viru%20Viru" },
  LPB: { name: "El Alto (LPB)", query: "El%20Alto" },
  CBB: { name: "Cochabamba (CBB)", query: "Cochabamba" },
  TJA: { name: "Tarija (TJA)", query: "Tarija" },
  SRE: { name: "Sucre (SRE)", query: "Sucre" },
  ORU: { name: "Oruro (ORU)", query: "Oruro" },
  UYU: { name: "Uyuni (UYU)", query: "Uyuni" },
  CIJ: { name: "Cobija (CIJ)", query: "Cobija" },
  RIB: { name: "Riberalta (RIB)", query: "Riberalta" },
  RBQ: { name: "Rurrenabaque (RBQ)", query: "Rurrenabaque" },
  TDD: { name: "Trinidad (TDD)", query: "Trinidad" },
  GYA: { name: "Guayaramerín (GYA)", query: "Guayaramerin" }
};

const AIRPORT = AIRPORTS[AIRPORT_PARAM] || AIRPORTS.VVI;

/***********************
 * URLS
 ***********************/
const URL_ITIN =
  `https://fids.naabol.gob.bo/Fids/itin/vuelos?aero=${AIRPORT.query}&tipo=S`;
const URL_OPS =
  `https://fids.naabol.gob.bo/Fids/operativo/vuelos?aero=${AIRPORT.query}&tipo=S`;

/***********************
 * COLORES
 ***********************/
const ZEBRA_BG = Color.dynamic(new Color("#F2F2F7"), new Color("#2C2C2E"));
const CANCEL_BG = Color.dynamic(new Color("#FFE5E5"), new Color("#3A1E1E"));
const PRE_COLOR = Color.dynamic(new Color("#007AFF"), new Color("#64B5F6"));
const EMB_COLOR = Color.dynamic(new Color("#34C759"), new Color("#81C784"));
const DEM_COLOR = Color.dynamic(new Color("#FF3B30"), new Color("#FF6961"));

/***********************
 * IATA MAPS
 ***********************/
const AIRLINE_IATA = {
  "BOLIVIANA DE AVIACION": "OB",
  "BOLIVIANA DE AVIACIÓN": "OB",
  "BOA": "OB",
  "ECOJET": "EO",
  "ECO JET": "EO",
  "AMASZONAS": "Z8",
  "LATAM": "LA",
  "SKY": "H2",
  "AVIANCA": "AV",
  "COPA": "CM",
  "AMERICAN AIRLINES": "AA",
  "UNITED": "UA",
  "IBERIA": "IB",
  "FLYBONDI": "FU"
};

/***********************
 * BACKUP AEROLÍNEAS (AMPLIADO)
 ***********************/
const AIRLINE_BACKUP = {
  // Paraná Air
  "PARANAIR": "PZ",
  "PARANAIR S.A.": "PZ",
  "PARANA AIR": "PZ",

  // Gol
  "GOL": "G3",
  "GOL LINHAS AEREAS": "G3",
  "GOL LINHAS AÉREAS": "G3",

  // Minera San Cristóbal
  "MINERA SAN CRISTOBAL": "MSC",
  "MINERA SAN CRISTÓBAL": "MSC",

  // Air Europa
  "AIR EUROPA": "UX",
  "AIR EUROPA LINEAS AEREAS": "UX",
  "AIR EUROPA LÍNEAS AÉREAS": "UX"
};

function airlineCode(name) {
  const key = (name || "").toUpperCase().trim();
  return AIRLINE_IATA[key] || AIRLINE_BACKUP[key] || null;
}

/***********************
 * DESTINOS
 ***********************/
const DEST_IATA = {
  "SANTA CRUZ": "VVI",
  "VIRU VIRU": "VVI",
  "LA PAZ": "LPB",
  "EL ALTO": "LPB",
  "COCHABAMBA": "CBB",
  "SUCRE": "SRE",
  "TARIJA": "TJA",
  "ORURO": "ORU",
  "UYUNI": "UYU",
  "COBIJA": "CIJ",
  "RIBERALTA": "RIB",
  "RURRENABAQUE": "RBQ",
  "TRINIDAD": "TDD",
  "GUAYARAMERIN": "GYA",
  "GUAYARAMERÍN": "GYA",

  "LIMA": "LIM",
  "CUSCO": "CUZ",
  "CUZCO": "CUZ",
  "SANTIAGO": "SCL",
  "SANTIAGO DE CHILE": "SCL",
  "IQUIQUE": "IQQ",
  "BUENOS AIRES": "EZE",
  "SAO PAULO": "GRU",
  "SÃO PAULO": "GRU",
  "ASUNCION": "ASU",
  "ASUNCIÓN": "ASU",
  "PANAMA": "PTY",
  "PANAMÁ": "PTY",
  "MIAMI": "MIA",
  "MADRID": "MAD",
  "WASHINGTON": "IAD",
  "BOGOTA": "BOG",
  "BOGOTÁ": "BOG",
  "PUNTA DEL ESTE": "PDP",
  "TUCUMAN": "TUC",
  "TUCUMÁN": "TUC",
  "CUIABA": "CGB",
  "CUIABÁ": "CGB"
};

/***********************
 * HELPERS (SIN CAMBIOS)
 ***********************/
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
    : "···";
}

function destinationIATA(route) {
  if (!route) return "---";
  const parts = route.split("-").map(x => x.trim()).filter(Boolean);
  const first = parts[0].toUpperCase();
  const extra = parts.length - 1;
  const iata = DEST_IATA[first] || "---";
  return extra > 0 ? `${iata} (${extra})` : iata;
}

function statusInfo(obs) {
  const s = (obs || "").toUpperCase();
  if (s.includes("PRE")) return { text: "PRE", preBoarding: true };
  if (s.includes("EMBAR") || s.includes("ABORD")) return { text: "EMB", boarding: true };
  if (s.includes("DEMOR")) return { text: "DEM", delayed: true };
  if (s.includes("CANCEL")) return { text: "CAN", canceled: true };
  return { text: "OK" };
}

function getHoraReal(op, f) {
  return f?.HORA_REAL || op?.HORA_REAL_SALIDA || op?.HORA_SALIDA_REAL || null;
}

/***********************
 * FETCH / MERGE / UI
 * (INTACTO – SIN CAMBIOS)
 ***********************/

async function load(url) {
  try {
    const r = new Request(url);
    r.allowInsecureLoads = true;
    return await r.loadJSON();
  } catch {
    return [];
  }
}

const itin = await load(URL_ITIN);
const ops = await load(URL_OPS);

const opsMap = {};
for (const o of ops) {
  const code = airlineCode(o.NOMBRE_AEROLINEA);
  const num = String(o.NRO_VUELO || "").trim();
  const key = code ? `${code}${num}` : num;
  opsMap[key] = o;
}

const now = Date.now();
const max = now + HOURS_AHEAD * 3600 * 1000;

// Vuelos del itinerario
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
  .filter(f => f && f.ts >= now && f.ts <= max);

// Vuelos solo en operativo (no en itinerario)
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
  .filter(f => f && f.ts >= now && f.ts <= max);

// Combinar y ordenar
const flights = [...flightsFromItin, ...flightsFromOps]
  .sort((a, b) => a.ts - b.ts)
  .slice(0, MAX_FLIGHTS);

/***********************
 * WIDGET FINAL (SIN CAMBIOS)
 ***********************/
const w = new ListWidget();
w.setPadding(14, 16, 12, 16);

const h = w.addStack();
h.addText("✈️").font = Font.systemFont(20);
h.addSpacer(6);
h.addText(`Salidas · ${AIRPORT.name}`).font = Font.boldSystemFont(17);

w.addSpacer(8);

const COLS = [52, 52, 78, 60, 56];
const HEAD = ["PROG", "REAL", "VUELO", "EST", "DST"];

const th = w.addStack();
th.layoutHorizontally();
HEAD.forEach((t, i) => {
  const s = th.addStack();
  s.size = new Size(COLS[i], 0);
  s.centerAlignContent();
  const tx = s.addText(t);
  tx.font = Font.systemFont(11);
  tx.textOpacity = 0.5;
});

w.addSpacer(4);

for (let i = 0; i < flights.length; i++) {
  const f = flights[i];
  const bg = w.addStack();
  bg.layoutVertically();

  if (f.est.canceled) bg.backgroundColor = CANCEL_BG;
  else if (i % 2 === 1) bg.backgroundColor = ZEBRA_BG;

  bg.cornerRadius = 8;
  bg.setPadding(3, 6, 3, 6);

  const r = bg.addStack();
  r.layoutHorizontally();

  [hhmm(f.prog), hhmm(f.real), f.vuelo, f.est.text, f.dest].forEach((val, j) => {
    const s = r.addStack();
    s.size = new Size(COLS[j], 0);
    const t = s.addText(val);
    t.font = j <= 2
      ? Font.mediumMonospacedSystemFont(13)
      : Font.systemFont(12);
    if (j === 3) {
      if (f.est.preBoarding) t.textColor = PRE_COLOR;
      else if (f.est.boarding) t.textColor = EMB_COLOR;
      else if (f.est.delayed) t.textColor = DEM_COLOR;
    }
  });

  w.addSpacer(2);
}

w.addSpacer(4);
const footer = w.addText(`Actualizado ${hhmm(new Date())}`);
footer.font = Font.systemFont(10);
footer.textOpacity = 0.45;

Script.setWidget(w);
Script.complete();
