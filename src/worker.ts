/**
 * Cloudflare Worker de MCP INE Server.
 *
 * Implementa los transportes MCP:
 *   - Streamable HTTP (JSON-RPC sobre POST) en /mcp  ->  config "http"/"remote"
 *   - SSE clásico (Server-Sent Events) en /sse       ->  config "sse"
 *
 * Todas las peticiones reciben siempre una respuesta inmediata (JSON, SSE o
 * 202 para notificaciones), por lo que el runtime de Workers nunca cancela
 * peticiones "colgadas" ni deja conexiones huérfanas.
 *
 * Endpoints:
 *   POST /mcp, /mcp/v1, /mcp/v1/message, /message  -> JSON-RPC 2.0 (MCP)
 *   GET  /sse, /mcp/sse, /mcp/v1/sse               -> SSE clásico (legacy)
 *   GET  /mcp, /mcp/v1 (Accept: text/event-stream) -> stream SSE (Streamable HTTP)
 *   GET  /health                                   -> health check
 *   GET  /api/*                                    -> API REST (compatibilidad)
 *   GET  /                                         -> página de información
 */

import { ineClient } from './services/ine-client.js';
import { tools, SERVER_INFO } from './tools.js';
import { buildInitializeResult, negotiateProtocolVersion, runToolCall } from './mcp.js';
import type { Idioma } from './types/ine.types.js';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, MCP-Protocol-Version, X-Request-Id',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
};

const SSE_HEADERS: Record<string, string> = {
  ...CORS_HEADERS,
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache, no-transform',
};

interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

interface JsonRpcOutcome {
  status: number;
  /** Cuerpo JSON-RPC a devolver; null para respuestas vacías (notificaciones). */
  payload: unknown;
  extraHeaders?: Record<string, string>;
}

function jsonResponse(
  payload: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

function errorOutcome(error: JsonRpcError, id: unknown, status = 200): JsonRpcOutcome {
  return { status, payload: { jsonrpc: '2.0', error, id: id ?? null } };
}

/**
 * Lee y parsea el cuerpo JSON de la petición de forma segura.
 */
async function readJsonBody(request: Request): Promise<{ ok: true; data: unknown } | { ok: false; error: JsonRpcError }> {
  try {
    const text = await request.text();
    if (!text) {
      return { ok: false, error: { code: -32700, message: 'Parse error: el cuerpo de la petición está vacío' } };
    }
    const data = JSON.parse(text);
    return { ok: true, data };
  } catch {
    return { ok: false, error: { code: -32700, message: 'Parse error: el cuerpo no es JSON válido' } };
  }
}

/**
 * Procesa una petición JSON-RPC 2.0 del protocolo MCP.
 * NUNCA cuelga: o devuelve un resultado JSON-RPC, o un error JSON-RPC.
 */
async function handleJsonRpc(request: Request): Promise<JsonRpcOutcome> {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return {
      status: 400,
      payload: { jsonrpc: '2.0', error: parsed.error, id: null },
      extraHeaders: { 'MCP-Protocol-Version': negotiateProtocolVersion(undefined) },
    };
  }

  const body = parsed.data;

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return {
      status: 400,
      payload: { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: null },
    };
  }

  const req = body as {
    jsonrpc?: unknown;
    method?: unknown;
    params?: unknown;
    id?: unknown;
  };

  if (req.jsonrpc !== '2.0' || typeof req.method !== 'string') {
    return {
      status: 400,
      payload: {
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request: jsonrpc debe ser "2.0" y method una cadena' },
        id: req.id ?? null,
      },
    };
  }

  const method: string = req.method;
  const params = (req.params && typeof req.params === 'object' ? req.params : {}) as Record<string, any>;
  const hasId = req.id !== undefined && req.id !== null;

  // Notificaciones (sin id): se procesan y se responde 202 sin cuerpo.
  if (method.startsWith('notifications/') && !hasId) {
    return { status: 202, payload: null };
  }

  const protocolVersion = negotiateProtocolVersion(
    (params as { protocolVersion?: string } | undefined)?.protocolVersion
  );

  switch (method) {
    case 'initialize': {
      const result = buildInitializeResult(params as { protocolVersion?: string });
      return {
        status: 200,
        payload: { jsonrpc: '2.0', result, id: req.id },
        extraHeaders: {
          'MCP-Protocol-Version': result.protocolVersion,
          'Mcp-Session-Id': crypto.randomUUID(),
        },
      };
    }

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return { status: 202, payload: null };

    case 'ping':
      return { status: 200, payload: { jsonrpc: '2.0', result: {}, id: req.id }, extraHeaders: { 'MCP-Protocol-Version': protocolVersion } };

    case 'tools/list':
      return { status: 200, payload: { jsonrpc: '2.0', result: { tools }, id: req.id }, extraHeaders: { 'MCP-Protocol-Version': protocolVersion } };

    case 'tools/call': {
      const name = params.name as string | undefined;
      if (!name || typeof name !== 'string') {
        return errorOutcome({ code: -32602, message: 'Invalid params: name es obligatorio' }, req.id);
      }
      const toolResult = await runToolCall(name, (params.arguments as Record<string, unknown>) || {});
      return { status: 200, payload: { jsonrpc: '2.0', result: toolResult, id: req.id }, extraHeaders: { 'MCP-Protocol-Version': protocolVersion } };
    }

    // Recursos/prompts no implementados: responder listas vacías evita errores en el cliente.
    case 'resources/list':
      return { status: 200, payload: { jsonrpc: '2.0', result: { resources: [] }, id: req.id }, extraHeaders: { 'MCP-Protocol-Version': protocolVersion } };
    case 'resources/templates/list':
      return { status: 200, payload: { jsonrpc: '2.0', result: { resourceTemplates: [] }, id: req.id }, extraHeaders: { 'MCP-Protocol-Version': protocolVersion } };
    case 'prompts/list':
      return { status: 200, payload: { jsonrpc: '2.0', result: { prompts: [] }, id: req.id }, extraHeaders: { 'MCP-Protocol-Version': protocolVersion } };

    case 'logging/setLevel':
      return { status: 200, payload: { jsonrpc: '2.0', result: {}, id: req.id }, extraHeaders: { 'MCP-Protocol-Version': protocolVersion } };

    default:
      return errorOutcome({ code: -32601, message: `Method not found: ${method}` }, req.id, 200);
  }
}

