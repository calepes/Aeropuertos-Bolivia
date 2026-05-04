#!/usr/bin/env node
// CLI: consulta estado de vuelo en aeropuertos bolivianos via API NAABOL.
// Salida: JSON. Sin dependencias (Node 18+ con fetch nativo).
//
// Uso:
//   node consultar-vuelo.mjs --vuelo OB657
//   node consultar-vuelo.mjs --vuelo OB657 --aeropuerto VVI --tipo S
//   node consultar-vuelo.mjs --json '{"vuelo":"OB657","aeropuerto":"VVI"}'
//
// Fuente: https://fids.naabol.gob.bo/Fids/itin/vuelos
// Endpoint operativo (gate en tiempo real) actualmente caído (404). El
// itinerario ya trae NRO_PUERTA cuando está asignado.

const AIRPORTS = {
  VVI: { name: 'Viru Viru', city: 'Santa Cruz', query: 'Viru Viru' },
  LPB: { name: 'El Alto', city: 'La Paz', query: 'El Alto' },
  CBB: { name: 'Jorge Wilstermann', city: 'Cochabamba', query: 'Jorge Wilstermann' },
  TJA: { name: 'Tarija', city: 'Tarija', query: 'Tarija' },
  SRE: { name: 'Sucre', city: 'Sucre', query: 'Sucre' },
  ORU: { name: 'Oruro', city: 'Oruro', query: 'Oruro' },
  UYU: { name: 'Uyuni', city: 'Uyuni', query: 'Uyuni' },
  CIJ: { name: 'Cobija', city: 'Cobija', query: 'Cobija' },
  RIB: { name: 'Riberalta', city: 'Riberalta', query: 'Riberalta' },
  RBQ: { name: 'Rurrenabaque', city: 'Rurrenabaque', query: 'Rurrenabaque' },
  TDD: { name: 'Trinidad', city: 'Trinidad', query: 'Trinidad' },
  GYA: { name: 'Guayaramerin', city: 'Guayaramerín', query: 'Guayaramerin' },
};

const AIRLINE_IATA = {
  'BOLIVIANA DE AVIACION': 'OB',
  'BOLIVIANA DE AVIACIÓN': 'OB',
  BOA: 'OB',
  ECOJET: 'EO',
  'ECO JET': 'EO',
  AMASZONAS: 'Z8',
  LATAM: 'LA',
  'LATAM AIRLINES': 'LA',
  'LATAM AIRLINES GROUP': 'LA',
  LAN: 'LA',
  'LAN AIRLINES': 'LA',
  SKY: 'H2',
  AVIANCA: 'AV',
  COPA: 'CM',
  'AMERICAN AIRLINES': 'AA',
  UNITED: 'UA',
  IBERIA: 'IB',
  FLYBONDI: 'FU',
};

const NAABOL_BASE = 'https://fids.naabol.gob.bo/Fids/itin/vuelos';
const FETCH_TIMEOUT_MS = 8000;

function airlineToIata(nombre) {
  const key = (nombre || '').trim().toUpperCase();
  return AIRLINE_IATA[key] || null;
}

function parseFlightCode(input) {
  const raw = String(input || '').trim().toUpperCase();
  if (!raw) return { iata: null, numero: null };
  // patrones: "OB657", "BOA657", "BOA 657", "OB 657", "657"
  const m = raw.match(/^([A-Z]{2,4})\s*(\d{1,5})$/);
  if (m) {
    const prefix = m[1];
    const numero = m[2];
    // Si prefix es código de aerolínea conocido (BOA → OB), mapear
    const iata = AIRLINE_IATA[prefix] || (prefix.length === 2 ? prefix : null);
    return { iata, numero };
  }
  // solo números
  if (/^\d{1,5}$/.test(raw)) {
    return { iata: null, numero: raw };
  }
  return { iata: null, numero: null };
}

