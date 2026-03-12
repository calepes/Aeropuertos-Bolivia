const { onRequest } = require("../functions/exchange");

// Mock global fetch
global.fetch = jest.fn();

// Polyfill Response para Node (Cloudflare Workers tiene Response nativo)
global.Response = class Response {
  constructor(body, init = {}) {
    this._body = body;
    this.status = init.status || 200;
    this.headers = new Map(Object.entries(init.headers || {}));
  }
  async text() {
    return this._body;
  }
  async json() {
    return JSON.parse(this._body);
  }
};

beforeEach(() => {
  fetch.mockClear();
});

describe("exchange onRequest", () => {
  test("devuelve buy y sell correctamente", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ buyAveragePrice: 6.96, sellAveragePrice: 6.97 }),
    });

    const res = await onRequest();
    const data = await res.json();

    expect(data.buy).toBe(6.96);
    expect(data.sell).toBe(6.97);
    expect(res.status).toBe(200);
  });

  test("devuelve 502 si upstream falla", async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const res = await onRequest();
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.error).toBe("upstream_error");
  });

  test("devuelve 500 si fetch lanza error", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    const res = await onRequest();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("fetch_failed");
  });

  test("incluye header Cache-Control en respuesta exitosa", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ buyAveragePrice: 7.0, sellAveragePrice: 7.1 }),
    });

    const res = await onRequest();
    expect(res.headers.get("Cache-Control")).toBe("max-age=300");
  });

  test("incluye Content-Type json en todas las respuestas", async () => {
    // Éxito
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ buyAveragePrice: 7.0, sellAveragePrice: 7.1 }),
    });
    const res1 = await onRequest();
    expect(res1.headers.get("Content-Type")).toBe("application/json");

    // Error upstream
    fetch.mockResolvedValueOnce({ ok: false });
    const res2 = await onRequest();
    expect(res2.headers.get("Content-Type")).toBe("application/json");

    // Error de red
    fetch.mockRejectedValueOnce(new Error("fail"));
    const res3 = await onRequest();
    expect(res3.headers.get("Content-Type")).toBe("application/json");
  });

  test("llama al endpoint correcto de dolarboliviahoy", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ buyAveragePrice: 7.0, sellAveragePrice: 7.1 }),
    });

    await onRequest();

    expect(fetch).toHaveBeenCalledWith(
      "https://dolarboliviahoy.com/api/exchangeData",
      { headers: { Accept: "application/json" } }
    );
  });
});
