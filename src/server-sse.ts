import express, { Request, Response } from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { ineClient } from './services/ine-client.js';
import type { Idioma } from './types/ine.types.js';

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(express.json());

// Almacenamiento de sesiones SSE
const sessions = new Map<string, { server: Server; transport: SSEServerTransport }>();

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

// Definición de herramientas (mismo que en index.ts)
const tools = [
  {
    name: 'ine_datos_tabla',
    description: 'Obtiene datos de una tabla específica del INE',
    inputSchema: {
      type: 'object',
      properties: {
        idTabla: { type: 'string', description: 'ID de la tabla' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        nult: { type: 'number' },
        det: { type: 'number', enum: [0, 1, 2] },
        tip: { type: 'string', enum: ['A', 'M', 'AM'] }
      },
      required: ['idTabla']
    }
  },
  {
    name: 'ine_datos_serie',
    description: 'Obtiene datos de una serie temporal',
    inputSchema: {
      type: 'object',
      properties: {
        idSerie: { type: 'string' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        nult: { type: 'number' },
        det: { type: 'number', enum: [0, 1, 2] }
      },
      required: ['idSerie']
    }
  },
  {
    name: 'ine_operaciones_disponibles',
    description: 'Lista todas las operaciones estadísticas',
    inputSchema: {
      type: 'object',
      properties: {
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        geo: { type: 'number', enum: [0, 1] },
        page: { type: 'number' }
      }
    }
  }
  // Agregar el resto de herramientas según sea necesario
];

/**
 * Endpoint SSE para conexión MCP
 */
app.get('/sse', async (req: Request, res: Response) => {
  const sessionId = Math.random().toString(36).substring(7);

  // Configurar SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Crear servidor MCP
  const server = new Server(
    {
      name: 'ine-mcp-server-sse',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Registrar handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const result = await handleToolCall(name, args || {});
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  });

  // Crear transporte SSE
  const transport = new SSEServerTransport('/messages', res);
  await server.connect(transport);

  sessions.set(sessionId, { server, transport });

  // Limpiar al cerrar conexión
  req.on('close', () => {
    sessions.delete(sessionId);
    console.log(`Sesión SSE cerrada: ${sessionId}`);
  });

  console.log(`Nueva sesión SSE iniciada: ${sessionId}`);
});

/**
 * Endpoint para enviar mensajes (POST)
 */
app.post('/messages', async (req: Request, res: Response) => {
  try {
    // Este endpoint procesa mensajes enviados por el cliente
    const message = req.body;
    console.log('Mensaje recibido:', message);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error procesando mensaje:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    transport: 'SSE',
    sessions: sessions.size,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MCP INE Server (SSE) ejecutándose en http://localhost:${PORT}`);
  console.log(`📡 Endpoint SSE: http://localhost:${PORT}/sse`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});
