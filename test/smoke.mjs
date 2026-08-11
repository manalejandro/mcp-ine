/**
 * Prueba de humo del Worker de MCP INE sin necesidad de Cloudflare.
 * Ejecutar:  node test/smoke.mjs [--live]
 *
 * Con --live ejecuta también llamadas reales a la API del INE vía fetch (se
 * tarda unos segundos). Sin --live solo valida los métodos del protocolo que
 * no tocan el INE (initialize, tools/list, ping, errores, notificaciones).
 */
import { default as worker } from '../dist/worker.js';

const BASE = 'https://mcp-ine.manalejandro.com';
const live = process.argv.includes('--live');

let passed = 0;
let failed = 0;

function check(name, cond, extra = '') {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}${extra ? ' — ' + extra : ''}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${extra ? ' — ' + extra : ''}`);
  }
}

async function post(path, body, extraHeaders = {}) {
  return worker.fetch(new Request(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  }));
}

async function rpc(method, params, id, path = '/mcp', extraHeaders = {}) {
  const res = await post(path, { jsonrpc: '2.0', method, params, id }, extraHeaders);
  const data = await res.json();
  return { res, data };
}

console.log('\n1) Protocolo básico');

{
  const { data } = await rpc('initialize', { protocolVersion: '2024-11-05' }, 1);
  check('initialize result', !!data?.result?.capabilities?.tools);
  check('versions', ['2024-11-05', '2025-03-26', '2025-06-18'].includes(data?.result?.protocolVersion), data?.result?.protocolVersion);
  check('serverInfo', data?.result?.serverInfo?.name === 'mcp-ine');
  check('instructions', !!data?.result?.instructions);
}

{
  const { data } = await rpc('initialize', { protocolVersion: '2025-06-18' }, 2);
  check('negotiates supported version', data?.result?.protocolVersion === '2025-06-18');
}

{
  const { data } = await rpc('tools/list', {}, 3);
  check('tools/list returns tools', Array.isArray(data?.result?.tools));
  check('24 herramientas', data?.result?.tools?.length === 24, `${data?.result?.tools?.length}`);
  const names = data?.result?.tools?.map((t) => t.name);
  check('todas las herramientas del INE', [
    'ine_datos_tabla', 'ine_datos_serie', 'ine_datos_metadata_operacion',
    'ine_operaciones_disponibles', 'ine_operacion', 'ine_variables',
    'ine_variables_operacion', 'ine_valores_variable', 'ine_valores_variable_operacion',
    'ine_tablas_operacion', 'ine_grupos_tabla', 'ine_valores_grupos_tabla',
    'ine_serie', 'ine_series_operacion', 'ine_valores_serie', 'ine_series_tabla',
    'ine_serie_metadata_operacion', 'ine_periodicidades', 'ine_publicaciones',
    'ine_publicaciones_operacion', 'ine_publicacion_fecha_publicacion',
    'ine_clasificaciones', 'ine_clasificaciones_operacion', 'ine_valores_hijos',
  ].every((n) => names.includes(n)));
}

{
  const { data } = await rpc('ping', {}, 4);
  check('ping', JSON.stringify(data?.result) === '{}');
}

{
  const { data } = await rpc('tools/call', { name: 'no_existe' }, 5);
  check('tool desconocida es error', data?.result?.isError === true, data?.result?.content?.[0]?.text?.slice(0, 60));
}

{
  const { data } = await rpc('metodo_inexistente', {}, 6);
  check('método desconocido -> -32601', data?.error?.code === -32601);
}

{
  const res = await post('/mcp', { jsonrpc: '1.0', method: 'ping', id: 7 });
  const data = await res.json();
  check('jsonrpc inválido -> 400/-32600', res.status === 400 && data?.error?.code === -32600, `status=${res.status}`);
}

{
  const res = await worker.fetch(new Request(BASE + '/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'esto no es json{',
  }));
  const data = await res.json();
  check('parse error -> -32700', data?.error?.code === -32700, `code=${data?.error?.code}`);
}

{
  const res = await post('/mcp', { jsonrpc: '2.0', method: 'notifications/initialized' });
  check('notificación -> 202 sin cuerpo', res.status === 202, `status=${res.status}`);
}

{
  const res = await worker.fetch(new Request(BASE + '/mcp', { method: 'GET' }));
  check('GET /mcp -> 405 con instrucciones', res.status === 405);
}

console.log('\n1b) SSE clásico');

{
  const res = await worker.fetch(new Request(BASE + '/sse', { method: 'GET' }));
  const ct = res.headers.get('content-type') || '';
  check('GET /sse -> 200 text/event-stream', res.status === 200 && ct.includes('text/event-stream'), ct);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const { value: firstChunk } = await reader.read();
  const first = decoder.decode(firstChunk, { stream: true });
  check('evento endpoint con sessionId', first.includes('event: endpoint') && first.includes('sessionId='), first.replace(/\n/g, ' | '));

  const match = first.match(/sessionId=([a-f0-9-]+)/);
  if (match) {
    const sessionId = match[1];
    const postRes = await post('/message?sessionId=' + sessionId, { jsonrpc: '2.0', method: 'ping', id: 42 });
    check('POST /message -> 202', postRes.status === 202, `status=${postRes.status}`);

    const { value: secondChunk } = await reader.read();
    const second = decoder.decode(secondChunk, { stream: true });
    check('respuesta recibida por el stream SSE', second.includes('event: message') && second.includes('"id":42'), second.replace(/\n/g, ' | '));
  } else {
    check('POST /message -> 202 (sin sessionId extraído)', false);
  }

  await reader.cancel();
}

{
  const res = await worker.fetch(new Request(BASE + '/health'));
  const data = await res.json();
  check('health ok', data?.status === 'ok' && data?.tools === 24);
}

{
  const res = await worker.fetch(new Request(BASE + '/', { method: 'OPTIONS' }));
  check('CORS preflight -> 204', res.status === 204);
}

{
  const res = await worker.fetch(new Request(BASE + '/', { method: 'GET' }));
  check('landing 200 html', res.status === 200 && (res.headers.get('content-type') || '').includes('text/html'));
}

{
  const res = await worker.fetch(new Request(BASE + '/api/operaciones-disponibles?page=1'));
  const data = await res.json();
  check('REST /api/operaciones-disponibles', res.status === 200 && data?.success === true, `success=${data?.success}`);
}

console.log('\n2) Acceso a datos reales del INE (fetch directo del Worker)');

async function callToolTry(name, args, id) {
  const { data } = await rpc('tools/call', { name, arguments: args }, id);
  if (data?.error) return { error: data.error.message };
  if (data?.result?.isError) {
    try { return { err: JSON.parse(data.result.content[0].text) }; } catch { return { err: data.result.content[0].text }; }
  }
  try { return JSON.parse(data.result.content[0].text); } catch { return data; }
}

if (live) {
  {
    const d = await callToolTry('ine_periodicidades', { idioma: 'ES' }, 10);
    check('ine_periodicidades', d?.success === true && d?.data?.length >= 6, `${d?.data?.length} periodicidades`);
  }
  {
    const d = await callToolTry('ine_datos_serie', { idSerie: 'IPC251856', nult: 3, tip: 'A' }, 11);
    check('ine_datos_serie IPC', d?.success === true && Array.isArray(d?.data?.Data) && d?.data?.Data?.length === 3, `${d?.data?.Data?.length} datos`);
  }
  {
    const d = await callToolTry('ine_operaciones_disponibles', { geo: 0, page: 1 }, 12);
    check('ine_operaciones_disponibles', d?.success === true && d?.data?.length > 0, `${d?.data?.length} operaciones`);
  }
  {
    const d = await callToolTry('ine_operacion', { idOperacion: 'IPC' }, 13);
    check('ine_operacion IPC', d?.success === true && d?.data?.Codigo === 'IPC', `codigo=${d?.data?.Codigo}`);
  }
  {
    const d = await callToolTry('ine_valores_variable', { idVariable: '115' }, 14);
    check('ine_valores_variable 115 (provincias)', d?.success === true && d?.data?.length >= 50, `${d?.data?.length} valores`);
  }
  {
    const d = await callToolTry('ine_valores_hijos', { idVariable: '70', idValor: '8997' }, 15);
    check('ine_valores_hijos Andalucía', d?.success === true && Array.isArray(d?.data) && d?.data?.length === 8, `${d?.data?.length} provincias`);
  }
  {
    const d = await callToolTry('ine_tablas_operacion', { idOperacion: 'IPC' }, 16);
    check('ine_tablas_operacion IPC', d?.success === true && d?.data?.length > 0, `${d?.data?.length} tablas`);
  }
  {
    const d = await callToolTry('ine_variables_operacion', { idOperacion: 'IPC' }, 17);
    check('ine_variables_operacion IPC', d?.success === true && d?.data?.length > 0, `${d?.data?.length} variables`);
  }
  {
    const d = await callToolTry('ine_grupos_tabla', { idTabla: '50902' }, 18);
    check('ine_grupos_tabla 50902', d?.success === true && d?.data?.length > 0, `${d?.data?.length} grupos`);
  }
  {
    const d = await callToolTry('ine_publicaciones', { idioma: 'ES' }, 19);
    check('ine_publicaciones', d?.success === true && d?.data?.length > 0, `${d?.data?.length} publicaciones`);
  }
  {
    const d = await callToolTry('ine_clasificaciones', { idioma: 'ES' }, 20);
    check('ine_clasificaciones', d?.success === true && d?.data?.length > 0, `${d?.data?.length} clasificaciones`);
  }
  {
    const d = await callToolTry('ine_datos_tabla', { idTabla: '50902', nult: 2 }, 21);
    check('ine_datos_tabla 50902', d?.success === true, d?.err?.message || `${d?.data?.length} series`);
  }
  {
    const d = await callToolTry('ine_clasificaciones_operacion', { idOperacion: 'IPC' }, 22);
    check('ine_clasificaciones_operacion IPC', d?.success === true && d?.data?.length > 0, `${d?.data?.length} clasificaciones`);
  }
  {
    const d = await callToolTry('ine_serie', { idSerie: 'IPC251852' }, 23);
    check('ine_serie IPC251852', d?.success === true && d?.data?.COD === 'IPC251852', `cod=${d?.data?.COD}`);
  }
  {
    const d = await callToolTry('ine_series_tabla', { idTabla: '50913', page: 1 }, 24);
    check('ine_series_tabla 50913', d?.success === true && d?.data?.length > 0, `${d?.data?.length} series`);
  }
} else {
  console.log('  (omitido — pasa --live para probar contra la API real del INE)');
}

console.log(`\nResultado: ${passed} OK, ${failed} ERROR`);
process.exit(failed > 0 ? 1 : 0);