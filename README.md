# MCP INE Server

Servidor MCP (Model Context Protocol) para consultar la API del Instituto Nacional de Estadística (INE) de España. Implementa soporte completo para JSON-RPC sobre HTTP y SSE (Server-Sent Events), optimizado para su uso con VS Code AI Toolkit.

## 🌟 Características

- ✅ **Protocolo MCP completo**: Soporte para JSON-RPC y SSE
- ✅ **24 herramientas MCP**: Acceso a todos los endpoints de la API del INE
- ✅ **Documentación Swagger**: API REST documentada con OpenAPI 3.0
- ✅ **TypeScript**: Código completamente tipado
- ✅ **VS Code AI Toolkit**: Configuración lista para usar
- ✅ **Múltiples transportes**: HTTP JSON-RPC, SSE y stdio

## 📋 Requisitos

- Node.js 18 o superior
- npm o yarn

## 🚀 Instalación

### Instalación rápida

```bash
chmod +x install.sh
./install.sh
```

### Instalación manual

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

## 🎮 Uso

### Modo HTTP JSON-RPC (Principal)

Este es el modo recomendado para AI Toolkit:

```bash
npm start
# o
./start-server.sh
```

El servidor estará disponible en:
- **Endpoint MCP**: `http://localhost:3000/mcp/v1`
- **Swagger UI**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/health`

### Modo SSE (Server-Sent Events)

Para streaming de eventos:

```bash
npm run start:sse
# o
./start-sse.sh
```

El servidor SSE estará en:
- **Endpoint SSE**: `http://localhost:3001/sse`
- **Health Check**: `http://localhost:3001/health`

### Modo stdio

Para integración directa:

```bash
node dist/index.js --stdio
```

## 🔧 Configuración en VS Code AI Toolkit

### Opción 1: HTTP JSON-RPC (Recomendado)

1. Abre VS Code
2. Instala la extensión **AI Toolkit**
3. Inicia el servidor: `npm start`
4. En AI Toolkit, configura el servidor MCP:

```json
{
  "mcpServers": {
    "ine-server": {
      "url": "http://localhost:3000/mcp/v1",
      "transport": "http",
      "description": "API del INE España"
    }
  }
}
```

### Opción 2: SSE

```json
{
  "mcpServers": {
    "ine-server-sse": {
      "url": "http://localhost:3001/sse",
      "transport": "sse",
      "description": "API del INE España (SSE)"
    }
  }
}
```

### Opción 3: stdio

```json
{
  "mcpServers": {
    "ine-server-stdio": {
      "command": "node",
      "args": ["dist/index.js", "--stdio"],
      "cwd": "/ruta/a/mcp-ine",
      "description": "API del INE España (stdio)"
    }
  }
}
```

## 🛠️ Herramientas MCP Disponibles

El servidor proporciona 24 herramientas MCP para interactuar con la API del INE:

### Datos Estadísticos

- **`ine_datos_tabla`**: Obtiene datos de una tabla específica
- **`ine_datos_serie`**: Obtiene datos de una serie temporal
- **`ine_datos_metadata_operacion`**: Datos con filtros de metadata

### Operaciones

- **`ine_operaciones_disponibles`**: Lista todas las operaciones estadísticas
- **`ine_operacion`**: Información de una operación específica

### Variables y Valores

- **`ine_variables`**: Lista todas las variables disponibles
- **`ine_variables_operacion`**: Variables de una operación
- **`ine_valores_variable`**: Valores de una variable
- **`ine_valores_variable_operacion`**: Valores en contexto de operación
- **`ine_valores_hijos`**: Valores jerárquicos (ej: provincias de una CA)

### Series Temporales

- **`ine_serie`**: Información de una serie
- **`ine_series_operacion`**: Series de una operación
- **`ine_series_tabla`**: Series de una tabla
- **`ine_serie_metadata_operacion`**: Búsqueda con filtros
- **`ine_valores_serie`**: Variables que definen una serie

### Tablas

- **`ine_tablas_operacion`**: Tablas de una operación
- **`ine_grupos_tabla`**: Grupos de una tabla
- **`ine_valores_grupos_tabla`**: Valores de un grupo

### Metadatos

- **`ine_periodicidades`**: Periodicidades disponibles
- **`ine_publicaciones`**: Lista de publicaciones
- **`ine_publicaciones_operacion`**: Publicaciones de una operación
- **`ine_publicacion_fecha_publicacion`**: Fechas de publicación
- **`ine_clasificaciones`**: Clasificaciones disponibles
- **`ine_clasificaciones_operacion`**: Clasificaciones de una operación

