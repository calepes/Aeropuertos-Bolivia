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
 * COLORES – Estilo split-flap board
 ***********************/
const BOARD_BG = new Color("#0A0A0A");
const CARD_BG = new Color("#1C1C1E");
const HEADER_COLOR = new Color("#FFD600");
const COL_HEADER_COLOR = new Color("#00BCD4");
const TEXT_COLOR = new Color("#FFFFFF");
const PRE_COLOR = new Color("#FFD600");
const EMB_COLOR = new Color("#4CAF50");
const DEM_COLOR = new Color("#FF3D00");
const CAN_COLOR = new Color("#FF3D00");
const OK_COLOR = new Color("#4CAF50");
const MUTED_COLOR = new Color("#555555");

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
  if (s.includes("DEMOR") || s.includes("DELAY")) return { text: "DEM", delayed: true };
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
  .filter(f => {
    if (!f) return false;
    const active = f.est.delayed || f.est.preBoarding || f.est.boarding;
    if (active) return true;
    return f.ts >= now && f.ts <= max;
  });

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
  .filter(f => {
    if (!f) return false;
    const active = f.est.delayed || f.est.preBoarding || f.est.boarding;
    if (active) return true;
    return f.ts >= now && f.ts <= max;
  });

// Combinar y ordenar (por hora real si existe, si no por programada)
const flights = [...flightsFromItin, ...flightsFromOps]
  .sort((a, b) => {
    const tA = a.real ? a.real.getTime() : a.ts;
    const tB = b.real ? b.real.getTime() : b.ts;
    return tA - tB;
  })
  .slice(0, MAX_FLIGHTS);

/***********************
 * WIDGET – Estilo tablero aeropuerto
 ***********************/
const w = new ListWidget();
w.backgroundColor = BOARD_BG;
w.setPadding(10, 12, 8, 12);

// Header: icono + SALIDAS ... reloj
const hdr = w.addStack();
hdr.layoutHorizontally();
hdr.centerAlignContent();
const icon = hdr.addText("✈︎");
icon.font = Font.boldSystemFont(20);
icon.textColor = HEADER_COLOR;
hdr.addSpacer(8);
const title = hdr.addText("SALIDAS");
title.font = Font.boldMonospacedSystemFont(18);
title.textColor = HEADER_COLOR;
hdr.addSpacer();
const clock = hdr.addText(hhmm(new Date()));
clock.font = Font.boldMonospacedSystemFont(18);
clock.textColor = HEADER_COLOR;

w.addSpacer(2);

// Subtítulo: DEPARTURES + aeropuerto
const sub = w.addStack();
sub.layoutHorizontally();
const subDep = sub.addText("DEPARTURES");
subDep.font = Font.boldMonospacedSystemFont(10);
subDep.textColor = MUTED_COLOR;
sub.addSpacer();
const subAirport = sub.addText(AIRPORT.name.toUpperCase());
subAirport.font = Font.boldMonospacedSystemFont(10);
subAirport.textColor = MUTED_COLOR;

w.addSpacer(4);

// Helper: añade un grupo de flaps (letra por letra)
function addFlapGroup(parent, text, color, charW) {
  const grp = parent.addStack();
  grp.layoutHorizontally();
  grp.spacing = 1;
  for (const ch of text) {
    if (ch === ":") {
      const sep = grp.addStack();
      sep.size = new Size(6, 18);
      sep.centerAlignContent();
      const s = sep.addText(":");
      s.font = Font.boldMonospacedSystemFont(10);
      s.textColor = color;
    } else {
      const flap = grp.addStack();
      flap.size = new Size(charW, 18);
      flap.backgroundColor = CARD_BG;
      flap.cornerRadius = 2;
      flap.centerAlignContent();
      const t = flap.addText(ch);
      t.font = Font.boldMonospacedSystemFont(11);
      t.textColor = color;
    }
  }
}

// Encabezados de columna
const COL_WIDTHS = [5, 5, 6, 3, 3]; // chars por columna
const COL_LABELS = ["HORA", "REAL", "VUELO", "EST", "DST"];
const CHAR_W = 12;
const GRP_GAP = 5;

const th = w.addStack();
th.layoutHorizontally();
th.spacing = GRP_GAP;
COL_LABELS.forEach((label, i) => {
  const colW = COL_WIDTHS[i] * CHAR_W + (COL_WIDTHS[i] - 1) + (label.includes(":") ? 4 : 0);
  const s = th.addStack();
  s.size = new Size(Math.max(colW, 0), 0);
  s.centerAlignContent();
  const tx = s.addText(label);
  tx.font = Font.boldMonospacedSystemFont(8);
  tx.textColor = COL_HEADER_COLOR;
});

w.addSpacer(4);

// Filas de vuelos – letra por letra
for (let i = 0; i < flights.length; i++) {
  const f = flights[i];
  const row = w.addStack();
  row.layoutHorizontally();
  row.spacing = GRP_GAP;

  const vals = [
    hhmm(f.prog).padEnd(5),
    hhmm(f.real).padEnd(5),
    f.vuelo.padEnd(6).slice(0, 6),
    f.est.text.padEnd(3).slice(0, 3),
    f.dest.padEnd(3).slice(0, 3)
  ];

  const colors = [TEXT_COLOR, TEXT_COLOR, TEXT_COLOR, null, TEXT_COLOR];
  if (f.est.preBoarding) colors[3] = PRE_COLOR;
  else if (f.est.boarding) colors[3] = EMB_COLOR;
  else if (f.est.delayed) colors[3] = DEM_COLOR;
  else if (f.est.canceled) colors[3] = CAN_COLOR;
  else colors[3] = OK_COLOR;

  vals.forEach((val, j) => {
    addFlapGroup(row, val, colors[j], CHAR_W);
  });

  w.addSpacer(1);
}

w.addSpacer();
const footer = w.addText(`UPD ${hhmm(new Date())}`);
footer.font = Font.mediumMonospacedSystemFont(8);
footer.textColor = MUTED_COLOR;

Script.setWidget(w);
Script.complete();
