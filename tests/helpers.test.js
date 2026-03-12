const {
  AIRPORTS,
  AIRLINE_IATA,
  AIRLINE_BACKUP,
  DEST_IATA,
  HOURS_AHEAD,
  MAX_FLIGHTS,
  airlineCode,
  normalizeHHMM,
  todayWithHHMM,
  destinationIATA,
  statusInfo,
  getHoraReal,
  buildOpsMap,
  mergeAndFilter,
} = require("../lib/helpers");

/* ═══════════════════════════════════════════════
 * airlineCode
 * ═══════════════════════════════════════════════ */
describe("airlineCode", () => {
  test("devuelve código IATA para aerolíneas principales", () => {
    expect(airlineCode("BOA")).toBe("OB");
    expect(airlineCode("Boliviana de Aviacion")).toBe("OB");
    expect(airlineCode("LATAM")).toBe("LA");
    expect(airlineCode("AMASZONAS")).toBe("Z8");
    expect(airlineCode("ECOJET")).toBe("EO");
    expect(airlineCode("ECO JET")).toBe("EO");
    expect(airlineCode("AVIANCA")).toBe("AV");
    expect(airlineCode("COPA")).toBe("CM");
    expect(airlineCode("AMERICAN AIRLINES")).toBe("AA");
  });

  test("devuelve código del mapa backup", () => {
    expect(airlineCode("PARANAIR")).toBe("PZ");
    expect(airlineCode("GOL")).toBe("G3");
    expect(airlineCode("AIR EUROPA")).toBe("UX");
    expect(airlineCode("MINERA SAN CRISTOBAL")).toBe("MSC");
  });

  test("es case-insensitive y trimea espacios", () => {
    expect(airlineCode("  latam  ")).toBe("LA");
    expect(airlineCode("boa")).toBe("OB");
    expect(airlineCode("Ecojet")).toBe("EO");
  });

  test("devuelve null para aerolíneas desconocidas", () => {
    expect(airlineCode("DESCONOCIDA")).toBeNull();
    expect(airlineCode("")).toBeNull();
    expect(airlineCode(null)).toBeNull();
    expect(airlineCode(undefined)).toBeNull();
  });

  test("maneja variantes con acentos", () => {
    expect(airlineCode("BOLIVIANA DE AVIACIÓN")).toBe("OB");
    expect(airlineCode("GOL LINHAS AÉREAS")).toBe("G3");
    expect(airlineCode("AIR EUROPA LÍNEAS AÉREAS")).toBe("UX");
    expect(airlineCode("MINERA SAN CRISTÓBAL")).toBe("MSC");
  });
});

/* ═══════════════════════════════════════════════
 * normalizeHHMM
 * ═══════════════════════════════════════════════ */
describe("normalizeHHMM", () => {
  test("normaliza hora con cero a la izquierda", () => {
    expect(normalizeHHMM("8:30")).toBe("08:30");
    expect(normalizeHHMM("3:05")).toBe("03:05");
  });

  test("mantiene horas de 2 dígitos", () => {
    expect(normalizeHHMM("14:30")).toBe("14:30");
    expect(normalizeHHMM("23:59")).toBe("23:59");
    expect(normalizeHHMM("00:00")).toBe("00:00");
  });

  test("extrae hora de cadenas más largas", () => {
    expect(normalizeHHMM("Sale a las 9:15 hrs")).toBe("09:15");
  });

  test("devuelve null para entradas inválidas", () => {
    expect(normalizeHHMM("")).toBeNull();
    expect(normalizeHHMM(null)).toBeNull();
    expect(normalizeHHMM(undefined)).toBeNull();
    expect(normalizeHHMM("sin hora")).toBeNull();
    expect(normalizeHHMM("abc")).toBeNull();
  });
});

/* ═══════════════════════════════════════════════
 * todayWithHHMM
 * ═══════════════════════════════════════════════ */