function categorizeStatus(obsEs, obsEn) {
  const en = (obsEn || '').trim().toUpperCase();
  const es = (obsEs || '').trim().toUpperCase();
  if (en.includes('CANCEL') || es.includes('CANCEL')) return 'cancelled';
  // pre-* primero (incluyen subcadena "boarding"/"embarque")
  if (en.includes('PRE-BOARD') || en.includes('PRE BOARD') || es.includes('PRE-EMBARQUE') || es.includes('PRE EMBARQUE')) return 'pre-boarding';
  if (en.includes('BOARDING') || es.includes('ABORDANDO') || es.includes('EMBARQUE')) return 'boarding';
  if (en.includes('DELAY') || es.includes('RETRAS') || es.includes('DEMORA')) return 'delayed';
  if (en.includes('LANDED') || en.includes('TIERRA') || es.includes('ATERRIZ') || es.includes('EN TIERRA')) return 'landed';
  if (en.includes('DEPARTED') || es.includes('DESPACH') || es.includes('DESPEG')) return 'departed';
  if (en.includes('CHECK')) return 'check-in';
  if (en === '' || en.includes('ON TIME') || en.includes('CONFIRMED') || es === '' || es.includes('A TIEMPO') || es.includes('CONFIRMADO')) return 'on-time';
  return 'other';
}

// Re-categoriza un vuelo "on-time" como "delayed" si la diff entre horaReal y
// horaProgramada supera el threshold (default 15 min). NAABOL sigue marcando
// CONFIRMADO incluso cuando hay retraso evidente — esta función lo detecta.
function adjustForDelay(category, horaProgramada, horaReal, thresholdMin = 15) {
  if (category !== 'on-time') return category; // ya tiene un estado más fuerte
  if (!horaProgramada || !horaReal) return category;
  const [hp, mp] = horaProgramada.split(':').map(Number);
  const [hr, mr] = horaReal.split(':').map(Number);
  if ([hp, mp, hr, mr].some((n) => Number.isNaN(n))) return category;
  let diff = hr * 60 + mr - (hp * 60 + mp);
  // si cruza medianoche al revés, asume retraso (no adelanto de >12h)
  if (diff < -12 * 60) diff += 24 * 60;
  if (diff > thresholdMin) return 'delayed';
  return category;
}

