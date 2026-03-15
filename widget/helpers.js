/*************************************************
 * Funciones helper y mapas de datos extraídos
 * del widget principal para testing y reutilización.
 *************************************************/

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

const AIRLINE_IATA = {
  "BOLIVIANA DE AVIACION": "OB",
  "BOLIVIANA DE AVIACIÓN": "OB",
  "BOA": "OB",
  "ECOJET": "EO",
  "ECO JET": "EO",
  "AMASZONAS": "Z8",
  "LATAM": "LA",
  "LATAM AIRLINES": "LA",
  "LATAM AIRLINES GROUP": "LA",
  "LAN": "LA",
  "LAN AIRLINES": "LA",
  "SKY": "H2",
  "AVIANCA": "AV",
  "COPA": "CM",
  "AMERICAN AIRLINES": "AA",
  "UNITED": "UA",
  "IBERIA": "IB",
  "FLYBONDI": "FU"
};

const AIRLINE_BACKUP = {
  "PARANAIR": "PZ",
  "PARANAIR S.A.": "PZ",
  "PARANA AIR": "PZ",
  "GOL": "G3",
  "GOL LINHAS AEREAS": "G3",
  "GOL LINHAS AÉREAS": "G3",
  "MINERA SAN CRISTOBAL": "MSC",
  "MINERA SAN CRISTÓBAL": "MSC",
  "AIR EUROPA": "UX",
  "AIR EUROPA LINEAS AEREAS": "UX",
  "AIR EUROPA LÍNEAS AÉREAS": "UX"
};

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
  if (s.includes("ATERRI") || s.includes("LANDED")) return { text: "LND" };
  if (s.includes("PRE")) return { text: "PRE", preBoarding: true };
  if (s.includes("EMBAR") || s.includes("ABORD")) return { text: "EMB", boarding: true };
  if (s.includes("DEMOR") || s.includes("DELAY")) return { text: "DEM", delayed: true };
  if (s.includes("CANCEL")) return { text: "CAN", canceled: true };
  return { text: "OK" };
}

function getHoraReal(op, f, tipo) {
  if (tipo === 'L') {
    return f?.HORA_REAL || op?.HORA_REAL_LLEGADA || op?.HORA_LLEGADA_REAL || null;
  }
  return f?.HORA_REAL || op?.HORA_REAL_SALIDA || op?.HORA_SALIDA_REAL || null;
}

module.exports = {
  AIRPORTS,
  AIRLINE_IATA,
  AIRLINE_BACKUP,
  DEST_IATA,
  airlineCode,
  normalizeHHMM,
  todayWithHHMM,
  hhmm,
  destinationIATA,
  statusInfo,
  getHoraReal
};