describe("todayWithHHMM", () => {
  test("devuelve Date con hora correcta para hora futura", () => {
    const ref = new Date(2025, 5, 15, 10, 0, 0); // 15 jun 2025, 10:00
    const result = todayWithHHMM("14:30", ref);
    expect(result).toBeInstanceOf(Date);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
    expect(result.getDate()).toBe(15);
  });

  test("ajusta al día siguiente si la hora ya pasó", () => {
    const ref = new Date(2025, 5, 15, 20, 0, 0); // 15 jun 2025, 20:00
    const result = todayWithHHMM("08:00", ref);
    expect(result.getDate()).toBe(16); // día siguiente
    expect(result.getHours()).toBe(8);
  });

  test("devuelve null para entrada inválida", () => {
    expect(todayWithHHMM(null)).toBeNull();
    expect(todayWithHHMM("")).toBeNull();
    expect(todayWithHHMM("no es hora")).toBeNull();
  });
});

/* ═══════════════════════════════════════════════
 * destinationIATA
 * ═══════════════════════════════════════════════ */
describe("destinationIATA", () => {
  test("convierte nombre de ciudad a código IATA", () => {
    expect(destinationIATA("Santa Cruz")).toBe("VVI");
    expect(destinationIATA("La Paz")).toBe("LPB");
    expect(destinationIATA("Cochabamba")).toBe("CBB");
    expect(destinationIATA("Lima")).toBe("LIM");
    expect(destinationIATA("Miami")).toBe("MIA");
  });

  test("maneja rutas multi-tramo", () => {
    expect(destinationIATA("Santa Cruz - Cochabamba")).toBe("VVI (1)");
    expect(destinationIATA("Lima - Cusco - La Paz")).toBe("LIM (2)");
  });

  test("devuelve --- para destinos desconocidos", () => {
    expect(destinationIATA("Ciudad Desconocida")).toBe("---");
  });

  test("devuelve --- para null/undefined", () => {
    expect(destinationIATA(null)).toBe("---");
    expect(destinationIATA(undefined)).toBe("---");
    expect(destinationIATA("")).toBe("---");
  });

  test("maneja variantes con acentos", () => {
    expect(destinationIATA("Bogotá")).toBe("BOG");
    expect(destinationIATA("Panamá")).toBe("PTY");
    expect(destinationIATA("São Paulo")).toBe("GRU");
    expect(destinationIATA("Asunción")).toBe("ASU");
  });
});

/* ═══════════════════════════════════════════════
 * statusInfo
 * ═══════════════════════════════════════════════ */
describe("statusInfo", () => {
  test("detecta pre-embarque", () => {
    const r = statusInfo("PRE EMBARQUE");
    expect(r.text).toBe("PRE");
    expect(r.preBoarding).toBe(true);
  });

  test("detecta embarque (español)", () => {
    const r = statusInfo("EMBARCANDO");
    expect(r.text).toBe("EMB");
    expect(r.boarding).toBe(true);
  });

  test("detecta embarque (ABORD)", () => {
    const r = statusInfo("ABORDANDO");
    expect(r.text).toBe("EMB");
    expect(r.boarding).toBe(true);
  });

  test("detecta demorado (español)", () => {
    const r = statusInfo("DEMORADO 30 MIN");
    expect(r.text).toBe("DEM");
    expect(r.delayed).toBe(true);
  });

  test("detecta delayed (inglés)", () => {
    const r = statusInfo("DELAYED");
    expect(r.text).toBe("DEM");
    expect(r.delayed).toBe(true);
  });

  test("detecta cancelado", () => {
    const r = statusInfo("CANCELADO");
    expect(r.text).toBe("CAN");
    expect(r.canceled).toBe(true);
  });

  test("devuelve OK para estado normal o vacío", () => {
    expect(statusInfo("").text).toBe("OK");
    expect(statusInfo(null).text).toBe("OK");
    expect(statusInfo("A TIEMPO").text).toBe("OK");
  });

  test("es case-insensitive", () => {
    expect(statusInfo("pre embarque").text).toBe("PRE");
    expect(statusInfo("Cancelado").text).toBe("CAN");
    expect(statusInfo("delayed").text).toBe("DEM");
  });
});

/* ═══════════════════════════════════════════════
 * getHoraReal
 * ═══════════════════════════════════════════════ */
