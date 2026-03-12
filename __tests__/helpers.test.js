const {
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
} = require("../helpers");

// ─────────────────────────────────────────────
// AIRPORTS
// ─────────────────────────────────────────────
describe("AIRPORTS", () => {
  test("contiene los 12 aeropuertos de Bolivia", () => {
    const codes = Object.keys(AIRPORTS);
    expect(codes).toHaveLength(12);
    expect(codes).toEqual(
      expect.arrayContaining(["VVI", "LPB", "CBB", "TJA", "SRE", "ORU", "UYU", "CIJ", "RIB", "RBQ", "TDD", "GYA"])
    );
  });

  test("cada aeropuerto tiene name, city y query", () => {
    for (const [code, info] of Object.entries(AIRPORTS)) {
      expect(info).toHaveProperty("name");
      expect(info).toHaveProperty("city");
      expect(info).toHaveProperty("query");
      expect(info.name).toContain(code);
    }
  });
});

// ─────────────────────────────────────────────
// airlineCode
// ─────────────────────────────────────────────
describe("airlineCode", () => {
  test("resuelve aerolíneas principales por nombre exacto", () => {
    expect(airlineCode("Boliviana de Aviacion")).toBe("OB");
    expect(airlineCode("ECOJET")).toBe("EO");
    expect(airlineCode("AMASZONAS")).toBe("Z8");
    expect(airlineCode("LATAM")).toBe("LA");
    expect(airlineCode("COPA")).toBe("CM");
    expect(airlineCode("AVIANCA")).toBe("AV");
  });

  test("es case-insensitive", () => {
    expect(airlineCode("boliviana de aviacion")).toBe("OB");
    expect(airlineCode("latam airlines")).toBe("LA");
    expect(airlineCode("sky")).toBe("H2");
  });

  test("resuelve variantes de nombre", () => {
    expect(airlineCode("BOA")).toBe("OB");
    expect(airlineCode("ECO JET")).toBe("EO");
    expect(airlineCode("LAN")).toBe("LA");
    expect(airlineCode("LAN AIRLINES")).toBe("LA");
    expect(airlineCode("LATAM AIRLINES GROUP")).toBe("LA");
  });

  test("resuelve aerolíneas del backup", () => {
    expect(airlineCode("PARANAIR")).toBe("PZ");
    expect(airlineCode("GOL")).toBe("G3");
    expect(airlineCode("AIR EUROPA")).toBe("UX");
    expect(airlineCode("MINERA SAN CRISTOBAL")).toBe("MSC");
  });

  test("retorna null para aerolíneas desconocidas", () => {
    expect(airlineCode("AEROLÍNEA FANTASMA")).toBeNull();
    expect(airlineCode("")).toBeNull();
    expect(airlineCode(null)).toBeNull();
    expect(airlineCode(undefined)).toBeNull();
  });

  test("hace trim de espacios", () => {
    expect(airlineCode("  LATAM  ")).toBe("LA");
    expect(airlineCode("  BOA  ")).toBe("OB");
  });
});

// ─────────────────────────────────────────────
// normalizeHHMM
// ─────────────────────────────────────────────
describe("normalizeHHMM", () => {
  test("normaliza formatos de hora válidos", () => {
    expect(normalizeHHMM("8:30")).toBe("08:30");
    expect(normalizeHHMM("08:30")).toBe("08:30");
    expect(normalizeHHMM("14:05")).toBe("14:05");
    expect(normalizeHHMM("0:00")).toBe("00:00");
    expect(normalizeHHMM("23:59")).toBe("23:59");
  });

  test("extrae hora de strings con texto extra", () => {
    expect(normalizeHHMM("Sale a las 8:30 hrs")).toBe("08:30");
    expect(normalizeHHMM("Hora: 14:00")).toBe("14:00");
  });

  test("retorna null para entradas inválidas", () => {
    expect(normalizeHHMM("")).toBeNull();
    expect(normalizeHHMM(null)).toBeNull();
    expect(normalizeHHMM(undefined)).toBeNull();
    expect(normalizeHHMM("sin hora")).toBeNull();
    expect(normalizeHHMM("123")).toBeNull();
  });
});

