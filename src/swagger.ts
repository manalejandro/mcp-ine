/**
 * Especificación OpenAPI para la API del INE MCP Server
 */

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'INE MCP Server API',
    version: '1.0.0',
    description: 'Servidor MCP para consultar la API del Instituto Nacional de Estadística (INE) de España',
    contact: {
      name: 'API Support',
      url: 'https://github.com/your-repo/mcp-ine-server'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor de desarrollo'
    }
  ],
  tags: [
    { name: 'MCP', description: 'Endpoints del protocolo MCP' },
    { name: 'Datos', description: 'Consulta de datos estadísticos' },
    { name: 'Operaciones', description: 'Gestión de operaciones estadísticas' },
    { name: 'Variables', description: 'Gestión de variables' },
    { name: 'Series', description: 'Gestión de series temporales' },
    { name: 'Tablas', description: 'Gestión de tablas estadísticas' },
    { name: 'Metadatos', description: 'Información de metadatos' }
  ],
  paths: {
    '/mcp/v1': {
      post: {
        tags: ['MCP'],
        summary: 'Endpoint JSON-RPC del protocolo MCP',
        description: 'Endpoint principal para comunicación JSON-RPC con el servidor MCP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  jsonrpc: { type: 'string', example: '2.0' },
                  method: { type: 'string', example: 'tools/call' },
                  params: { type: 'object' },
                  id: { type: 'number' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Respuesta exitosa',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    jsonrpc: { type: 'string' },
                    result: { type: 'object' },
                    id: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/datos-tabla/{idTabla}': {
      get: {
        tags: ['Datos'],
        summary: 'Obtener datos de una tabla',
        description: 'Devuelve los datos de una tabla específica del INE',
        parameters: [
          {
            name: 'idTabla',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID de la tabla',
            example: '50902'
          },
          {
            name: 'idioma',
            in: 'query',
            schema: { type: 'string', enum: ['ES', 'EN'], default: 'ES' },
            description: 'Idioma de la respuesta'
          },
          {
            name: 'nult',
            in: 'query',
            schema: { type: 'integer' },
            description: 'Número de últimos periodos'
          },
          {
            name: 'det',
            in: 'query',
            schema: { type: 'integer', enum: [0, 1, 2] },
            description: 'Nivel de detalle'
          },
          {
            name: 'tip',
            in: 'query',
            schema: { type: 'string', enum: ['A', 'M', 'AM'] },
            description: 'Tipo de respuesta (A=amigable, M=metadatos, AM=ambos)'
          }
        ],
        responses: {
          '200': {
            description: 'Datos de la tabla',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/datos-serie/{idSerie}': {
      get: {
        tags: ['Datos'],
        summary: 'Obtener datos de una serie',
        description: 'Devuelve los datos de una serie específica del INE',
        parameters: [
          {
            name: 'idSerie',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID de la serie',
            example: 'IPC251856'
          },
          {
            name: 'idioma',
            in: 'query',
            schema: { type: 'string', enum: ['ES', 'EN'], default: 'ES' }
          },
          {
            name: 'nult',
            in: 'query',
            schema: { type: 'integer' }
          },
          {
            name: 'det',
            in: 'query',
            schema: { type: 'integer', enum: [0, 1, 2] }
          }
        ],
        responses: {
          '200': { description: 'Datos de la serie' }
        }
      }
    },
    '/api/operaciones-disponibles': {
      get: {
        tags: ['Operaciones'],
        summary: 'Listar operaciones disponibles',
        description: 'Obtiene todas las operaciones estadísticas disponibles en el INE',
        parameters: [
          {
            name: 'idioma',
            in: 'query',
            schema: { type: 'string', enum: ['ES', 'EN'], default: 'ES' }
          },
          {
            name: 'geo',
            in: 'query',
            schema: { type: 'integer', enum: [0, 1] },
            description: '0=nacional, 1=geográfico'
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': { description: 'Lista de operaciones' }
        }
      }
    },
    '/api/operacion/{idOperacion}': {
      get: {
        tags: ['Operaciones'],
        summary: 'Obtener información de una operación',
        parameters: [
          {
            name: 'idOperacion',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'IPC'
          },
          {
            name: 'idioma',
            in: 'query',
            schema: { type: 'string', enum: ['ES', 'EN'], default: 'ES' }
          }
        ],
        responses: {
          '200': { description: 'Información de la operación' }
        }
      }
    },
    '/api/variables': {
      get: {
        tags: ['Variables'],
        summary: 'Listar todas las variables',
        parameters: [
          {
            name: 'idioma',
            in: 'query',
            schema: { type: 'string', enum: ['ES', 'EN'], default: 'ES' }
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': { description: 'Lista de variables' }
        }
      }
    },
    '/api/variables-operacion/{idOperacion}': {
      get: {
        tags: ['Variables'],
        summary: 'Variables de una operación',
        parameters: [
          {
            name: 'idOperacion',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'idioma',
            in: 'query',
            schema: { type: 'string', enum: ['ES', 'EN'], default: 'ES' }
          }
        ],
        responses: {
          '200': { description: 'Variables de la operación' }
        }
      }
    },
    '/api/series-operacion/{idOperacion}': {
      get: {
        tags: ['Series'],
        summary: 'Series de una operación',
        parameters: [
          {
            name: 'idOperacion',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'idioma',
            in: 'query',
            schema: { type: 'string', enum: ['ES', 'EN'], default: 'ES' }
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': { description: 'Series de la operación' }
        }
      }
    },
    '/api/tablas-operacion/{idOperacion}': {
      get: {
        tags: ['Tablas'],
        summary: 'Tablas de una operación',
        parameters: [
          {
            name: 'idOperacion',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'idioma',
            in: 'query',
            schema: { type: 'string', enum: ['ES', 'EN'], default: 'ES' }
          }
        ],
        responses: {
          '200': { description: 'Tablas de la operación' }
        }
      }
    },
    '/health': {
      get: {
        tags: ['MCP'],
        summary: 'Health check',
        description: 'Verifica el estado del servidor',
        responses: {
          '200': {
            description: 'Servidor funcionando',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' }
        }
      }
    }
  }
};