describe("getHoraReal", () => {
  test("prioriza HORA_REAL del vuelo (f)", () => {
    const op = { HORA_REAL_SALIDA: "10:00" };
    const f = { HORA_REAL: "09:45" };
    expect(getHoraReal(op, f)).toBe("09:45");
  });

  test("usa HORA_REAL_SALIDA del operativo como fallback", () => {
    const op = { HORA_REAL_SALIDA: "10:00" };
    expect(getHoraReal(op, {})).toBe("10:00");
  });

  test("usa HORA_SALIDA_REAL como último fallback", () => {
    const op = { HORA_SALIDA_REAL: "10:15" };
    expect(getHoraReal(op, {})).toBe("10:15");
  });

  test("devuelve null si no hay hora real", () => {
    expect(getHoraReal({}, {})).toBeNull();
    expect(getHoraReal(null, null)).toBeNull();
  });
});

/* ═══════════════════════════════════════════════
 * buildOpsMap
 * ═══════════════════════════════════════════════ */
describe("buildOpsMap", () => {
  test("construye mapa con clave aerolínea+vuelo", () => {
    const ops = [
      { NOMBRE_AEROLINEA: "BOA", NRO_VUELO: "101" },
      { NOMBRE_AEROLINEA: "LATAM", NRO_VUELO: "505" },
    ];
    const map = buildOpsMap(ops);
    expect(map["OB101"]).toBeDefined();
    expect(map["LA505"]).toBeDefined();
  });

  test("usa solo número si aerolínea desconocida", () => {
    const ops = [{ NOMBRE_AEROLINEA: "DESCONOCIDA", NRO_VUELO: "999" }];
    const map = buildOpsMap(ops);
    expect(map["999"]).toBeDefined();
  });

  test("devuelve mapa vacío para lista vacía", () => {
    expect(buildOpsMap([])).toEqual({});
  });
});

/* ═══════════════════════════════════════════════
 * mergeAndFilter
 * ═══════════════════════════════════════════════ */