// ─────────────────────────────────────────────
// todayWithHHMM
// ─────────────────────────────────────────────
describe("todayWithHHMM", () => {
  test("retorna null para entradas inválidas", () => {
    expect(todayWithHHMM("")).toBeNull();
    expect(todayWithHHMM(null)).toBeNull();
    expect(todayWithHHMM("no hora")).toBeNull();
  });

  test("retorna un Date para hora válida", () => {
    const result = todayWithHHMM("23:59");
    expect(result).toBeInstanceOf(Date);
  });

  test("la fecha tiene la hora y minutos correctos", () => {
    const result = todayWithHHMM("15:30");
    if (result) {
      expect(result.getHours()).toBe(15);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
    }
  });

  test("hora pasada se mueve al día siguiente", () => {
    const now = new Date();
    const pastHour = now.getHours() - 2;
    if (pastHour >= 0) {
      const timeStr = `${pastHour}:00`;
      const result = todayWithHHMM(timeStr);
      expect(result.getTime()).toBeGreaterThan(now.getTime());
    }
  });
});

// ─────────────────────────────────────────────
// hhmm
// ─────────────────────────────────────────────
describe("hhmm", () => {
  test("retorna espacios para null/undefined", () => {
    expect(hhmm(null)).toBe("     ");
    expect(hhmm(undefined)).toBe("     ");
  });

  test("formatea fecha a HH:MM", () => {
    const d = new Date(2024, 0, 1, 14, 30, 0);
    const result = hhmm(d);
    expect(result).toMatch(/14:30/);
  });

  test("hora con ceros a la izquierda", () => {
    const d = new Date(2024, 0, 1, 8, 5, 0);
    const result = hhmm(d);
    expect(result).toMatch(/08:05/);
  });
});

// ─────────────────────────────────────────────
// destinationIATA
// ─────────────────────────────────────────────
describe("destinationIATA", () => {
  test("retorna '--- ' para null/undefined", () => {
    expect(destinationIATA(null)).toBe("--- ");
    expect(destinationIATA(undefined)).toBe("--- ");
    expect(destinationIATA("")).toBe("--- ");
  });

  test("resuelve destinos bolivianos", () => {
    expect(destinationIATA("Santa Cruz")).toBe("VVI ");
    expect(destinationIATA("La Paz")).toBe("LPB ");
    expect(destinationIATA("Cochabamba")).toBe("CBB ");
    expect(destinationIATA("Sucre")).toBe("SRE ");
    expect(destinationIATA("Tarija")).toBe("TJA ");
  });

  test("resuelve destinos internacionales", () => {
    expect(destinationIATA("Lima")).toBe("LIM ");
    expect(destinationIATA("Miami")).toBe("MIA ");
    expect(destinationIATA("Buenos Aires")).toBe("EZE ");
    expect(destinationIATA("Madrid")).toBe("MAD ");
    expect(destinationIATA("Bogota")).toBe("BOG ");
  });

  test("marca escalas con '+'", () => {
    expect(destinationIATA("Lima - Buenos Aires")).toBe("LIM+");
    expect(destinationIATA("Cochabamba - La Paz")).toBe("CBB+");
  });

  test("retorna '---' para destinos desconocidos", () => {
    expect(destinationIATA("Desconocido")).toBe("--- ");
  });

  test("maneja acentos correctamente", () => {
    expect(destinationIATA("Bogotá")).toBe("BOG ");
    expect(destinationIATA("Panamá")).toBe("PTY ");
    expect(destinationIATA("Tucumán")).toBe("TUC ");
    expect(destinationIATA("São Paulo")).toBe("GRU ");
  });
});

// ─────────────────────────────────────────────
// statusInfo
// ─────────────────────────────────────────────
describe("statusInfo", () => {
  test("detecta pre-embarque", () => {
    const result = statusInfo("PRE EMBARQUE");
    expect(result.text).toBe("PRE");
    expect(result.preBoarding).toBe(true);
  });

  test("detecta embarque", () => {
    expect(statusInfo("EMBARCANDO").text).toBe("EMB");
    expect(statusInfo("EMBARCANDO").boarding).toBe(true);
    expect(statusInfo("ABORDANDO").text).toBe("EMB");
    expect(statusInfo("ABORDANDO").boarding).toBe(true);
  });

  test("detecta demora", () => {
    expect(statusInfo("DEMORADO").text).toBe("DEM");
    expect(statusInfo("DEMORADO").delayed).toBe(true);
    expect(statusInfo("DELAY 30 MIN").text).toBe("DEM");
    expect(statusInfo("DELAY 30 MIN").delayed).toBe(true);
  });

  test("detecta cancelación", () => {
    expect(statusInfo("CANCELADO").text).toBe("CAN");
    expect(statusInfo("CANCELADO").canceled).toBe(true);
    expect(statusInfo("CANCELLED").text).toBe("CAN");
  });

  test("retorna OK por defecto", () => {
    expect(statusInfo("").text).toBe("OK");
    expect(statusInfo(null).text).toBe("OK");
    expect(statusInfo(undefined).text).toBe("OK");
    expect(statusInfo("EN HORA").text).toBe("OK");
  });

  test("es case-insensitive", () => {
    expect(statusInfo("pre embarque").text).toBe("PRE");
    expect(statusInfo("embarcando").text).toBe("EMB");
    expect(statusInfo("cancelado").text).toBe("CAN");
  });

  test("prioriza PRE sobre otros estados", () => {
    // PRE se evalúa primero en la cadena de if/else
    expect(statusInfo("PRE EMBARQUE CANCELADO").text).toBe("PRE");
  });
});