## 📖 Ejemplos de Uso

### Ejemplo 1: Obtener datos del IPC

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "ine_datos_serie",
    "arguments": {
      "idSerie": "IPC251856",
      "nult": 12,
      "tip": "A"
    }
  },
  "id": 1
}
```

### Ejemplo 2: Listar operaciones disponibles

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "ine_operaciones_disponibles",
    "arguments": {
      "idioma": "ES",
      "geo": 0
    }
  },
  "id": 2
}
```

### Ejemplo 3: Obtener variables del IPC

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "ine_variables_operacion",
    "arguments": {
      "idOperacion": "IPC"
    }
  },
  "id": 3
}
```

### Desde AI Toolkit (Chat)

Una vez configurado en AI Toolkit, puedes hacer preguntas como:

```
¿Cuál es el último valor del IPC en España?

¿Qué operaciones estadísticas tiene el INE sobre población?

Dame los datos de la tabla 50902 de los últimos 5 períodos

¿Cuáles son las variables disponibles para la operación IPC?
```

## 🌐 API REST

Además del protocolo MCP, el servidor expone endpoints REST:

- `GET /api/datos-tabla/:idTabla` - Datos de tabla
- `GET /api/datos-serie/:idSerie` - Datos de serie
- `GET /api/operaciones-disponibles` - Listar operaciones
- `GET /api/operacion/:idOperacion` - Info de operación
- `GET /api/variables` - Listar variables
- `GET /api/variables-operacion/:idOperacion` - Variables de operación
- `GET /api/series-operacion/:idOperacion` - Series de operación
- `GET /api/tablas-operacion/:idOperacion` - Tablas de operación

Documentación completa en: `http://localhost:3000/api-docs`

## 📝 Parámetros Comunes

### Idioma
- `ES`: Español (por defecto)
- `EN`: Inglés

### Nivel de Detalle (det)
- `0`: Básico
- `1`: Medio
- `2`: Completo

### Tipo de Respuesta (tip)
- `A`: Amigable (legible)
- `M`: Con metadatos
- `AM`: Amigable con metadatos

### Periodicidad (p)
- `1`: Mensual
- `3`: Trimestral
- `6`: Semestral
- `12`: Anual

## 🔍 Ejemplos de Consultas desde curl

```bash
# Obtener últimos datos del IPC
curl -X POST http://localhost:3000/mcp/v1 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "ine_datos_serie",
      "arguments": {"idSerie": "IPC251856", "nult": 1}
    },
    "id": 1
  }'

# Listar herramientas disponibles
curl -X POST http://localhost:3000/mcp/v1 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }'
```

## 📚 Recursos

- [API del INE - Documentación oficial](https://www.ine.es/dyngs/DataLab/manual.html?cid=45)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [VS Code AI Toolkit](https://marketplace.visualstudio.com/items?itemName=ms-windows-ai-studio.windows-ai-studio)

## 🛡️ Estructura del Proyecto

```
mcp-ine/
├── src/
│   ├── index.ts              # Servidor principal (HTTP JSON-RPC)
│   ├── server-sse.ts         # Servidor SSE
│   ├── swagger.ts            # Especificación OpenAPI
│   ├── types/
│   │   └── ine.types.ts      # Tipos TypeScript
│   └── services/
│       └── ine-client.ts     # Cliente HTTP para API INE
├── dist/                     # Código compilado
├── package.json
├── tsconfig.json
├── mcp-config.json           # Configuración para AI Toolkit
├── install.sh                # Script de instalación
├── start-server.sh           # Iniciar servidor HTTP
├── start-sse.sh              # Iniciar servidor SSE
└── README.md
```

## 🐛 Troubleshooting

### El servidor no inicia

```bash
# Limpiar y reinstalar
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error de conexión en AI Toolkit

1. Verifica que el servidor esté corriendo: `http://localhost:3000/health`
2. Comprueba que no haya otro proceso usando el puerto 3000
3. Revisa la configuración MCP en AI Toolkit

### Errores de TypeScript

```bash
# Reinstalar tipos
npm install --save-dev @types/node @types/express
npm run build
```

## 📄 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📧 Soporte

Para reportar problemas o sugerencias, abre un issue en el repositorio.

---

Desarrollado con ❤️ para facilitar el acceso a los datos estadísticos del INE de España.
