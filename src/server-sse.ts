import express, { Request, Response } from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { ineClient } from './services/ine-client.js';
import { tools, SERVER_INFO, SERVER_INSTRUCTIONS } from './tools.js';
import type { Idioma } from './types/ine.types.js';

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Cache-Control'],
  credentials: false
}));
app.use(express.json());

// Almacenar transportes SSE activos por sessionId
const sseTransports = new Map<string, SSEServerTransport>();

/**
 * Maneja las llamadas a las herramientas MCP
 */
async function handleToolCall(name: string, args: any): Promise<any> {
  const idioma = (args.idioma || 'ES') as Idioma;

  switch (name) {
    case 'ine_datos_tabla':
      return await ineClient.getDatosTabla(args.idTabla, args, idioma);
    case 'ine_datos_serie':
      return await ineClient.getDatosSerie(args.idSerie, args, idioma);
    case 'ine_datos_metadata_operacion':
      return await ineClient.getDatosMetadataOperacion(args.idOperacion, args, idioma);
    case 'ine_operaciones_disponibles':
      return await ineClient.getOperacionesDisponibles(args, idioma);
    case 'ine_operacion':
      return await ineClient.getOperacion(args.idOperacion, args, idioma);
    case 'ine_variables':
      return await ineClient.getVariables(args, idioma);
    case 'ine_variables_operacion':
      return await ineClient.getVariablesOperacion(args.idOperacion, args, idioma);
    case 'ine_valores_variable':
      return await ineClient.getValoresVariable(args.idVariable, args, idioma);
    case 'ine_valores_variable_operacion':
      return await ineClient.getValoresVariableOperacion(args.idVariable, args.idOperacion, args, idioma);
    case 'ine_tablas_operacion':
      return await ineClient.getTablasOperacion(args.idOperacion, args, idioma);
    case 'ine_grupos_tabla':
      return await ineClient.getGruposTabla(args.idTabla, idioma);
    case 'ine_valores_grupos_tabla':
      return await ineClient.getValoresGruposTabla(args.idTabla, args.idGrupo, args, idioma);
    case 'ine_serie':
      return await ineClient.getSerie(args.idSerie, args, idioma);
    case 'ine_series_operacion':
      return await ineClient.getSeriesOperacion(args.idOperacion, args, idioma);
    case 'ine_valores_serie':
      return await ineClient.getValoresSerie(args.idSerie, args, idioma);
    case 'ine_series_tabla':
      return await ineClient.getSeriesTabla(args.idTabla, args, idioma);
    case 'ine_serie_metadata_operacion':
      return await ineClient.getSerieMetadataOperacion(args.idOperacion, args, idioma);
    case 'ine_periodicidades':
      return await ineClient.getPeriodicidades(idioma);
    case 'ine_publicaciones':
      return await ineClient.getPublicaciones(args, idioma);
    case 'ine_publicaciones_operacion':
      return await ineClient.getPublicacionesOperacion(args.idOperacion, args, idioma);
    case 'ine_publicacion_fecha_publicacion':
      return await ineClient.getPublicacionFechaPublicacion(args.idPublicacion, args, idioma);
    case 'ine_clasificaciones':
      return await ineClient.getClasificaciones(idioma);
    case 'ine_clasificaciones_operacion':
      return await ineClient.getClasificacionesOperacion(args.idOperacion, idioma);
    case 'ine_valores_hijos':
      return await ineClient.getValoresHijos(args.idVariable, args.idValor, args, idioma);
    default:
      throw new Error(`Herramienta desconocida: ${name}`);
  }
}

/**
 * Página principal con información del servidor SSE
 */
