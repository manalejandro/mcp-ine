# MCP INE Server — Resumen del Proyecto

Servidor **Model Context Protocol** para consultar las estadísticas del
**Instituto Nacional de Estadística (INE)** de España, preparado para desplegar en
**Cloudflare Workers** bajo el dominio `mcp-ine.manalejandro.com`.

## ✅ Implementación

### 📁 Estructura

```
mcp-ine/
├── src/
│   ├── worker.ts              # Entrada del Cloudflare Worker: MCP JSON-RPC + SSE
│   ├── mcp.ts                 # Dispatch compartido de las herramientas MCP
│   ├── index.ts               # Servidor Node/Express local (JSON-RPC)
│   ├── server-sse.ts          # Servidor Node/Express local (SSE)
│   ├── swagger.ts             # Especificación OpenAPI (servidor local)
│   ├── examples.ts            # Ejemplos ejecutables
│   ├── services/ine-client.ts # Cliente API del INE (fetch estándar + caché TTL)
│   ├── tools.ts               # Definición de las 24 herramientas
│   └── types/ine.types.ts     # Tipos TypeScript
├── test/smoke.mjs             # Pruebas de protocolo y datos reales
├── wrangler.toml              # Config de Cloudflare Workers (dominio custom)
├── mcp-config.json            # Configuración MCP (remote http/sse, local)
├── API.txt                    # Referencia oficial de la API del INE
├── README.md · QUICKSTART.md  # Documentación
└── package.json · tsconfig.json
```

### 🎯 Características

1. **24 herramientas MCP** = las 24 funciones de la API pública del INE:
   - Datos: `ine_datos_tabla`, `ine_datos_serie`, `ine_datos_metadata_operacion`
   - Operaciones: `ine_operaciones_disponibles`, `ine_operacion`
   - Variables: `ine_variables`, `ine_variables_operacion`, `ine_valores_variable`,
     `ine_valores_variable_operacion`, `ine_valores_hijos`
   - Series: `ine_serie`, `ine_series_operacion`, `ine_series_tabla`,
     `ine_serie_metadata_operacion`, `ine_valores_serie`
   - Tablas: `ine_tablas_operacion`, `ine_grupos_tabla`, `ine_valores_grupos_tabla`
   - Metadatos: `ine_periodicidades`, `ine_publicaciones`, `ine_publicaciones_operacion`,
     `ine_publicacion_fecha_publicacion`, `ine_clasificaciones`, `ine_clasificaciones_operacion`

2. **Dos transportes en el Worker**:
   - `POST /mcp` — JSON-RPC 2.0 (Streamable HTTP), recomendado para opencode.
   - `GET /sse` — SSE clásico para clientes legacy (Claude Desktop, Cursor…).

3. **Sin errores de timeout**: todas las peticiones responden de inmediato
   (JSON, SSE o `202`). Incluye timeout de 25 s + caché de 10 min para el INE.

4. **Compatible Workers**: solo APIs web estándar (`fetch`, `ReadableStream`,
   `AbortController`); sin Node en el bundle del Worker (~61 KiB).

5. **Node/Express local** conservado para desarrollo y modo `stdio`.

## 🧪 Pruebas (todas superadas)

- Handshake `initialize` y negociación de versión de protocolo.
- `tools/list` → 24 herramientas; `ping`; errores JSON-RPC (`-32700`, `-32600`, `-32601`).
- Notificaciones → `202`; CORS preflight → `204`.
- SSE clásico: evento `endpoint` + reenvío de respuestas por el stream.
- Datos reales del INE: IPC (`ine_datos_serie`), operaciones, provincias
  (`ine_valores_variable 115`), jerarquías (`ine_valores_hijos`), tablas, series,
  publicaciones, clasificaciones, grupos… (15 herramientas verificadas en vivo).
- Conexión real con el SDK oficial `@modelcontextprotocol/sdk` sobre `wrangler dev`.

```bash
node test/smoke.mjs          # protocolo (sin red)
node test/smoke.mjs --live   # + consultas reales al INE
```

## 🚀 Despliegue

```bash
npm install
npm run build
npm run deploy        # wrangler deploy -> mcp-ine.manalejandro.com
npm run dev:worker    # prueba local en http://localhost:8787
```

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/manalejandro/mcp-ine)

## 🌐 URLs

- MCP JSON-RPC: `https://mcp-ine.manalejandro.com/mcp`
- MCP SSE: `https://mcp-ine.manalejandro.com/sse`
- Health: `https://mcp-ine.manalejandro.com/health`
- Local: `http://localhost:3000/mcp/v1`

## 📚 Referencia

- [API del INE](https://www.ine.es/dyngs/DataLab/manual.html?cid=45)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