/**
 * Wrapper seguro: garantiza que cualquier excepción inesperada se convierta
 * en un error JSON-RPC en lugar de colgar.
 */
async function processJsonRpc(request: Request): Promise<JsonRpcOutcome> {
  try {
    return await handleJsonRpc(request);
  } catch (error: any) {
    return errorOutcome(
      {
        code: -32603,
        message: error?.message || 'Internal error',
        data: { type: error?.name || 'Error' },
      },
      undefined,
      200
    );
  }
}

function encodeSse(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

/**
 * Construye la respuesta HTTP de una petición JSON-RPC.
 * Si el cliente lo solicita (Accept: text/event-stream), devuelve SSE.
 */
function respondJsonRpc(request: Request, outcome: JsonRpcOutcome): Response {
  if (outcome.status === 202 || outcome.payload === null) {
    return new Response(null, { status: 202, headers: CORS_HEADERS });
  }

  const json = JSON.stringify(outcome.payload);
  const accept = (request.headers.get('accept') || '').toLowerCase();

  if (accept.includes('text/event-stream')) {
    return new Response(encodeSse('message', json), {
      status: outcome.status,
      headers: { ...SSE_HEADERS, ...outcome.extraHeaders },
    });
  }

  return jsonResponse(outcome.payload, outcome.status, outcome.extraHeaders);
}

// ---------------------------------------------------------------------------
// Transporte SSE clásico (legacy): GET /sse  +  POST /message?sessionId=
// El estado de sesión vive en memoria del isolate. Suficiente para un único
// cliente conectado; ante múltiples peticiones el Worker permanece en el
// mismo isolate gracias a la afinidad de sesión de Cloudflare.
// ---------------------------------------------------------------------------

interface SseSession {
  enqueue: (chunk: string) => void;
  close: () => void;
  keepAlive: ReturnType<typeof setInterval> | null;
}

const sseSessions = new Map<string, SseSession>();

function handleLegacySse(): Response {
  const sessionId = crypto.randomUUID();
  const encoder = new TextEncoder();

  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel() {
      const session = sseSessions.get(sessionId);
      if (session && session.keepAlive) clearInterval(session.keepAlive);
      sseSessions.delete(sessionId);
    },
  });

  const session: SseSession = {
    enqueue(chunk) {
      try {
        controller?.enqueue(encoder.encode(chunk));
      } catch {
        /* stream ya cerrado */
      }
    },
    close() {
      try {
        controller?.close();
      } catch {
        /* ya cerrado */
      }
    },
    keepAlive: setInterval(() => {
      try {
        controller?.enqueue(encoder.encode(': keep-alive\n\n'));
      } catch {
        /* ignore */
      }
    }, 15000),
  };

  sseSessions.set(sessionId, session);

  // El evento "endpoint" indica al cliente clásico dónde enviar los mensajes.
  session.enqueue(encodeSse('endpoint', `/message?sessionId=${sessionId}`));

  return new Response(stream, { status: 200, headers: SSE_HEADERS });
}

