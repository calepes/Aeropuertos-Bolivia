/*************************************************
 * NAABOL Widget – Lógica pura (testeable)
 *
 * Este módulo exporta todas las funciones de ayuda
 * y mapas de datos utilizados por el widget principal.
 * El widget Scriptable contiene copias inline de estas
 * funciones (Scriptable no soporta require/import).
 *************************************************/

/* ── Constantes ─────────────────────────────── */

const HOURS_AHEAD = 12;
const MAX_FLIGHTS = 10;

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
  GYA: { name: "Guayaramerín (GYA)", query: "Guayaramerin" },
};

const AIRLINE_IATA = {
  "BOLIVIANA DE AVIACION": "OB",
  "BOLIVIANA DE AVIACIÓN": "OB",
  BOA: "OB",
  ECOJET: "EO",
  "ECO JET": "EO",
  AMASZONAS: "Z8",
  LATAM: "LA",
  SKY: "H2",
  AVIANCA: "AV",
  COPA: "CM",
  "AMERICAN AIRLINES": "AA",
  UNITED: "UA",
  IBERIA: "IB",
  FLYBONDI: "FU",
};

const AIRLINE_BACKUP = {
  PARANAIR: "PZ",
  "PARANAIR S.A.": "PZ",
  "PARANA AIR": "PZ",
  GOL: "G3",
  "GOL LINHAS AEREAS": "G3",
  "GOL LINHAS AÉREAS": "G3",
  "MINERA SAN CRISTOBAL": "MSC",
  "MINERA SAN CRISTÓBAL": "MSC",
  "AIR EUROPA": "UX",
  "AIR EUROPA LINEAS AEREAS": "UX",
  "AIR EUROPA LÍNEAS AÉREAS": "UX",
};

const DEST_IATA = {
  "SANTA CRUZ": "VVI",
  "VIRU VIRU": "VVI",
  "LA PAZ": "LPB",
  "EL ALTO": "LPB",
  COCHABAMBA: "CBB",
  SUCRE: "SRE",
  TARIJA: "TJA",
  ORURO: "ORU",
  UYUNI: "UYU",
  COBIJA: "CIJ",
  RIBERALTA: "RIB",
  RURRENABAQUE: "RBQ",
  TRINIDAD: "TDD",
  GUAYARAMERIN: "GYA",
  "GUAYARAMERÍN": "GYA",
  LIMA: "LIM",
  CUSCO: "CUZ",
  CUZCO: "CUZ",
  SANTIAGO: "SCL",
  "SANTIAGO DE CHILE": "SCL",
  IQUIQUE: "IQQ",
  "BUENOS AIRES": "EZE",
  "SAO PAULO": "GRU",
  "SÃO PAULO": "GRU",
  ASUNCION: "ASU",
  "ASUNCIÓN": "ASU",
  "PANAMA": "PTY",
  "PANAMÁ": "PTY",
  MIAMI: "MIA",
  MADRID: "MAD",
  WASHINGTON: "IAD",
  BOGOTA: "BOG",
  "BOGOTÁ": "BOG",
  "PUNTA DEL ESTE": "PDP",
  TUCUMAN: "TUC",
  "TUCUMÁN": "TUC",
  CUIABA: "CGB",
  "CUIABÁ": "CGB",
};

/* ── Funciones ──────────────────────────────── */

function airlineCode(name) {
  const key = (name || "").toUpperCase().trim();
  return AIRLINE_IATA[key] || AIRLINE_BACKUP[key] || null;
}

function normalizeHHMM(x) {
  const m = String(x || "").match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : null;
}

function todayWithHHMM(x, referenceDate) {
  const h = normalizeHHMM(x);
  if (!h) return null;
  const [hh, mm] = h.split(":").map(Number);
  const now = referenceDate || new Date();
  const d = new Date(now);
  d.setHours(hh, mm, 0, 0);
  if (d < now) d.setDate(d.getDate() + 1);
  return d;
}

function destinationIATA(route) {
  if (!route) return "---";
  const parts = route
    .split("-")
    .map((x) => x.trim())
    .filter(Boolean);
  const first = parts[0].toUpperCase();
  const extra = parts.length - 1;
  const iata = DEST_IATA[first] || "---";
  return extra > 0 ? `${iata} (${extra})` : iata;
}

