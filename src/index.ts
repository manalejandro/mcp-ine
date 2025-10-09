import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { ineClient } from './services/ine-client.js';
import { swaggerSpec } from './swagger.js';
import type { Idioma } from './types/ine.types.js';

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false
}));
app.use(express.json());
app.use(express.text());

// Swagger Documentation
app.use('/api-docs', ...swaggerUi.serve as any);
app.get('/api-docs', swaggerUi.setup(swaggerSpec) as any);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MCP INE Server'
  });
});

/**
 * Definición de herramientas MCP para la API del INE
 */
const tools: Tool[] = [
  {
    name: 'ine_datos_tabla',
    description: 'Obtiene datos de una tabla específica del INE. Permite filtrar por periodos, nivel de detalle y variables.',
    inputSchema: {
      type: 'object',
      properties: {
        idTabla: { type: 'string', description: 'ID de la tabla (ej: 50902)' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES', description: 'Idioma' },
        nult: { type: 'number', description: 'Número de últimos periodos' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' },
        tip: { type: 'string', enum: ['A', 'M', 'AM'], description: 'Tipo: A=amigable, M=metadatos, AM=ambos' },
        tv: { type: 'string', description: 'Filtro de variables (formato: id_variable:id_valor)' },
        date: { type: 'string', description: 'Rango de fechas (formato: aaaammdd:aaaammdd)' }
      },
      required: ['idTabla']
    }
  },
  {
    name: 'ine_datos_serie',
    description: 'Obtiene datos de una serie temporal específica del INE.',
    inputSchema: {
      type: 'object',
      properties: {
        idSerie: { type: 'string', description: 'Código de la serie (ej: IPC251856)' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        nult: { type: 'number', description: 'Número de últimos periodos' },
        det: { type: 'number', enum: [0, 1, 2], description: 'Nivel de detalle' },
        tip: { type: 'string', enum: ['A', 'M', 'AM'], description: 'Tipo de respuesta' },
        date: { type: 'string', description: 'Rango de fechas' }
      },
      required: ['idSerie']
    }
  },
  {
    name: 'ine_datos_metadata_operacion',
    description: 'Obtiene datos de series usando filtros de metadata de una operación.',
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string', description: 'Código de operación (ej: IPC)' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        p: { type: 'number', description: 'Periodicidad (1=mensual, 3=trimestral, 12=anual)' },
        nult: { type: 'number', description: 'Número de últimos periodos' },
        det: { type: 'number', enum: [0, 1, 2] },
        tip: { type: 'string', enum: ['A', 'M', 'AM'] },
        g1: { type: 'string', description: 'Filtro 1 (formato: id_variable:id_valor)' },
        g2: { type: 'string', description: 'Filtro 2' },
        g3: { type: 'string', description: 'Filtro 3' },
        g4: { type: 'string', description: 'Filtro 4' },
        g5: { type: 'string', description: 'Filtro 5' }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_operaciones_disponibles',
    description: 'Lista todas las operaciones estadísticas disponibles en el INE.',
    inputSchema: {
      type: 'object',
      properties: {
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        det: { type: 'number', enum: [0, 1, 2] },
        geo: { type: 'number', enum: [0, 1], description: '0=nacional, 1=geográfico' },
        page: { type: 'number', description: 'Página (500 elementos por página)' }
      }
    }
  },
  {
    name: 'ine_operacion',
    description: 'Obtiene información detallada de una operación estadística.',
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string', description: 'Código de operación' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        det: { type: 'number', enum: [0, 1, 2] }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_variables',
    description: 'Lista todas las variables estadísticas disponibles.',
    inputSchema: {
      type: 'object',
      properties: {
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        page: { type: 'number' }
      }
    }
  },
  {
    name: 'ine_variables_operacion',
    description: 'Obtiene las variables utilizadas en una operación específica.',
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        page: { type: 'number' }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_valores_variable',
    description: 'Obtiene todos los valores posibles de una variable.',
    inputSchema: {
      type: 'object',
      properties: {
        idVariable: { type: 'string', description: 'ID de la variable' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        det: { type: 'number', enum: [0, 1, 2] },
        clasif: { type: 'number', description: 'ID de clasificación' }
      },
      required: ['idVariable']
    }
  },
  {
    name: 'ine_valores_variable_operacion',
    description: 'Obtiene valores de una variable en el contexto de una operación.',
    inputSchema: {
      type: 'object',
      properties: {
        idVariable: { type: 'string' },
        idOperacion: { type: 'string' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        det: { type: 'number', enum: [0, 1, 2] }
      },
      required: ['idVariable', 'idOperacion']
    }
  },
  {
    name: 'ine_tablas_operacion',
    description: 'Lista todas las tablas de una operación estadística.',
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        det: { type: 'number', enum: [0, 1, 2] },
        geo: { type: 'number', enum: [0, 1] },
        tip: { type: 'string', enum: ['A'] }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_grupos_tabla',
    description: 'Obtiene los grupos de selección que definen una tabla.',
    inputSchema: {
      type: 'object',
      properties: {
        idTabla: { type: 'string' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' }
      },
      required: ['idTabla']
    }
  },
  {
    name: 'ine_valores_grupos_tabla',
    description: 'Obtiene los valores de un grupo específico de una tabla.',
    inputSchema: {
      type: 'object',
      properties: {
        idTabla: { type: 'string' },
        idGrupo: { type: 'string' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        det: { type: 'number', enum: [0, 1, 2] }
      },
      required: ['idTabla', 'idGrupo']
    }
  },
  {
    name: 'ine_serie',
    description: 'Obtiene información completa de una serie temporal.',
    inputSchema: {
      type: 'object',
      properties: {
        idSerie: { type: 'string' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        det: { type: 'number', enum: [0, 1, 2] },
        tip: { type: 'string', enum: ['A', 'M', 'AM'] }
      },
      required: ['idSerie']
    }
  },
  {
    name: 'ine_series_operacion',
    description: 'Lista todas las series de una operación.',
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        det: { type: 'number', enum: [0, 1, 2] },
        tip: { type: 'string', enum: ['A', 'M', 'AM'] },
        page: { type: 'number' }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_valores_serie',
    description: 'Obtiene las variables y valores que definen una serie.',
    inputSchema: {
      type: 'object',
      properties: {
        idSerie: { type: 'string' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        det: { type: 'number', enum: [0, 1, 2] }
      },
      required: ['idSerie']
    }
  },
  {
    name: 'ine_series_tabla',
    description: 'Obtiene todas las series de una tabla específica.',
    inputSchema: {
      type: 'object',
      properties: {
        idTabla: { type: 'string' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        det: { type: 'number', enum: [0, 1, 2] },
        tip: { type: 'string', enum: ['A', 'M', 'AM'] },
        tv: { type: 'string', description: 'Filtro de variables' }
      },
      required: ['idTabla']
    }
  },
  {
    name: 'ine_serie_metadata_operacion',
    description: 'Busca series usando filtros de metadata en una operación.',
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        p: { type: 'number', description: 'Periodicidad' },
        det: { type: 'number', enum: [0, 1, 2] },
        tip: { type: 'string', enum: ['A', 'M', 'AM'] },
        g1: { type: 'string' },
        g2: { type: 'string' },
        g3: { type: 'string' },
        g4: { type: 'string' },
        g5: { type: 'string' }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_periodicidades',
    description: 'Lista todas las periodicidades disponibles (mensual, trimestral, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' }
      }
    }
  },
  {
    name: 'ine_publicaciones',
    description: 'Lista todas las publicaciones estadísticas disponibles.',
    inputSchema: {
      type: 'object',
      properties: {
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        det: { type: 'number', enum: [0, 1, 2] },
        tip: { type: 'string', enum: ['A'] }
      }
    }
  },
  {
    name: 'ine_publicaciones_operacion',
    description: 'Obtiene las publicaciones de una operación específica.',
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        det: { type: 'number', enum: [0, 1, 2] },
        tip: { type: 'string', enum: ['A'] }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_publicacion_fecha_publicacion',
    description: 'Obtiene las fechas de publicación para una publicación dada.',
    inputSchema: {
      type: 'object',
      properties: {
        idPublicacion: { type: 'string' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        det: { type: 'number', enum: [0, 1, 2] },
        tip: { type: 'string', enum: ['A'] }
      },
      required: ['idPublicacion']
    }
  },
  {
    name: 'ine_clasificaciones',
    description: 'Lista todas las clasificaciones estadísticas disponibles.',
    inputSchema: {
      type: 'object',
      properties: {
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' }
      }
    }
  },
  {
    name: 'ine_clasificaciones_operacion',
    description: 'Obtiene las clasificaciones utilizadas en una operación.',
    inputSchema: {
      type: 'object',
      properties: {
        idOperacion: { type: 'string' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' }
      },
      required: ['idOperacion']
    }
  },
  {
    name: 'ine_valores_hijos',
    description: 'Obtiene valores hijos en una estructura jerárquica (ej: provincias de una comunidad).',
    inputSchema: {
      type: 'object',
      properties: {
        idVariable: { type: 'string', description: 'ID de la variable' },
        idValor: { type: 'string', description: 'ID del valor padre' },
        idioma: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
        det: { type: 'number', enum: [0, 1, 2] }
      },
      required: ['idVariable', 'idValor']
    }
  }
];

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
 * Crea un servidor MCP con los handlers configurados
 */
function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'ine-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Registrar handler para listar herramientas
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools
  }));

  // Registrar handler para llamar herramientas
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

  return server;
}

/**
 * Endpoint MCP HTTP con SSE (Server-Sent Events)
 * Este es el protocolo oficial de MCP para HTTP
 */
app.get('/mcp/v1/sse', async (req: Request, res: Response) => {
  console.log('Nueva conexión SSE MCP');
  
  try {
    const server = createMCPServer();
    const transport = new SSEServerTransport('/mcp/v1/message', res);
    
    await server.connect(transport);
    
    // La conexión se mantiene abierta hasta que el cliente se desconecte
    req.on('close', () => {
      console.log('Conexión SSE cerrada');
      server.close().catch(console.error);
    });
  } catch (error: any) {
    console.error('Error en conexión SSE:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * Endpoint para mensajes MCP (usado por SSE transport)
 */
app.post('/mcp/v1/message', async (req: Request, res: Response) => {
  try {
    // Este endpoint es manejado internamente por SSEServerTransport
    // Solo necesitamos asegurarnos de que el body parser esté configurado
    res.status(202).json({ received: true });
  } catch (error: any) {
    console.error('Error procesando mensaje:', error);
    res.status(500).json({ error: error.message });
  }
});

// API REST endpoints (adicionales para compatibilidad)
app.get('/api/datos-tabla/:idTabla', async (req, res) => {
  const result = await ineClient.getDatosTabla(req.params.idTabla, req.query as any);
  res.json(result);
});

app.get('/api/datos-serie/:idSerie', async (req, res) => {
  const result = await ineClient.getDatosSerie(req.params.idSerie, req.query as any);
  res.json(result);
});

app.get('/api/operaciones-disponibles', async (req, res) => {
  const result = await ineClient.getOperacionesDisponibles(req.query as any);
  res.json(result);
});

app.get('/api/operacion/:idOperacion', async (req, res) => {
  const result = await ineClient.getOperacion(req.params.idOperacion, req.query as any);
  res.json(result);
});

app.get('/api/variables', async (req, res) => {
  const result = await ineClient.getVariables(req.query as any);
  res.json(result);
});

app.get('/api/variables-operacion/:idOperacion', async (req, res) => {
  const result = await ineClient.getVariablesOperacion(req.params.idOperacion, req.query as any);
  res.json(result);
});

app.get('/api/series-operacion/:idOperacion', async (req, res) => {
  const result = await ineClient.getSeriesOperacion(req.params.idOperacion, req.query as any);
  res.json(result);
});

app.get('/api/tablas-operacion/:idOperacion', async (req, res) => {
  const result = await ineClient.getTablasOperacion(req.params.idOperacion, req.query as any);
  res.json(result);
});

// Iniciar servidor HTTP
app.listen(PORT, () => {
  console.log(`🚀 MCP INE Server ejecutándose en http://localhost:${PORT}`);
  console.log(`📚 Documentación Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`🔧 Endpoint MCP SSE: http://localhost:${PORT}/mcp/v1/sse`);
  console.log(`📨 Endpoint MCP Message: http://localhost:${PORT}/mcp/v1/message`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`\n📋 Herramientas disponibles: ${tools.length}`);
});

// Para uso con stdio (AI Toolkit local)
export async function runStdioServer() {
  const server = createMCPServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('MCP INE Server iniciado en modo stdio');
}

// Si se ejecuta directamente con --stdio
if (process.argv.includes('--stdio')) {
  runStdioServer().catch(console.error);
}
