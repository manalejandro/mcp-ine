# Configuración para VS Code AI Toolkit

## Cómo Configurar el Servidor MCP INE en AI Toolkit

### Opción 1: HTTP JSON-RPC (Recomendado) 🎯

1. **Inicia el servidor MCP INE**:
   ```bash
   cd /home/ale/projects/mcp/mcp-ine
   npm start
   ```

2. **Abre VS Code AI Toolkit**:
   - Presiona `Ctrl+Shift+P` (o `Cmd+Shift+P` en Mac)
   - Busca: **"AI Toolkit: Configure MCP Servers"**

3. **Agrega esta configuración**:
   ```json
   {
     "mcpServers": {
       "ine-spain": {
         "url": "http://localhost:3000/mcp/v1",
         "transport": "http",
         "description": "API del Instituto Nacional de Estadística (INE) de España - 24 herramientas para consultar datos estadísticos"
       }
     }
   }
   ```

4. **Reinicia AI Toolkit** y verifica que aparezca "ine-spain" con 24 herramientas

### Opción 2: Server-Sent Events (SSE)

1. **Inicia el servidor SSE**:
   ```bash
   cd /home/ale/projects/mcp/mcp-ine
   npm run start:sse
   ```

2. **Configuración en AI Toolkit**:
   ```json
   {
     "mcpServers": {
       "ine-spain-sse": {
         "url": "http://localhost:3001/sse",
         "transport": "sse",
         "description": "API INE España via SSE"
       }
     }
   }
   ```

### Opción 3: stdio (Comunicación Directa)

Esta opción NO requiere iniciar el servidor manualmente.

**Configuración en AI Toolkit**:
```json
{
  "mcpServers": {
    "ine-spain-stdio": {
      "command": "node",
      "args": [
        "dist/index.js",
        "--stdio"
      ],
      "cwd": "/home/ale/projects/mcp/mcp-ine",
      "description": "API INE España via stdio",
      "env": {}
    }
  }
}
```

## Verificar que Funciona

### 1. Verifica el Estado del Servidor (HTTP/SSE)

```bash
# Para HTTP (puerto 3000)
curl http://localhost:3000/health

# Para SSE (puerto 3001)
curl http://localhost:3001/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-10-09T01:02:33.658Z",
  "service": "MCP INE Server"
}
```

### 2. Lista las Herramientas Disponibles

```bash
curl -X POST http://localhost:3000/mcp/v1 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' \
  | python3 -m json.tool | grep '"name"' | wc -l
```

Debe devolver: **24** (número de herramientas)

### 3. Prueba una Consulta Real

```bash
curl -X POST http://localhost:3000/mcp/v1 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"ine_datos_serie",
      "arguments":{
        "idSerie":"IPC251856",
        "nult":1,
        "tip":"A"
      }
    },
    "id":1
  }' | python3 -m json.tool
```

## Ejemplos de Consultas en AI Toolkit

Una vez configurado, puedes hacer estas preguntas en el chat:

### Consultas Básicas

```
¿Cuál es el último valor del IPC en España?

Dame los últimos 12 meses del IPC

¿Qué operaciones estadísticas tiene disponibles el INE?
```

### Consultas Específicas

```
Obtén los datos de la tabla 50902 de los últimos 5 períodos

¿Qué variables tiene la operación IPC?

Lista las series de la operación EPA (Encuesta de Población Activa)
```

### Consultas con Filtros

```
Busca datos del IPC para Madrid (provincia 29) con variación mensual

Dame los grupos ECOICOP disponibles para el IPC

¿Cuáles son las provincias de Andalucía en los datos del INE?
```

### Consultas de Metadatos

```
¿Qué periodicidades están disponibles en el INE?

Lista las publicaciones de la operación IPC

Dame información detallada sobre la operación del IPC
```

## Solución de Problemas

### El servidor no aparece en AI Toolkit

1. Verifica que el servidor esté corriendo:
   ```bash
   curl http://localhost:3000/health
   ```

2. Si no responde, inicia el servidor:
   ```bash
   cd /home/ale/projects/mcp/mcp-ine
   npm start
   ```

3. Reinicia VS Code completamente

4. Verifica la configuración JSON (sin errores de sintaxis)

### Error "Cannot connect to MCP server"

1. Comprueba que no haya otro proceso usando el puerto:
   ```bash
   netstat -tuln | grep 3000
   ```

2. Si hay otro proceso, mátalo o cambia el puerto:
   ```bash
   PORT=3005 npm start
   ```
   
   Y actualiza la URL en la configuración:
   ```json
   "url": "http://localhost:3005/mcp/v1"
   ```

### El servidor se cierra solo

Ejecuta el servidor en modo background o en una terminal separada:

```bash
# Terminal 1: Servidor
cd /home/ale/projects/mcp/mcp-ine
npm start

# Terminal 2: VS Code
code .
```

O usa `nohup`:
```bash
nohup npm start > server.log 2>&1 &
```

### Las herramientas no aparecen

1. Verifica que la URL sea correcta (debe terminar en `/mcp/v1`)
2. Verifica que el servidor responda:
   ```bash
   curl -X POST http://localhost:3000/mcp/v1 \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
   ```
3. Revisa los logs del servidor en la terminal

### Error de certificados SSL (si usas HTTPS)

Para desarrollo local, usa HTTP (no HTTPS):
```json
"url": "http://localhost:3000/mcp/v1"
```

## Documentación Adicional

- **Swagger UI**: http://localhost:3000/api-docs
- **README completo**: `/home/ale/projects/mcp/mcp-ine/README.md`
- **Guía rápida**: `/home/ale/projects/mcp/mcp-ine/QUICKSTART.md`
- **API INE oficial**: https://www.ine.es/dyngs/DataLab/manual.html?cid=45

## Contacto y Soporte

- **GitHub Issues**: Para reportar problemas
- **Documentación**: Ver README.md y QUICKSTART.md
- **API INE**: https://www.ine.es

---

💡 **Consejo**: Mantén el servidor corriendo en una terminal separada mientras usas AI Toolkit para evitar interrupciones.
