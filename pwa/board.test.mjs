import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('./index.html', import.meta.url), 'utf8')
  .match(/<script>([\s\S]+)<\/script>/)[1];
const flush = () => new Promise(setImmediate);
const response = (data, status = 200) => ({ ok: status === 200, status, json: async () => data });
const flight = (id, time = '13:00') => ({
  FECHA: '2030-06-01', HORA_ESTIMADA: time, NRO_VUELO: id, RUTA0: 'COCHABAMBA',
});

function board(fetchSource, innerHeight = 180) {
  const makeElement = () => ({
    children: [],
    events: {},
    style: {},
    offsetHeight: 20,
    textContent: '',
    classList: { add() {}, remove() {} },
    appendChild(child) { this.children.push(child); },
    addEventListener(type, handler) { this.events[type] = handler; },
    set innerHTML(_) { this.children = []; },
  });
  const elements = new Map();
  const get = (id) => {
    if (!elements.has(id)) elements.set(id, makeElement());
    return elements.get(id);
  };
  const calls = [];
  const window = { innerHeight, addEventListener: (type, fn) => { window[type] = fn; } };
  const fixedTime = new Date(2030, 5, 1, 12).getTime();
  const context = {
    window,
    document: { getElementById: get, querySelector: get, createElement: makeElement, addEventListener() {} },
    fetch: async (address) => {
      const url = new URL(new URL(address).searchParams.get('url'));
      calls.push(url);
      return fetchSource(url);
    },
    getComputedStyle: () => ({ marginBottom: '0', paddingTop: '0', paddingBottom: '0' }),
    setInterval() {}, clearInterval() {}, clearTimeout() {},
    setTimeout(fn) { fn(); },
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : [fixedTime])); }
      static now() { return fixedTime; }
    },
  };
  runInNewContext(script, context);
  return { get, calls, window, ...context };
}

const isItinerary = (url) => url.pathname.includes('/itin/');
const rowIds = (app) => app.get('flights').children
  .map((row) => row.children[4].children.map((flap) => flap.textContent).join(''));

test('distingue tablero parcial, caída con respaldo, vacío válido y caída sin respaldo', async () => {
  let mode = 'partial';
  const app = board((url) => {
    if (mode === 'empty') return response([]);
    if (mode === 'partial' && isItinerary(url)) return response([flight('101')]);
    if (mode === 'malformed') return response(isItinerary(url) ? [] : { error: 'no hay datos' });
    return response(null, 503);
  });
  await flush();
  assert.deepEqual(rowIds(app), ['101']);
  assert.match(app.get('status').textContent, /Datos parciales/);
  assert.match(app.get('footer').textContent, /01\/06\/2030/);
  const lastFooter = app.get('footer').textContent;

  mode = 'failure';
  await app.loadFlights();
  assert.deepEqual(rowIds(app), ['101']);
  assert.match(app.get('status').textContent, /Fuentes no disponibles/);
  assert.equal(app.get('footer').textContent, lastFooter);

  app.toggleFlightType();
  await flush();
  assert.deepEqual(rowIds(app), []);
  assert.match(app.get('status').textContent, /Fuentes no disponibles/);
  assert.equal(app.get('footer').textContent, '');

  mode = 'malformed';
  await app.loadFlights();
  assert.equal(app.get('status').textContent, 'Datos parciales · Sin vuelos confirmados');

  mode = 'empty';
  await app.loadFlights();
  assert.equal(app.get('status').textContent, 'No hay vuelos programados');
});

test('descarta una consulta tardía y redimensiona sin consultar ni perder filas', async () => {
  let finish;
  const delayed = new Promise((resolve) => { finish = resolve; });
  const app = board((url) => {
    if (url.searchParams.get('aero') === 'Viru Viru') return delayed;
    return response(isItinerary(url) ? Array.from({ length: 25 }, (_, i) => flight(String(200 + i))) : []);
  });
  const select = app.get('airport-select');
  select.value = 'LPB';
  select.events.change();
  await flush();
  assert.deepEqual(rowIds(app), ['200', '201', '202', '203', '204']);
  finish(response([flight('101')]));
  await flush();
  assert.equal(rowIds(app)[0], '200');
  const beforeResize = app.calls.length;

  app.window.innerHeight = 700;
  app.window.resize();
  await flush();
  assert.ok(rowIds(app).length > 5);
  assert.equal(app.calls.length, beforeResize);
  app.manualRefresh();
  await flush();
  assert.equal(app.calls.length, beforeResize + 2);
  assert.ok(app.calls.slice(-2).every((url) => url.searchParams.get('aero') === 'El Alto'));
  app.toggleFlightType();
  await flush();
  assert.equal(app.calls.length, beforeResize + 4);
  assert.ok(app.calls.slice(-2).every((url) => url.searchParams.get('tipo') === 'L'));
});