/**
 * POST /message?sessionId=<id>: procesa el mensaje y lo reenvía por el stream
 * SSE de la sesión. Responde 202 Accepted inmediatamente.
 */
async function handleSseMessage(request: Request, url: URL): Promise<Response> {
  const sessionId = url.searchParams.get('sessionId');
  const session = sessionId ? sseSessions.get(sessionId) : undefined;

  if (!session) {
    return jsonResponse(
      {
        error: 'Session not found',
        message: `No hay ninguna sesión SSE activa con id ${sessionId || '(vacío)'}. Abre primero GET /sse.`,
      },
      404
    );
  }

  const outcome = await processJsonRpc(request);
  if (outcome.payload !== null && outcome.status !== 202) {
    session.enqueue(encodeSse('message', JSON.stringify(outcome.payload)));
  }
  return new Response(null, { status: 202, headers: CORS_HEADERS });
}

// ---------------------------------------------------------------------------
// API REST de compatibilidad
// ---------------------------------------------------------------------------

async function handleRest(pathname: string, url: URL): Promise<Response | null> {
  const params = Object.fromEntries(url.searchParams.entries()) as Record<string, any>;
  const idioma = (params.idioma || 'ES') as Idioma;

  const segments = pathname.split('/').filter(Boolean); // p.ej. ['api','datos-tabla','50902']
  if (segments.length < 2 || segments[0] !== 'api') return null;

  const resource = segments[1];
  const id = segments[2] ? decodeURIComponent(segments[2]) : undefined;
  const id2 = segments[3] ? decodeURIComponent(segments[3]) : undefined;

  const withId = [
    'datos-tabla', 'datos-serie', 'operacion', 'variables-operacion', 'series-operacion',
    'tablas-operacion', 'valores-variable', 'publicaciones-operacion', 'grupos-tabla',
    'serie', 'valores-serie', 'series-tabla', 'clasificaciones-operacion',
    'valores-variable-operacion', 'valores-grupos-tabla', 'valores-hijos',
  ];

  // Endpoints sin identificador en la URL
  if (!withId.includes(resource)) {
    let result: Awaited<ReturnType<typeof ineClient.getOperacionesDisponibles>> | null = null;
    switch (resource) {
      case 'operaciones-disponibles':
        result = await ineClient.getOperacionesDisponibles(params, idioma);
        break;
      case 'variables':
        result = await ineClient.getVariables(params, idioma);
        break;
      case 'publicaciones':
        result = await ineClient.getPublicaciones(params, idioma);
        break;
      case 'periodicidades':
        result = await ineClient.getPeriodicidades(idioma);
        break;
      case 'clasificaciones':
        result = await ineClient.getClasificaciones(idioma);
        break;
      default:
        return jsonResponse({ error: `Endpoint REST no encontrado: /api/${resource}` }, 404);
    }
    return jsonResponse(result);
  }

  const twoIdResources = ['valores-variable-operacion', 'valores-grupos-tabla', 'valores-hijos'];
  const needsTwoIds = twoIdResources.includes(resource);

  if (!id || (needsTwoIds && !id2)) {
    return jsonResponse({ error: 'Faltan identificadores obligatorios en la URL' }, 400);
  }

  let result: Awaited<ReturnType<typeof ineClient.getOperacionesDisponibles>> | null = null;

  switch (resource) {
    case 'datos-tabla':
      result = await ineClient.getDatosTabla(id as string, params, idioma);
      break;
    case 'datos-serie':
      result = await ineClient.getDatosSerie(id as string, params, idioma);
      break;
    case 'operacion':
      result = await ineClient.getOperacion(id as string, params, idioma);
      break;
    case 'variables-operacion':
      result = await ineClient.getVariablesOperacion(id as string, params, idioma);
      break;
    case 'series-operacion':
      result = await ineClient.getSeriesOperacion(id as string, params, idioma);
      break;
    case 'tablas-operacion':
      result = await ineClient.getTablasOperacion(id as string, params, idioma);
      break;
    case 'valores-variable':
      result = await ineClient.getValoresVariable(id as string, params, idioma);
      break;
    case 'valores-variable-operacion':
      result = await ineClient.getValoresVariableOperacion(id as string, id2 as string, params, idioma);
      break;
    case 'publicaciones-operacion':
      result = await ineClient.getPublicacionesOperacion(id as string, params, idioma);
      break;
    case 'grupos-tabla':
      result = await ineClient.getGruposTabla(id as string, idioma);
      break;
    case 'valores-grupos-tabla':
      result = await ineClient.getValoresGruposTabla(id as string, id2 as string, params, idioma);
      break;
    case 'serie':
      result = await ineClient.getSerie(id as string, params, idioma);
      break;
    case 'valores-serie':
      result = await ineClient.getValoresSerie(id as string, params, idioma);
      break;
    case 'series-tabla':
      result = await ineClient.getSeriesTabla(id as string, params, idioma);
      break;
    case 'clasificaciones-operacion':
      result = await ineClient.getClasificacionesOperacion(id as string, idioma);
      break;
    case 'valores-hijos':
      result = await ineClient.getValoresHijos(id as string, id2 as string, params, idioma);
      break;
    default:
      return jsonResponse({ error: `Endpoint REST no encontrado: /api/${resource}` }, 404);
  }

  return jsonResponse(result);
}

