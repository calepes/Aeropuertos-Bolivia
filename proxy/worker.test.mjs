// Self-check de la validación de destino del proxy. Correr: node worker.test.mjs
import assert from 'node:assert/strict';
import { isTargetAllowed } from './worker.js';

const permitido = (u) => isTargetAllowed(new URL(u));

// Único destino válido
assert.equal(permitido('https://fids.naabol.gob.bo/Fids/itin/vuelos?aero=Viru%20Viru&tipo=S'), true);

// Rechazos
assert.equal(permitido('http://fids.naabol.gob.bo/Fids/itin/vuelos'), false, 'http downgrade');
assert.equal(permitido('https://cualquiera.fids.naabol.gob.bo/'), false, 'subdominio comodín');
assert.equal(permitido('https://fids.naabol.gob.bo.example.com/'), false, 'sufijo engañoso');
assert.equal(permitido('https://example.com/'), false, 'dominio ajeno');
assert.equal(permitido('file:///etc/passwd'), false, 'esquema file');
assert.equal(permitido('http://127.0.0.1/'), false, 'IP interna');

// El userinfo no debe confundir: el hostname real es el que manda
assert.equal(permitido('https://example.com@fids.naabol.gob.bo/Fids/itin/vuelos'), true);
assert.equal(permitido('https://fids.naabol.gob.bo@example.com/'), false);

console.log('ok — 9 casos');