describe("mergeAndFilter", () => {
  const NOW = new Date(2025, 5, 15, 10, 0, 0).getTime(); // 15 jun 2025, 10:00

  test("devuelve vuelos dentro de la ventana de 12h", () => {
    const itin = [
      {
        NOMBRE_AEROLINEA: "BOA",
        NRO_VUELO: "101",
        HORA_PROGRAMADA: "12:00",
        RUTA0: "La Paz",
      },
      {
        NOMBRE_AEROLINEA: "BOA",
        NRO_VUELO: "102",
        HORA_PROGRAMADA: "14:30",
        RUTA0: "Cochabamba",
      },
    ];
    const flights = mergeAndFilter(itin, [], NOW);
    expect(flights).toHaveLength(2);
    expect(flights[0].vuelo).toBe("OB101");
    expect(flights[1].vuelo).toBe("OB102");
  });

  test("mantiene vuelos activos (demorados) aunque estén fuera de ventana", () => {
    const itin = [
      {
        NOMBRE_AEROLINEA: "BOA",
        NRO_VUELO: "101",
        HORA_PROGRAMADA: "08:00", // ya pasó (ahora son 10:00)
        RUTA0: "La Paz",
      },
    ];
    const ops = [
      {
        NOMBRE_AEROLINEA: "BOA",
        NRO_VUELO: "101",
        ESTADO: "DEMORADO",
      },
    ];
    const flights = mergeAndFilter(itin, ops, NOW);
    // El vuelo se ajusta al día siguiente porque 08:00 < 10:00 (now)
    // Pero como tiene estado DEMORADO se mantiene activo
    expect(flights.length).toBeGreaterThanOrEqual(1);
    const found = flights.find((f) => f.vuelo === "OB101");
    expect(found).toBeDefined();
    expect(found.est.delayed).toBe(true);
  });

  test("fusiona datos de itinerario con operativo", () => {
    const itin = [
      {
        NOMBRE_AEROLINEA: "LATAM",
        NRO_VUELO: "505",
        HORA_PROGRAMADA: "15:00",
        RUTA0: "Lima",
      },
    ];
    const ops = [
      {
        NOMBRE_AEROLINEA: "LATAM",
        NRO_VUELO: "505",
        HORA_REAL_SALIDA: "15:20",
        ESTADO: "EMBARCANDO",
      },
    ];
    const flights = mergeAndFilter(itin, ops, NOW);
    expect(flights).toHaveLength(1);
    expect(flights[0].vuelo).toBe("LA505");
    expect(flights[0].est.text).toBe("EMB");
    expect(flights[0].real).not.toBeNull();
  });

  test("incluye vuelos solo del operativo que no están en itinerario", () => {
    const ops = [
      {
        NOMBRE_AEROLINEA: "AVIANCA",
        NRO_VUELO: "200",
        HORA_ESTIMADA: "16:00",
        DESTINO: "Bogotá",
        ESTADO: "",
      },
    ];
    const flights = mergeAndFilter([], ops, NOW);
    expect(flights).toHaveLength(1);
    expect(flights[0].vuelo).toBe("AV200");
    expect(flights[0].dest).toBe("BOG");
  });

  test("no duplica vuelos que están en ambos feeds", () => {
    const itin = [
      {
        NOMBRE_AEROLINEA: "BOA",
        NRO_VUELO: "101",
        HORA_PROGRAMADA: "12:00",
        RUTA0: "La Paz",
      },
    ];
    const ops = [
      {
        NOMBRE_AEROLINEA: "BOA",
        NRO_VUELO: "101",
        HORA_ESTIMADA: "12:00",
        DESTINO: "La Paz",
        ESTADO: "",
      },
    ];
    const flights = mergeAndFilter(itin, ops, NOW);
    expect(flights).toHaveLength(1);
  });

  test("limita a MAX_FLIGHTS resultados", () => {
    const itin = Array.from({ length: 15 }, (_, i) => ({
      NOMBRE_AEROLINEA: "BOA",
      NRO_VUELO: String(100 + i),
      HORA_PROGRAMADA: `${11 + Math.floor(i / 4)}:${(i % 4) * 15 || "00"}`,
      RUTA0: "La Paz",
    }));
    const flights = mergeAndFilter(itin, [], NOW);
    expect(flights.length).toBeLessThanOrEqual(MAX_FLIGHTS);
  });

  test("ordena por hora real cuando disponible", () => {
    const itin = [
      {
        NOMBRE_AEROLINEA: "BOA",
        NRO_VUELO: "101",
        HORA_PROGRAMADA: "12:00",
        RUTA0: "La Paz",
      },
      {
        NOMBRE_AEROLINEA: "LATAM",
        NRO_VUELO: "505",
        HORA_PROGRAMADA: "11:00",
        RUTA0: "Lima",
      },
    ];
    const ops = [
      {
        NOMBRE_AEROLINEA: "BOA",
        NRO_VUELO: "101",
        HORA_REAL_SALIDA: "10:30",
      },
    ];
    const flights = mergeAndFilter(itin, ops, NOW);
    // OB101 tiene hora real 10:30, LA505 tiene prog 11:00
    // OB101 debería estar primero
    expect(flights[0].vuelo).toBe("OB101");
  });

  test("maneja listas vacías", () => {
    expect(mergeAndFilter([], [], NOW)).toEqual([]);
    expect(mergeAndFilter(null, null, NOW)).toEqual([]);
  });
});

/* ═══════════════════════════════════════════════
 * Constantes y mapas de datos
 * ═══════════════════════════════════════════════ */
describe("Constantes", () => {
  test("HOURS_AHEAD es 12", () => {
    expect(HOURS_AHEAD).toBe(12);
  });

  test("MAX_FLIGHTS es 10", () => {
    expect(MAX_FLIGHTS).toBe(10);
  });

  test("AIRPORTS incluye los 12 aeropuertos bolivianos", () => {
    const codes = Object.keys(AIRPORTS);
    expect(codes).toHaveLength(12);
    expect(codes).toContain("VVI");
    expect(codes).toContain("LPB");
    expect(codes).toContain("CBB");
  });

  test("cada aeropuerto tiene name y query", () => {
    for (const [code, airport] of Object.entries(AIRPORTS)) {
      expect(airport).toHaveProperty("name");
      expect(airport).toHaveProperty("query");
      expect(airport.name).toContain(code);
    }
  });

  test("AIRLINE_IATA cubre las aerolíneas principales", () => {
    expect(Object.keys(AIRLINE_IATA).length).toBeGreaterThanOrEqual(10);
  });

  test("DEST_IATA cubre destinos nacionales e internacionales", () => {
    expect(Object.keys(DEST_IATA).length).toBeGreaterThanOrEqual(20);
  });
});