app.get('/', (req: Request, res: Response) => {
  const baseUrl = req.protocol + '://' + req.get('host');
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP INE Server (SSE)</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #667eea; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
    pre { background: #2d3748; color: #68d391; padding: 15px; border-radius: 6px; overflow-x: auto; }
    .endpoint { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea; }
  </style>
</head>
<body>
  <h1>🚀 MCP INE Server (SSE)</h1>
  <p>Servidor MCP con transporte SSE (Server-Sent Events) para acceder a los datos del INE.</p>
  
  <h2>Endpoints</h2>
  
  <div class="endpoint">
    <h3>GET /sse</h3>
    <p>Establecer conexión SSE para recibir mensajes del servidor MCP.</p>
    <pre>curl ${baseUrl}/sse</pre>
  </div>
  
  <div class="endpoint">
    <h3>POST /message</h3>
    <p>Enviar mensajes JSON-RPC al servidor MCP.</p>
    <pre>curl -X POST ${baseUrl}/message?sessionId=&lt;id&gt; \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'</pre>
  </div>
  
  <div class="endpoint">
    <h3>GET /health</h3>
    <p>Estado del servidor.</p>
    <pre>curl ${baseUrl}/health</pre>
  </div>
  
  <h2>Configuración AI Toolkit (SSE)</h2>
  <pre>{
  "mcpServers": {
    "mcp-ine-sse": {
      "url": "${baseUrl}/sse",
      "transport": "sse"
    }
  }
}</pre>

  <h2>Herramientas disponibles: ${tools.length}</h2>
  <p>Usa <code>ine_operaciones_disponibles</code> para empezar a explorar los datos del INE.</p>
</body>
</html>
  `);
});

/**
 * Endpoint SSE para conexión MCP
 * Este endpoint establece la conexión SSE y retorna un sessionId para enviar mensajes
 */
app.get('/sse', async (req: Request, res: Response) => {
  console.log('Nueva conexión SSE iniciada');
  
  try {
    // Crear servidor MCP
    const server = new Server(
      {
        name: SERVER_INFO.name + '-sse',
        version: SERVER_INFO.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Registrar handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.log('SSE: ListTools request received');
      return { tools };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      console.log(`SSE: CallTool request - ${name}`, args);
      
      try {
        const result = await handleToolCall(name, args || {});
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error: any) {
        console.error(`Error en herramienta ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: true,
                message: error.message,
                tool: name
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });

    // Crear transporte SSE - el segundo parámetro es el endpoint donde el cliente enviará mensajes
    const transport = new SSEServerTransport('/message', res);
    
    // Guardar el transporte para poder recibir mensajes posteriormente
    const sessionId = transport.sessionId;
    sseTransports.set(sessionId, transport);
    
    console.log(`SSE: Sesión creada con ID: ${sessionId}`);
    
    // Conectar servidor con transporte
    await server.connect(transport);
    
    console.log('SSE: Servidor MCP conectado');

    // Manejar cierre de conexión
    req.on('close', () => {
      console.log(`SSE: Conexión cerrada - sesión ${sessionId}`);
      sseTransports.delete(sessionId);
      server.close().catch(err => console.error('Error cerrando servidor:', err));
    });

  } catch (error: any) {
    console.error('Error en conexión SSE:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error.message,
        stack: error.stack 
      });
    }
  }
});

/**
 * Endpoint para enviar mensajes al servidor MCP
 * El cliente debe incluir el sessionId en el query string
 */
app.post('/message', async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  
  console.log(`SSE Message received for session ${sessionId}:`, JSON.stringify(req.body, null, 2));
  
  if (!sessionId) {
    return res.status(400).json({ 
      error: 'sessionId is required',
      message: 'Include ?sessionId=<id> in the URL. Get the sessionId from the SSE connection endpoint.'
    });
  }
  
  const transport = sseTransports.get(sessionId);
  
  if (!transport) {
    return res.status(404).json({ 
      error: 'Session not found',
      message: `No active SSE session with id ${sessionId}. Establish a new connection via GET /sse.`,
      activeSessions: Array.from(sseTransports.keys())
    });
  }
  
  try {
    // El SSEServerTransport maneja el mensaje internamente
    await transport.handlePostMessage(req, res);
  } catch (error: any) {
    console.error('Error procesando mensaje SSE:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error.message,
        stack: error.stack 
      });
    }
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    transport: 'SSE',
    timestamp: new Date().toISOString(),
    service: SERVER_INFO.name + ' (SSE)',
    version: SERVER_INFO.version,
    activeSessions: sseTransports.size,
    tools: tools.length,
    endpoints: {
      sse: '/sse',
      message: '/message',
      health: '/health'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MCP INE Server (SSE) ejecutándose en http://localhost:${PORT}`);
  console.log(`📡 Endpoint SSE: http://localhost:${PORT}/sse`);
  console.log(`📨 Endpoint Message: http://localhost:${PORT}/message`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Herramientas disponibles: ${tools.length}`);
});
