/**
 * Tests para la lógica de functions/exchange.js (Cloudflare Worker).
 * Como exchange.js usa ESM (export), replicamos la lógica aquí
 * para testear sin necesidad de transpilador.
 */

class MockResponse {
  constructor(body, init = {}) {
    this._body = body;
    this.status = init.status || 200;
    this.headers = new Map(Object.entries(init.headers || {}));
  }
  async json() {
    return JSON.parse(this._body);
  }
}

// Réplica exacta de la lógica en functions/exchange.js
async function onRequest() {
  try {
    const res = await fetch(
      "https://dolarboliviahoy.com/api/exchangeData",
      { headers: { "Accept": "application/json" } }
    );

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "upstream_error" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();

    return new Response(
      JSON.stringify({
        buy: data.buyAveragePrice,
        sell: data.sellAveragePrice
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "max-age=300"
        }
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "fetch_failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

beforeEach(() => {
  global.Response = MockResponse;
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.Response;
  delete global.fetch;
});

describe("exchange.js – onRequest", () => {
  test("retorna buy y sell cuando el upstream responde OK", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ buyAveragePrice: 6.96, sellAveragePrice: 6.86 })
    });

    const res = await onRequest();
    const body = await res.json();

    expect(body).toEqual({ buy: 6.96, sell: 6.86 });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("Cache-Control")).toBe("max-age=300");
  });

  test("retorna 502 cuando el upstream falla", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500 });

    const res = await onRequest();
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body).toEqual({ error: "upstream_error" });
  });

  test("retorna 500 cuando fetch lanza excepción", async () => {
    global.fetch.mockRejectedValue(new Error("Network error"));

    const res = await onRequest();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "fetch_failed" });
  });

  test("llama al endpoint correcto con headers de Accept", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ buyAveragePrice: 7.0, sellAveragePrice: 6.9 })
    });

    await onRequest();

    expect(global.fetch).toHaveBeenCalledWith(
      "https://dolarboliviahoy.com/api/exchangeData",
      { headers: { "Accept": "application/json" } }
    );
  });

  test("maneja datos parciales del upstream", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ buyAveragePrice: null, sellAveragePrice: undefined })
    });

    const res = await onRequest();
    const body = await res.json();

    expect(body).toEqual({ buy: null, sell: undefined });
    expect(res.status).toBe(200);
  });
});
