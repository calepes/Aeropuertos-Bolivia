const ALLOWED_DOMAINS = ['fids.naabol.gob.bo'];

// Solo la PWA. Antes era '*', o sea cualquier web podía colgarse de este proxy y
// gastar la cuota diaria de Workers de la cuenta — que comparten los demás workers.
// No frena a un cliente que no sea browser (curl ignora CORS); para eso haría falta
// rate limiting de zona, y workers.dev no es una zona propia.
const ALLOWED_ORIGINS = ['https://apps.lepesqueur.net', 'http://apps.lepesqueur.net'];

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

// Match exacto, no por sufijo: la PWA solo pide el host exacto, y `endsWith('.' + domain)`
// dejaba pasar cualquier subdominio de NAABOL. Solo https: el tramo worker→NAABOL no viaja
// en texto plano. Exportada para el self-check de abajo.
export function isTargetAllowed(parsed) {
  return parsed.protocol === 'https:' && ALLOWED_DOMAINS.includes(parsed.hostname);
}

export default {
  async fetch(request) {
    const CORS_HEADERS = corsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing ?url= parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    if (!isTargetAllowed(parsed)) {
      return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AeropuertosProxy/1.0)',
        },
      });

      const body = await response.arrayBuffer();

      // Content-Type fijo, no el de upstream: NAABOL sirve HTML en sus errores (hoy mismo,
      // /Fids/operativo/ da un 404 en HTML) y reenviarlo tal cual deja HTML ejecutable
      // corriendo en un origen *.carlos-cb4.workers.dev, hermano de los demás workers.
      return new Response(body, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'public, max-age=60',
          ...CORS_HEADERS,
        },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Fetch failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
  },
};
