/*************************************************
 * NAABOL – SALIDAS – DUMMY DATA (LOOK & FEEL TEST)
 *************************************************/

/***********************
 * COLORES – Estilo split-flap board
 ***********************/
const BOARD_BG = new Color("#0A0A0A");
const CARD_BG = new Color("#1C1C1E");
const HEADER_COLOR = new Color("#FFFFFF");
const COL_HEADER_COLOR = new Color("#CCCCCC");
const TEXT_COLOR = new Color("#FFD600");
const PRE_COLOR = new Color("#FFD600");
const EMB_COLOR = new Color("#4CAF50");
const DEM_COLOR = new Color("#FF3D00");
const CAN_COLOR = new Color("#FF3D00");
const OK_COLOR = new Color("#4CAF50");
const MUTED_COLOR = new Color("#555555");

/***********************
 * HELPER
 ***********************/
function hhmm(d) {
  return d
    ? d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "     ";
}

/***********************
 * DUMMY FLIGHTS
 ***********************/
const flights = [
  { prog: "08:10", real: "08:15", dest: "LPB ", vuelo: "OB101 ", est: { text: "OK ", boarding: false, preBoarding: false, delayed: false, canceled: false } },
  { prog: "09:25", real: "     ", dest: "CBB ", vuelo: "OB203 ", est: { text: "PRE", preBoarding: true, boarding: false, delayed: false, canceled: false } },
  { prog: "10:00", real: "10:05", dest: "SCL ", vuelo: "LA430 ", est: { text: "EMB", preBoarding: false, boarding: true, delayed: false, canceled: false } },
  { prog: "11:30", real: "     ", dest: "LIM ", vuelo: "AV712 ", est: { text: "OK ", boarding: false, preBoarding: false, delayed: false, canceled: false } },
  { prog: "12:15", real: "13:40", dest: "PTY ", vuelo: "CM155 ", est: { text: "DEM", preBoarding: false, boarding: false, delayed: true, canceled: false } },
  { prog: "13:00", real: "     ", dest: "MIA ", vuelo: "AA988 ", est: { text: "OK ", boarding: false, preBoarding: false, delayed: false, canceled: false } },
  { prog: "14:45", real: "     ", dest: "EZE ", vuelo: "Z8550 ", est: { text: "CAN", preBoarding: false, boarding: false, delayed: false, canceled: true } },
  { prog: "15:20", real: "15:20", dest: "SRE ", vuelo: "OB305 ", est: { text: "EMB", preBoarding: false, boarding: true, delayed: false, canceled: false } },
  { prog: "16:50", real: "     ", dest: "GRU ", vuelo: "LA801 ", est: { text: "OK ", boarding: false, preBoarding: false, delayed: false, canceled: false } },
  { prog: "18:00", real: "18:30", dest: "MAD ", vuelo: "IB6024", est: { text: "DEM", preBoarding: false, boarding: false, delayed: true, canceled: false } },
];

/***********************
 * WIDGET – Estilo tablero aeropuerto
 ***********************/
const w = new ListWidget();
w.backgroundColor = BOARD_BG;
w.setPadding(10, 12, 8, 12);

// Header: icono + DEPARTURES ... reloj (estilo flight board)
const hdr = w.addStack();
hdr.layoutHorizontally();
hdr.centerAlignContent();
const icon = hdr.addText("✈︎");
icon.font = Font.boldSystemFont(18);
icon.textColor = HEADER_COLOR;
hdr.addSpacer(6);
const title = hdr.addText(`DEPARTURES`);
title.font = Font.boldMonospacedSystemFont(16);
title.textColor = HEADER_COLOR;
title.lineLimit = 1;
hdr.addSpacer();
const clock = hdr.addText(hhmm(new Date()));
clock.font = Font.boldMonospacedSystemFont(16);
clock.textColor = new Color("#4CAF50");

w.addSpacer(6);

// Helper: añade un grupo de flaps (letra por letra)
const CHAR_W = 13;
const FLAP_H = 19;
const FONT_SZ = 11;
const GRP_GAP = 3;

function addFlapGroup(parent, text, color) {
  const grp = parent.addStack();
  grp.layoutHorizontally();
  grp.spacing = 1;
  for (const ch of text) {
    if (ch === ":") {
      const sep = grp.addStack();
      sep.size = new Size(6, FLAP_H);
      sep.centerAlignContent();
      const s = sep.addText(":");
      s.font = Font.boldMonospacedSystemFont(FONT_SZ);
      s.textColor = color;
    } else {
      const flap = grp.addStack();
      flap.size = new Size(CHAR_W, FLAP_H);
      flap.backgroundColor = CARD_BG;
      flap.cornerRadius = 2;
      flap.centerAlignContent();
      if (ch !== " ") {
        const t = flap.addText(ch);
        t.font = Font.boldMonospacedSystemFont(FONT_SZ);
        t.textColor = color;
      }
    }
  }
}

// Columnas: TIME(5), DST(4), FLIGHT(6), REAL(5), RMKS(3)
const COL_CARDS = [4, 4, 6, 4, 3];
const COL_HAS_COLON = [true, false, false, true, false];
const COL_LABELS = ["TIME", "DST", "FLIGHT", "REAL", "RMKS"];

function colWidth(i) {
  const cards = COL_CARDS[i];
  const cw = cards * CHAR_W + (cards - 1);
  return COL_HAS_COLON[i] ? cw + 6 : cw;
}

const th = w.addStack();
th.layoutHorizontally();
th.spacing = GRP_GAP;
COL_LABELS.forEach((label, i) => {
  const s = th.addStack();
  s.size = new Size(colWidth(i), 0);
  s.centerAlignContent();
  const tx = s.addText(label);
  tx.font = Font.boldMonospacedSystemFont(8);
  tx.textColor = COL_HEADER_COLOR;
});

w.addSpacer(4);

// Filas de vuelos
for (let i = 0; i < flights.length; i++) {
  const f = flights[i];
  const row = w.addStack();
  row.layoutHorizontally();
  row.spacing = GRP_GAP;

  const vals = [f.prog, f.dest, f.vuelo, f.real, f.est.text];

  let estColor;
  if (f.est.preBoarding) estColor = PRE_COLOR;
  else if (f.est.boarding) estColor = EMB_COLOR;
  else if (f.est.delayed) estColor = DEM_COLOR;
  else if (f.est.canceled) estColor = CAN_COLOR;
  else estColor = OK_COLOR;

  const colors = [TEXT_COLOR, TEXT_COLOR, TEXT_COLOR, TEXT_COLOR, estColor];

  vals.forEach((val, j) => {
    addFlapGroup(row, val, colors[j]);
  });

  w.addSpacer(2);
}

w.addSpacer();
const footer = w.addText(`UPD ${hhmm(new Date())} · DUMMY DATA`);
footer.font = Font.mediumMonospacedSystemFont(8);
footer.textColor = MUTED_COLOR;

Script.setWidget(w);
Script.complete();