// ---------------------------------------------------------------------------
// Páginas
// ---------------------------------------------------------------------------

function healthResponse(): Response {
  return jsonResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: SERVER_INFO.name,
    version: SERVER_INFO.version,
    transport: 'Streamable HTTP + SSE',
    tools: tools.length,
    endpoints: {
      mcp: 'POST /mcp',
      sse: 'GET /sse',
      health: 'GET /health',
    },
  });
}

function landingResponse(request: Request): Response {
  const host = request.headers.get('host') || 'mcp-ine.manalejandro.com';
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP INE Server - API del INE de España</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: linear-gradient(135deg, #667eea, #764ba2); min-height: 100vh; color: #333; }
    .card { max-width: 900px; margin: 40px auto; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,.3); }
    h1 { color: #667eea; margin-top: 0; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
    .endpoint { background: #f8f9fa; padding: 14px 18px; border-left: 4px solid #667eea; border-radius: 6px; margin: 12px 0; }
    .endpoint b { display: block; margin-bottom: 4px; color: #764ba2; }
    pre { background: #2d3748; color: #68d391; padding: 12px; border-radius: 6px; overflow-x: auto; }
    a { color: #667eea; }
  </style>
</head>
<body>
  <div class="card">
    <h1>MCP INE Server</h1>
    <p>Servidor Model Context Protocol para consultar datos del <strong>Instituto Nacional de Estadística (INE)</strong> de España. <strong>${tools.length} herramientas</strong> MCP disponibles.</p>

    <h2>Conectar con un cliente MCP</h2>
    <p><strong>opencode</strong> (Streamable HTTP / JSON-RPC):</p>
    <pre>{
  "mcp": {
    "ine": { "type": "remote", "url": "https://${host}/mcp", "enabled": true }
  }
}</pre>
    <p><strong>SSE clásico</strong> (Claude Desktop, Cursor, etc.):</p>
    <pre>{
  "mcpServers": {
    "ine": { "url": "https://${host}/sse", "transport": "sse" }
  }
}</pre>

    <h2>Endpoints</h2>
    <div class="endpoint"><b>POST /mcp</b>Endpoint MCP JSON-RPC 2.0 (transporte Streamable HTTP). Métodos: initialize, ping, tools/list, tools/call.</div>
    <div class="endpoint"><b>GET /sse</b>Endpoint SSE clásico. Responde con el evento <code>endpoint</code>; envía los mensajes a <code>/message?sessionId=...</code>.</div>
    <div class="endpoint"><b>GET /health</b>Health check.</div>
    <div class="endpoint"><b>GET /api/...</b>API REST directa: /api/operaciones-disponibles, /api/datos-tabla/:idTabla, /api/datos-serie/:idSerie, /api/operacion/:idOperacion, etc.</div>

    <h2>Prueba rápida</h2>
    <div class="endpoint"><code>curl -X POST https://${host}/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05"},"id":1}'</code></div>
    <div class="endpoint"><code>curl -X POST https://${host}/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'</code></div>

    <p><small>Servidor MCP INE v${SERVER_INFO.version} · Fuente de datos: <a href="https://www.ine.es">www.ine.es</a></small></p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

// ---------------------------------------------------------------------------
// Handler principal del Worker
// ---------------------------------------------------------------------------

export interface Env {
  // Variables de entorno del Worker (vacías por defecto)
  [key: string]: unknown;
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();
    const accept = (request.headers.get('accept') || '').toLowerCase();

    // Preflight CORS
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ---- Endpoint MCP JSON-RPC (POST) ----
    if (method === 'POST' && (
      pathname === '/mcp' ||
      pathname === '/mcp/' ||
      pathname === '/mcp/v1' ||
      pathname === '/mcp/v1/' ||
      pathname === '/mcp/v1/message' ||
      pathname === '/message'
    )) {
      // Sesiones SSE clásicas: reenvían la respuesta por el stream.
      if (pathname === '/message' || pathname === '/mcp/v1/message') {
        return handleSseMessage(request, url);
      }
      const outcome = await processJsonRpc(request);
      return respondJsonRpc(request, outcome);
    }

    // ---- Endpoint SSE clásico (GET) ----
    if (method === 'GET' && (
      pathname === '/sse' ||
      pathname === '/sse/' ||
      pathname === '/mcp/sse' ||
      pathname === '/mcp/v1/sse'
    )) {
      return handleLegacySse();
    }

    // ---- Stream SSE del transporte Streamable HTTP (GET /mcp) ----
    if (method === 'GET' && (pathname === '/mcp' || pathname === '/mcp/v1')) {
      if (accept.includes('text/event-stream')) {
        return handleLegacySse();
      }
      return jsonResponse(
        {
          error: 'Este servidor MCP usa JSON-RPC sobre POST. Envía peticiones a POST /mcp, o conecta por SSE en GET /sse.',
          endpoints: {
            'POST /mcp': 'JSON-RPC 2.0 (transporte Streamable HTTP)',
            'GET /sse': 'SSE clásico',
          },
        },
        405,
        { Allow: 'GET, POST' }
      );
    }

    // Health check
    if (method === 'GET' && (pathname === '/health' || pathname === '/health/')) {
      return healthResponse();
    }

    // API REST de compatibilidad
    if (method === 'GET' && pathname.startsWith('/api/')) {
      try {
        const rest = await handleRest(pathname, url);
        if (rest) return rest;
      } catch (error: any) {
        return jsonResponse({
          success: false,
          error: error?.message || 'Error interno procesando la petición REST',
        }, 500);
      }
    }

    // Página de información
    if (method === 'GET' && (pathname === '/' || pathname === '')) {
      return landingResponse(request);
    }

    return jsonResponse({ error: 'Not Found' }, 404);
  },
};