async function fetchAirport(iata, tipo) {
  const ap = AIRPORTS[iata];
  if (!ap) throw new Error(`Aeropuerto desconocido: ${iata}`);
  const url = `${NAABOL_BASE}?aero=${encodeURIComponent(ap.query)}&tipo=${tipo}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } finally {
    clearTimeout(t);
  }
}

function recordToMatch(rec, iata, tipo) {
  const aerolineaIata = airlineToIata(rec.NOMBRE_AEROLINEA);
  const ruta = (rec.RUTA0 || rec.RUTA || '').trim();
  const horaReal = (rec.HORA_REAL || '').trim() || null;
  const gate = (rec.NRO_PUERTA || '').toString().trim() || null;
  const obsEs = (rec.OBSERVACION || '').trim();
  const obsEn = (rec.OBSERVACION_INGLES || '').trim();
  const horaProgramada = (rec.HORA_ESTIMADA || '').trim() || null;
  const baseCategory = categorizeStatus(obsEs, obsEn);
  const estadoCategoria = adjustForDelay(baseCategory, horaProgramada, horaReal);
  return {
    vuelo: aerolineaIata ? `${aerolineaIata}${rec.NRO_VUELO}` : `${rec.NRO_VUELO}`,
    numero: String(rec.NRO_VUELO || ''),
    aerolinea: rec.NOMBRE_AEROLINEA || null,
    aerolineaIata,
    aeropuerto: iata,
    aeropuertoNombre: rec.AEROPUERTO || AIRPORTS[iata]?.name || null,
    tipo, // 'S' | 'L'
    tipoLabel: tipo === 'S' ? 'salida' : 'llegada',
    ruta,
    fecha: (rec.FECHA || '').slice(0, 10) || null,
    horaProgramada,
    horaReal,
    gate,
    estado: obsEs || null,
    estadoIngles: obsEn || null,
    estadoCategoria,
    fuente: 'naabol-itinerario',
  };
}

function matchesQuery(rec, target) {
  if (target.numero && String(rec.NRO_VUELO || '').replace(/^0+/, '') !== target.numero.replace(/^0+/, '')) {
    return false;
  }
  if (target.iata) {
    const recIata = airlineToIata(rec.NOMBRE_AEROLINEA);
    if (recIata !== target.iata) return false;
  }
  return true;
}

function parseArgs(argv) {
  // out.vuelos = array (puede ser repetido o coma-separado).
  // out.aeropuerto / out.tipo = top-level (aplican a todos los vuelos sin override).
  // out.all = modo abierto (sin código de vuelo, devuelve todos los matches del aeropuerto).
  // out.horaDesde / out.horaHasta = filtro client-side por hora programada (HH:MM, modo --all).
  const out = {
    vuelos: [],
    aeropuerto: null,
    tipo: null,
    json: null,
    all: false,
    horaDesde: null,
    horaHasta: null,
    aerolinea: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--vuelo') out.vuelos.push(argv[++i]);
    else if (a === '--aeropuerto') out.aeropuerto = argv[++i];
    else if (a === '--tipo') out.tipo = argv[++i];
    else if (a === '--json') out.json = argv[++i];
    else if (a === '--all') out.all = true;
    else if (a === '--hora-desde') out.horaDesde = argv[++i];
    else if (a === '--hora-hasta') out.horaHasta = argv[++i];
    else if (a === '--aerolinea') out.aerolinea = argv[++i];
    else if (a === '--help' || a === '-h') out.help = true;
  }
  // expandir comas: --vuelo OB659,OB687 → ["OB659","OB687"]
  out.vuelos = out.vuelos.flatMap((v) => v.split(',').map((s) => s.trim()).filter(Boolean));
  return out;
}

// Construye la lista de queries [{vuelo, aeropuerto, tipo}].
// Soporta:
//   --vuelo X              → [{vuelo:X, aeropuerto: top, tipo: top}]
//   --vuelo X --vuelo Y    → 2 queries, mismos top defaults
//   --vuelo X,Y,Z          → 3 queries, mismos top defaults
//   --json '{"vuelo":"X"}'  → singular legacy
//   --json '{"vuelos":["X","Y"], "aeropuerto":"VVI"}' → mismos defaults
//   --json '{"queries":[{"vuelo":"X","aeropuerto":"VVI"},{"vuelo":"Y","tipo":"L"}]}' → cada uno con su override
function buildQueries(args) {
  const queries = [];
  if (args.json) {
    let parsed;
    try {
      parsed = JSON.parse(args.json);
    } catch (e) {
      throw new Error(`--json inválido: ${e.message}`);
    }
    if (Array.isArray(parsed.queries)) {
      for (const q of parsed.queries) {
        queries.push({
          vuelo: q.vuelo,
          aeropuerto: q.aeropuerto || parsed.aeropuerto || args.aeropuerto || null,
          tipo: q.tipo || parsed.tipo || args.tipo || null,
        });
      }
    } else if (Array.isArray(parsed.vuelos)) {
      for (const v of parsed.vuelos) {
        queries.push({
          vuelo: v,
          aeropuerto: parsed.aeropuerto || args.aeropuerto || null,
          tipo: parsed.tipo || args.tipo || null,
        });
      }
    } else if (parsed.vuelo) {
      queries.push({
        vuelo: parsed.vuelo,
        aeropuerto: parsed.aeropuerto || args.aeropuerto || null,
        tipo: parsed.tipo || args.tipo || null,
      });
    }
  }
  for (const v of args.vuelos) {
    queries.push({ vuelo: v, aeropuerto: args.aeropuerto || null, tipo: args.tipo || null });
  }
  return queries;
}

function printHelp() {
  const txt = `Uso (1 vuelo):
  consultar-vuelo.mjs --vuelo OB659 [--aeropuerto IATA] [--tipo S|L]

Uso (varios vuelos):
  consultar-vuelo.mjs --vuelo OB659,OB687
  consultar-vuelo.mjs --vuelo OB659 --vuelo OB687 --aeropuerto VVI
  consultar-vuelo.mjs --json '{"vuelos":["OB659","OB687"],"aeropuerto":"VVI"}'
  consultar-vuelo.mjs --json '{"queries":[{"vuelo":"OB659","aeropuerto":"VVI"},{"vuelo":"EO321","tipo":"L"}]}'

Uso (consulta abierta — todos los vuelos del aeropuerto):
  consultar-vuelo.mjs --all --aeropuerto VVI [--tipo S|L] [--hora-desde 08:00] [--hora-hasta 12:00] [--aerolinea OB|BoA]

Aeropuertos: ${Object.keys(AIRPORTS).join(', ')}
Tipo: S (salidas), L (llegadas). Si se omite, busca ambos.
Salida JSON (1+ vuelos): { resultados: [{consulta, found, matches[], razon}], errors[], consultadoTs, fuente, nota }
Salida JSON (--all): { consulta, total, matches[], errors[], consultadoTs, fuente, nota }`;
  console.log(txt);
}

// HH:MM string → minutos desde medianoche (para comparar contra rangos).
// Acepta "07:20", "7:20", "0720". null/'' → null.
function hhmmToMinutes(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{1,2}):?(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mi = parseInt(m[2], 10);
  if (isNaN(h) || isNaN(mi) || h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

// Modo --all: fetchea aeropuerto+tipo y retorna TODOS los records parseados,
// sin filtrar por número de vuelo. Filtra opcionalmente por horaDesde/horaHasta
// (HH:MM contra horaProgramada) y aerolinea (IATA o nombre).
async function runAll(args) {
  if (!args.aeropuerto) {
    console.log(JSON.stringify({ error: '--all requiere --aeropuerto' }, null, 2));
    process.exit(1);
  }
  const ap = args.aeropuerto.toUpperCase();
  if (!AIRPORTS[ap]) {
    console.log(JSON.stringify({
      error: `aeropuerto desconocido: "${args.aeropuerto}"`,
      validos: Object.keys(AIRPORTS),
    }, null, 2));
    process.exit(1);
  }
  const tipos = args.tipo ? [args.tipo.toUpperCase()] : ['S', 'L'];
  const desdeMin = hhmmToMinutes(args.horaDesde);
  const hastaMin = hhmmToMinutes(args.horaHasta);
  const aerolineaFilter = args.aerolinea
    ? (AIRLINE_IATA[args.aerolinea.toUpperCase()] || args.aerolinea.toUpperCase())
    : null;

  const errors = [];
  const allMatches = [];
  await Promise.all(tipos.map(async (tipo) => {
    try {
      const records = await fetchAirport(ap, tipo);
      for (const rec of records) {
        const match = recordToMatch(rec, ap, tipo);
        if (aerolineaFilter && match.aerolineaIata !== aerolineaFilter) continue;
        if (desdeMin !== null || hastaMin !== null) {
          const recMin = hhmmToMinutes(match.horaProgramada);
          if (recMin === null) continue; // no podemos filtrar sin hora
          if (desdeMin !== null && recMin < desdeMin) continue;
          if (hastaMin !== null && recMin > hastaMin) continue;
        }
        allMatches.push(match);
      }
    } catch (err) {
      errors.push({ aeropuerto: ap, tipo, error: String(err.message || err) });
    }
  }));

  // Sort by horaProgramada (sin hora al final)
  allMatches.sort((a, b) => {
    const am = hhmmToMinutes(a.horaProgramada);
    const bm = hhmmToMinutes(b.horaProgramada);
    if (am === null && bm === null) return 0;
    if (am === null) return 1;
    if (bm === null) return -1;
    return am - bm;
  });

  const output = {
    consultadoTs: new Date().toISOString(),
    fuente: 'NAABOL',
    consulta: {
      modo: 'all',
      aeropuerto: ap,
      tipo: args.tipo ? args.tipo.toUpperCase() : null,
      horaDesde: args.horaDesde || null,
      horaHasta: args.horaHasta || null,
      aerolinea: aerolineaFilter,
    },
    total: allMatches.length,
    matches: allMatches,
  };
  if (allMatches.length === 0) {
    output.nota = 'Sin resultados en el itinerario NAABOL para esta consulta. Verificá código de vuelo o aeropuerto.';
  }
  if (errors.length) output.errors = errors;
  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Modo --all: consulta abierta sin código de vuelo.
  if (args.all) {
    await runAll(args);
    return;
  }

  const queries = buildQueries(args);
  if (queries.length === 0) {
    console.log(JSON.stringify({ resultados: [], error: 'falta --vuelo (o --json con vuelos/queries, o --all --aeropuerto IATA)' }, null, 2));
    process.exit(1);
  }

  // Validar aeropuertos por query (rápido fail si alguno mal).
  for (const q of queries) {
    if (q.aeropuerto && !AIRPORTS[q.aeropuerto.toUpperCase()]) {
      console.log(JSON.stringify({
        error: `aeropuerto desconocido: "${q.aeropuerto}"`,
        validos: Object.keys(AIRPORTS),
      }, null, 2));
      process.exit(1);
    }
  }

  // Determinar fetches únicos (ap, tipo) sumando lo que cada query necesita.
  // Esto evita refetch cuando varios vuelos comparten aeropuerto.
  const fetchKeys = new Set();
  for (const q of queries) {
    const aps = q.aeropuerto ? [q.aeropuerto.toUpperCase()] : Object.keys(AIRPORTS);
    const tipos = q.tipo ? [q.tipo.toUpperCase()] : ['S', 'L'];
    for (const ap of aps) for (const tipo of tipos) fetchKeys.add(`${ap}|${tipo}`);
  }

  const fetched = {};
  const errors = [];
  await Promise.all([...fetchKeys].map(async (key) => {
    const [ap, tipo] = key.split('|');
    try {
      fetched[key] = await fetchAirport(ap, tipo);
    } catch (err) {
      fetched[key] = [];
      errors.push({ aeropuerto: ap, tipo, error: String(err.message || err) });
    }
  }));

  // Construir resultado por query.
  const resultados = queries.map((q) => {
    const consulta = {
      vuelo: q.vuelo,
      vueloParseado: parseFlightCode(q.vuelo),
      aeropuerto: q.aeropuerto || null,
      tipo: q.tipo || null,
    };
    if (!consulta.vueloParseado.numero) {
      return {
        consulta,
        found: false,
        matches: [],
        razon: `código no parseable: "${q.vuelo}"`,
      };
    }
    const aps = q.aeropuerto ? [q.aeropuerto.toUpperCase()] : Object.keys(AIRPORTS);
    const tipos = q.tipo ? [q.tipo.toUpperCase()] : ['S', 'L'];
    const matches = [];
    for (const ap of aps) {
      for (const tipo of tipos) {
        const records = fetched[`${ap}|${tipo}`] || [];
        for (const rec of records) {
          if (matchesQuery(rec, consulta.vueloParseado)) {
            matches.push(recordToMatch(rec, ap, tipo));
          }
        }
      }
    }
    return {
      consulta,
      found: matches.length > 0,
      matches,
      razon: matches.length === 0
        ? `vuelo "${q.vuelo}" no aparece en ${aps.length} aeropuerto(s) × ${tipos.length} tipo(s)`
        : null,
    };
  });

  const totalMatches = resultados.reduce((acc, r) => acc + (r.matches?.length || 0), 0);
  const output = {
    consultadoTs: new Date().toISOString(),
    fuente: 'NAABOL',
    resultados,
  };
  if (totalMatches === 0) {
    output.nota = 'Sin resultados en el itinerario NAABOL para esta consulta. Verificá código de vuelo o aeropuerto.';
  }
  if (errors.length) output.errors = errors;

  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.log(JSON.stringify({ found: false, error: String(err.message || err) }, null, 2));
  process.exit(1);
});