// ─────────────────────────────────────────────
// getHoraReal
// ─────────────────────────────────────────────
describe("getHoraReal", () => {
  test("prioriza f.HORA_REAL", () => {
    expect(getHoraReal({ HORA_REAL_SALIDA: "10:00" }, { HORA_REAL: "09:30" })).toBe("09:30");
  });

  test("usa op.HORA_REAL_SALIDA si f.HORA_REAL no existe", () => {
    expect(getHoraReal({ HORA_REAL_SALIDA: "10:00" }, {})).toBe("10:00");
  });

  test("usa op.HORA_SALIDA_REAL como último recurso", () => {
    expect(getHoraReal({ HORA_SALIDA_REAL: "11:00" }, {})).toBe("11:00");
  });

  test("retorna null si no hay hora real", () => {
    expect(getHoraReal({}, {})).toBeNull();
    expect(getHoraReal(null, null)).toBeNull();
    expect(getHoraReal(undefined, undefined)).toBeNull();
  });
});

// ─────────────────────────────────────────────
// DEST_IATA – Integridad del mapa
// ─────────────────────────────────────────────
describe("DEST_IATA", () => {
  test("todos los códigos IATA son de 3 caracteres", () => {
    for (const [city, code] of Object.entries(DEST_IATA)) {
      expect(code).toMatch(/^[A-Z]{3}$/);
    }
  });

  test("variantes con/sin acento apuntan al mismo código", () => {
    expect(DEST_IATA["BOGOTA"]).toBe(DEST_IATA["BOGOTÁ"]);
    expect(DEST_IATA["PANAMA"]).toBe(DEST_IATA["PANAMÁ"]);
    expect(DEST_IATA["ASUNCION"]).toBe(DEST_IATA["ASUNCIÓN"]);
    expect(DEST_IATA["TUCUMAN"]).toBe(DEST_IATA["TUCUMÁN"]);
    expect(DEST_IATA["SAO PAULO"]).toBe(DEST_IATA["SÃO PAULO"]);
    expect(DEST_IATA["GUAYARAMERIN"]).toBe(DEST_IATA["GUAYARAMERÍN"]);
    expect(DEST_IATA["CUIABA"]).toBe(DEST_IATA["CUIABÁ"]);
  });

  test("CUSCO y CUZCO apuntan al mismo código", () => {
    expect(DEST_IATA["CUSCO"]).toBe(DEST_IATA["CUZCO"]);
    expect(DEST_IATA["CUSCO"]).toBe("CUZ");
  });
});

// ─────────────────────────────────────────────
// AIRLINE maps – Integridad
// ─────────────────────────────────────────────
describe("AIRLINE maps", () => {
  test("BOA tiene múltiples variantes", () => {
    expect(AIRLINE_IATA["BOLIVIANA DE AVIACION"]).toBe("OB");
    expect(AIRLINE_IATA["BOLIVIANA DE AVIACIÓN"]).toBe("OB");
    expect(AIRLINE_IATA["BOA"]).toBe("OB");
  });

  test("LATAM tiene múltiples variantes", () => {
    expect(AIRLINE_IATA["LATAM"]).toBe("LA");
    expect(AIRLINE_IATA["LATAM AIRLINES"]).toBe("LA");
    expect(AIRLINE_IATA["LAN"]).toBe("LA");
    expect(AIRLINE_IATA["LAN AIRLINES"]).toBe("LA");
  });

  test("no hay duplicados entre IATA y BACKUP", () => {
    const iataKeys = Object.keys(AIRLINE_IATA);
    const backupKeys = Object.keys(AIRLINE_BACKUP);
    const overlap = iataKeys.filter(k => backupKeys.includes(k));
    expect(overlap).toHaveLength(0);
  });
});
