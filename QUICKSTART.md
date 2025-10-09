# Guía Rápida de Configuración para VS Code AI Toolkit

## Configuración del Servidor MCP INE

### Paso 1: Iniciar el Servidor

Abre una terminal en la carpeta `mcp-ine` y ejecuta:

```bash
npm start
```

El servidor iniciará en `http://localhost:3000`

### Paso 2: Configurar AI Toolkit

1. Abre VS Code
2. Instala la extensión **AI Toolkit** (si no la tienes)
3. Presiona `Ctrl+Shift+P` (o `Cmd+Shift+P` en Mac)
4. Busca: **"AI Toolkit: Configure MCP Servers"**
5. Agrega la siguiente configuración:

```json
{
  "mcpServers": {
    "ine-spain": {
      "url": "http://localhost:3000/mcp/v1",
      "transport": "http",
      "description": "API Estadísticas INE España"
    }
  }
}
```

### Paso 3: Verificar Conexión

En AI Toolkit, deberías ver el servidor "ine-spain" activo con las 24 herramientas disponibles.

## Ejemplos de Consultas en el Chat

Una vez configurado, puedes hacer preguntas directamente:

### Consultas sobre el IPC

```
¿Cuál es el último valor del IPC en España?

Dame los últimos 12 meses del IPC con formato amigable

¿Cuál ha sido la variación mensual del IPC en los últimos 6 meses?
```

### Consultas sobre Operaciones

```
¿Qué operaciones estadísticas tiene disponibles el INE?

Lista las operaciones relacionadas con población

Dame información sobre la operación IPC
```

### Consultas sobre Datos Específicos

```
Obtén los datos de la tabla 50902 de los últimos 3 períodos

¿Qué variables tiene la operación EPA (Encuesta de Población Activa)?

Dame las series de la operación IPC con periodicidad mensual
```

### Consultas con Filtros

```
Busca datos del IPC para Madrid con variación mensual

Dame los grupos ECOICOP del IPC

¿Qué provincias tiene disponibles la variable 115?
```

## Herramientas MCP Disponibles

### 🔢 Datos
- `ine_datos_tabla`: Datos de tablas
- `ine_datos_serie`: Datos de series temporales
- `ine_datos_metadata_operacion`: Datos con filtros avanzados

### 📊 Operaciones
- `ine_operaciones_disponibles`: Lista de operaciones
- `ine_operacion`: Info de operación específica

### 📈 Series
- `ine_serie`: Info de serie
- `ine_series_operacion`: Series de una operación
- `ine_series_tabla`: Series de una tabla
- `ine_valores_serie`: Variables de una serie
- `ine_serie_metadata_operacion`: Búsqueda avanzada

### 📋 Tablas
- `ine_tablas_operacion`: Tablas de una operación
- `ine_grupos_tabla`: Grupos de una tabla
- `ine_valores_grupos_tabla`: Valores de grupos

### 🏷️ Variables
- `ine_variables`: Lista de variables
- `ine_variables_operacion`: Variables de operación
- `ine_valores_variable`: Valores de variable
- `ine_valores_variable_operacion`: Valores en operación
- `ine_valores_hijos`: Valores jerárquicos

### 📚 Metadatos
- `ine_periodicidades`: Periodicidades disponibles
- `ine_publicaciones`: Lista de publicaciones
- `ine_publicaciones_operacion`: Publicaciones de operación
- `ine_publicacion_fecha_publicacion`: Fechas de publicación
- `ine_clasificaciones`: Clasificaciones
- `ine_clasificaciones_operacion`: Clasificaciones de operación

## Códigos de Operaciones Comunes

- **IPC**: Índice de Precios de Consumo
- **EPA**: Encuesta de Población Activa
- **CNE**: Contabilidad Nacional
- **30138**: IPC (código IOE)
- **30308**: EPA (código IOE)

## Códigos de Tablas Comunes

- **50902**: IPC - Índices nacionales: general y de grupos ECOICOP
- **50913**: IPC - Índices por comunidades autónomas

## Parámetros Útiles

### Idioma
- `ES`: Español (predeterminado)
- `EN`: Inglés

### Nivel de Detalle (`det`)
- `0`: Básico
- `1`: Medio  
- `2`: Completo (recomendado para análisis detallado)

### Tipo de Respuesta (`tip`)
- `A`: Formato amigable/legible
- `M`: Con metadatos
- `AM`: Amigable con metadatos (recomendado)

### Periodicidad (`p`)
- `1`: Mensual
- `3`: Trimestral
- `6`: Semestral
- `12`: Anual

## Verificar Estado del Servidor

```bash
# Health check
curl http://localhost:3000/health

# Listar herramientas MCP
curl -X POST http://localhost:3000/mcp/v1 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

## Documentación Swagger

Para explorar la API REST y probar endpoints:

🌐 **http://localhost:3000/api-docs**

## Troubleshooting

### No aparece el servidor en AI Toolkit
1. Verifica que el servidor esté corriendo: `http://localhost:3000/health`
2. Reinicia VS Code
3. Verifica la configuración MCP en AI Toolkit

### Errores de conexión
- Asegúrate de que no hay otro proceso en el puerto 3000
- Usa `netstat -tuln | grep 3000` para verificar

### El servidor no responde
- Verifica los logs de la terminal donde corre el servidor
- Reinicia el servidor con `npm start`

## Modos Alternativos

### Modo SSE (Server-Sent Events)

```bash
npm run start:sse
```

Configuración en AI Toolkit:
```json
{
  "mcpServers": {
    "ine-sse": {
      "url": "http://localhost:3001/sse",
      "transport": "sse"
    }
  }
}
```

### Modo stdio

```bash
node dist/index.js --stdio
```

Configuración en AI Toolkit:
```json
{
  "mcpServers": {
    "ine-stdio": {
      "command": "node",
      "args": ["dist/index.js", "--stdio"],
      "cwd": "/ruta/completa/a/mcp-ine"
    }
  }
}
```

## Recursos Adicionales

- [Documentación API INE](https://www.ine.es/dyngs/DataLab/manual.html?cid=45)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [AI Toolkit Documentation](https://github.com/microsoft/vscode-ai-toolkit)

---

💡 **Tip**: Comienza preguntando por las operaciones disponibles para familiarizarte con los datos del INE.
