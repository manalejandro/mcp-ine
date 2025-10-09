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

// Página principal con información de la API
app.get('/', (req: Request, res: Response) => {
  const baseUrl = req.protocol + '://' + req.get('host');
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP INE Server - API del Instituto Nacional de Estadística</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6; 
      color: #333; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 12px; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      padding: 40px; 
      text-align: center; 
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { font-size: 1.2em; opacity: 0.95; }
    .content { padding: 40px; }
    .section { margin-bottom: 40px; }
    .section h2 { 
      color: #667eea; 
      margin-bottom: 20px; 
      padding-bottom: 10px; 
      border-bottom: 3px solid #667eea;
      font-size: 1.8em;
    }
    .section h3 { 
      color: #764ba2; 
      margin: 20px 0 10px; 
      font-size: 1.3em;
    }
    .endpoints { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
      gap: 20px; 
      margin-top: 20px; 
    }
    .endpoint { 
      background: #f8f9fa; 
      padding: 20px; 
      border-radius: 8px; 
      border-left: 4px solid #667eea;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .endpoint:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
    }
    .endpoint .method { 
      display: inline-block;
      padding: 4px 12px; 
      border-radius: 4px; 
      font-weight: bold; 
      font-size: 0.85em;
      margin-bottom: 10px;
    }
    .method.get { background: #28a745; color: white; }
    .method.post { background: #007bff; color: white; }
    .endpoint code { 
      display: block;
      background: #2d3748; 
      color: #68d391; 
      padding: 12px; 
      border-radius: 6px; 
      margin: 10px 0;
      font-size: 0.9em;
      overflow-x: auto;
    }
    .endpoint p { 
      color: #666; 
      font-size: 0.95em;
      margin-top: 8px;
    }
    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .tool-card {
      background: #f0f4ff;
      padding: 15px;
      border-radius: 6px;
      border-left: 3px solid #764ba2;
    }
    .tool-card strong {
      color: #764ba2;
      display: block;
      margin-bottom: 5px;
      font-size: 1.05em;
    }
    .tool-card small {
      color: #555;
      font-size: 0.9em;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-card .number {
      font-size: 2.5em;
      font-weight: bold;
      display: block;
      margin-bottom: 5px;
    }
    .stat-card .label {
      font-size: 1em;
      opacity: 0.9;
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: bold;
      margin: 5px;
    }
    .badge.mcp { background: #667eea; color: white; }
    .badge.rest { background: #28a745; color: white; }
    .badge.swagger { background: #ff9800; color: white; }
    a { color: #667eea; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 MCP INE Server</h1>
      <p>API del Instituto Nacional de Estadística de España</p>
      <p>
        <span class="badge mcp">MCP Protocol</span>
        <span class="badge rest">REST API</span>
        <span class="badge swagger">Swagger Docs</span>
      </p>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>📊 Estadísticas del Servidor</h2>
        <div class="stats">
          <div class="stat-card">
            <span class="number">${tools.length}</span>
            <span class="label">Herramientas MCP</span>
          </div>
          <div class="stat-card">
            <span class="number">24</span>
            <span class="label">Endpoints INE</span>
          </div>
          <div class="stat-card">
            <span class="number">3</span>
            <span class="label">Protocolos</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>🔌 Endpoints MCP (Model Context Protocol)</h2>
        <div class="endpoints">
          <div class="endpoint">
            <span class="method post">POST</span>
            <code>${baseUrl}/mcp/v1</code>
            <p><strong>JSON-RPC Endpoint</strong> - Endpoint principal para MCP sobre HTTP usando JSON-RPC 2.0. Este es el endpoint recomendado para la mayoría de clientes.</p>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <code>${baseUrl}/mcp/v1/sse</code>
            <p><strong>Conexión SSE</strong> - Endpoint alternativo para conexión MCP con Server-Sent Events (experimental).</p>
          </div>
        </div>
        
        <h3>📝 Configuración para VS Code AI Toolkit</h3>
        <div class="endpoint">
          <code>{
  "mcpServers": {
    "mcp-ine": {
      "url": "${baseUrl}/mcp/v1",
      "transport": "http"
    }
  }
}</code>
          <p>Agrega esta configuración a <strong>~/.aitk/mcp.json</strong></p>
        </div>
        
        <h3>🧪 Probar el Endpoint</h3>
        <div class="endpoint">
          <code>curl -X POST ${baseUrl}/mcp/v1 \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'</code>
        </div>
      </div>

      <div class="section">
        <h2>🛠️ Herramientas MCP Disponibles</h2>
        <p>El servidor expone ${tools.length} herramientas para consultar datos del INE:</p>
        <div class="tools-grid">
          ${tools.map(tool => `
            <div class="tool-card">
              <strong>${tool.name}</strong>
              <small>${tool.description}</small>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section">
        <h2>📚 Documentación y APIs</h2>
        <div class="endpoints">
          <div class="endpoint">
            <span class="method get">GET</span>
            <code><a href="${baseUrl}/api-docs" target="_blank">${baseUrl}/api-docs</a></code>
            <p><strong>Swagger UI</strong> - Documentación interactiva completa de la API REST con todos los endpoints disponibles.</p>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <code><a href="${baseUrl}/health" target="_blank">${baseUrl}/health</a></code>
            <p><strong>Health Check</strong> - Verifica el estado del servidor.</p>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>🌐 API REST Directa</h2>
        <p>Además del protocolo MCP, puedes acceder directamente a los datos mediante endpoints REST:</p>
        <div class="endpoints">
          <div class="endpoint">
            <span class="method get">GET</span>
            <code>/api/operaciones-disponibles</code>
            <p>Lista todas las operaciones estadísticas disponibles</p>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <code>/api/operacion/:idOperacion</code>
            <p>Información detallada de una operación (ej: IPC, EPA)</p>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <code>/api/datos-tabla/:idTabla</code>
            <p>Datos completos de una tabla estadística</p>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <code>/api/datos-serie/:idSerie</code>
            <p>Datos de una serie temporal específica</p>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <code>/api/variables</code>
            <p>Lista todas las variables estadísticas</p>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <code>/api/series-operacion/:idOperacion</code>
            <p>Todas las series de una operación</p>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>💡 Ejemplos de Uso</h2>
        
        <h3>Consulta directa con curl:</h3>
        <div class="endpoint">
          <code>curl "${baseUrl}/api/operaciones-disponibles?idioma=ES"</code>
        </div>
        
        <h3>Consulta mediante MCP:</h3>
        <div class="endpoint">
          <code>// Usa la herramienta ine_operaciones_disponibles
// desde tu cliente MCP (VS Code AI Toolkit, etc.)</code>
        </div>
      </div>

      <div class="section">
        <h2>ℹ️ Información</h2>
        <p><strong>Servidor:</strong> MCP INE Server v1.0.0</p>
        <p><strong>Protocolo:</strong> Model Context Protocol (MCP) + REST API</p>
        <p><strong>Fuente de datos:</strong> <a href="https://www.ine.es" target="_blank">Instituto Nacional de Estadística (INE)</a></p>
        <p><strong>Documentación MCP:</strong> <a href="https://modelcontextprotocol.io" target="_blank">modelcontextprotocol.io</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `);
});

// Swagger Documentation
app.use('/api-docs', ...swaggerUi.serve as any);
app.get('/api-docs', swaggerUi.setup(swaggerSpec) as any);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MCP INE Server',
    version: '1.0.0',
    tools: tools.length,
    endpoints: {
      mcp: '/mcp/v1',
      mcp_sse: '/mcp/v1/sse',
      mcp_message: '/mcp/v1/message',
      swagger: '/api-docs',
      health: '/health'
    },
    protocol: 'JSON-RPC 2.0',
    mcp_version: '2024-11-05'
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
 * Endpoint MCP JSON-RPC directo (más compatible y simple)
 */
app.post('/mcp/v1', async (req: Request, res: Response) => {
  console.log('MCP JSON-RPC Request:', req.body);
  
  try {
    const { jsonrpc, method, params, id } = req.body;

    // Validar JSON-RPC 2.0
    if (jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: { 
          code: -32600, 
          message: 'Invalid Request: jsonrpc must be "2.0"' 
        },
        id: id || null
      });
    }

    // Initialize - Handshake inicial de MCP
    if (method === 'initialize') {
      return res.json({
        jsonrpc: '2.0',
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'ine-mcp-server',
            version: '1.0.0'
          },
          capabilities: {
            tools: {}
          }
        },
        id
      });
    }

    // Initialized - Confirmación del cliente
    if (method === 'notifications/initialized') {
      console.log('Cliente MCP inicializado');
      return res.status(204).send();
    }

    // Listar herramientas
    if (method === 'tools/list') {
      return res.json({
        jsonrpc: '2.0',
        result: { tools },
        id
      });
    }

    // Llamar a una herramienta
    if (method === 'tools/call') {
      const { name, arguments: args } = params || {};
      
      if (!name) {
        return res.status(400).json({
          jsonrpc: '2.0',
          error: { 
            code: -32602, 
            message: 'Invalid params: name is required' 
          },
          id
        });
      }

      const result = await handleToolCall(name, args || {});
      
      return res.json({
        jsonrpc: '2.0',
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        },
        id
      });
    }

    // Ping/Pong
    if (method === 'ping') {
      return res.json({
        jsonrpc: '2.0',
        result: {},
        id
      });
    }

    // Método no soportado
    return res.status(404).json({
      jsonrpc: '2.0',
      error: { 
        code: -32601, 
        message: `Method not found: ${method}` 
      },
      id
    });

  } catch (error: any) {
    console.error('Error en MCP:', error);
    return res.status(500).json({
      jsonrpc: '2.0',
      error: { 
        code: -32603, 
        message: error.message || 'Internal error',
        data: { stack: error.stack }
      },
      id: req.body.id || null
    });
  }
});

/**
 * Endpoint MCP HTTP con SSE (Server-Sent Events)
 * Alternativa para clientes que prefieren SSE
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
  console.log(`🔧 Endpoint MCP JSON-RPC: POST http://localhost:${PORT}/mcp/v1`);
  console.log(`🔧 Endpoint MCP SSE: GET http://localhost:${PORT}/mcp/v1/sse`);
  console.log(`📨 Endpoint MCP Message: POST http://localhost:${PORT}/mcp/v1/message`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`\n📋 Herramientas disponibles: ${tools.length}`);
  console.log(`\n🔗 Configuración AI Toolkit:`);
  console.log(`   {"mcpServers": {"mcp-ine": {"url": "http://localhost:${PORT}/mcp/v1", "transport": "http"}}}`);
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
