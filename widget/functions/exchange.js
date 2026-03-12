export async function onRequest() {
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