function statusInfo(obs) {
  const s = (obs || "").toUpperCase();
  if (s.includes("PRE")) return { text: "PRE", preBoarding: true };
  if (s.includes("EMBAR") || s.includes("ABORD"))
    return { text: "EMB", boarding: true };
  if (s.includes("DEMOR") || s.includes("DELAY"))
    return { text: "DEM", delayed: true };
  if (s.includes("CANCEL")) return { text: "CAN", canceled: true };
  return { text: "OK" };
}

function getHoraReal(op, f) {
  return f?.HORA_REAL || op?.HORA_REAL_SALIDA || op?.HORA_SALIDA_REAL || null;
}

function buildOpsMap(ops) {
  const opsMap = {};
  for (const o of ops || []) {
    const code = airlineCode(o.NOMBRE_AEROLINEA);
    const num = String(o.NRO_VUELO || "").trim();
    const key = code ? `${code}${num}` : num;
    opsMap[key] = o;
  }
  return opsMap;
}

function mergeAndFilter(itin, ops, now) {
  const opsMap = buildOpsMap(ops);
  const max = now + HOURS_AHEAD * 3600 * 1000;
  const refDate = new Date(now);

  const seenFlights = new Set();

  const flightsFromItin = (itin || [])
    .map((f) => {
      const prog = todayWithHHMM(f.HORA_PROGRAMADA || f.HORA_ESTIMADA, refDate);
      if (!prog) return null;

      const code = airlineCode(f.NOMBRE_AEROLINEA);
      const num = String(f.NRO_VUELO || "").trim();
      const vuelo = code ? `${code}${num}` : num;
      seenFlights.add(vuelo);

      const op = opsMap[vuelo] || {};
      const est = statusInfo(op.ESTADO || op.COMENTARIOS || f.OBSERVACION);

      return {
        prog,
        real: todayWithHHMM(getHoraReal(op, f), refDate),
        ts: prog.getTime(),
        vuelo,
        est,
        dest: destinationIATA(f.RUTA0 || f.RUTA || op.DESTINO),
      };
    })
    .filter((f) => {
      if (!f) return false;
      const active = f.est.delayed || f.est.preBoarding || f.est.boarding;
      if (active) return true;
      return f.ts >= now && f.ts <= max;
    });

  const flightsFromOps = (ops || [])
    .map((o) => {
      const code = airlineCode(o.NOMBRE_AEROLINEA);
      const num = String(o.NRO_VUELO || "").trim();
      const vuelo = code ? `${code}${num}` : num;

      if (seenFlights.has(vuelo)) return null;

      const prog = todayWithHHMM(o.HORA_ESTIMADA || o.HORA_PROGRAMADA, refDate);
      if (!prog) return null;

      const est = statusInfo(o.ESTADO || o.COMENTARIOS);

      return {
        prog,
        real: todayWithHHMM(o.HORA_REAL || o.HORA_REAL_SALIDA, refDate),
        ts: prog.getTime(),
        vuelo,
        est,
        dest: destinationIATA(o.DESTINO || o.RUTA),
      };
    })
    .filter((f) => {
      if (!f) return false;
      const active = f.est.delayed || f.est.preBoarding || f.est.boarding;
      if (active) return true;
      return f.ts >= now && f.ts <= max;
    });

  return [...flightsFromItin, ...flightsFromOps]
    .sort((a, b) => {
      const tA = a.real ? a.real.getTime() : a.ts;
      const tB = b.real ? b.real.getTime() : b.ts;
      return tA - tB;
    })
    .slice(0, MAX_FLIGHTS);
}

/* ── Exports ────────────────────────────────── */

module.exports = {
  HOURS_AHEAD,
  MAX_FLIGHTS,
  AIRPORTS,
  AIRLINE_IATA,
  AIRLINE_BACKUP,
  DEST_IATA,
  airlineCode,
  normalizeHHMM,
  todayWithHHMM,
  destinationIATA,
  statusInfo,
  getHoraReal,
  buildOpsMap,
  mergeAndFilter,
};
