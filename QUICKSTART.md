# Guía rápida — MCP INE Server

Servidor MCP para los datos del **INE de España**, desplegado en **Cloudflare Workers**
y conectable desde **opencode**, Claude Desktop, Cursor o VS Code AI Toolkit.

---

## 1. Usar el servidor desplegado

El servicio ya está publicado en:

| Transporte | URL |
|---|---|
| **JSON-RPC (Streamable HTTP)** | `https://mcp-ine.manalejandro.com/mcp` |
| **SSE** | `https://mcp-ine.manalejandro.com/sse` |

### opencode

Añade esto a tu `opencode.json` (o `opencode.jsonc`):

```json
{
  "mcp": {
    "ine": {
      "type": "remote",
      "url": "https://mcp-ine.manalejandro.com/mcp",
      "enabled": true
    }
  }
}
```

### Claude Desktop / Cursor / AI Toolkit (SSE)

```json
{
  "mcpServers": {
    "ine": {
      "url": "https://mcp-ine.manalejandro.com/sse",
      "transport": "sse"
    }
  }
}
```

### Verificar la conexión

```bash
curl https://mcp-ine.manalejandro.com/health
# → {"status":"ok","tools":24,...}

curl -X POST https://mcp-ine.manalejandro.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
# → 24 herramientas
```

---

## 2. Desplegar en Cloudflare Workers

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/manalejandro/mcp-ine)

O manualmente con wrangler:

```bash
npm install
npm run build
npx wrangler login
npm run deploy          # publica en el dominio mcp-ine.manalejandro.com
```

Para usar otro dominio, edita `routes` en `wrangler.toml`.

---

## 3. Desarrollo local

```bash
npm install
npm start                       # http://localhost:3000/mcp/v1
npm run dev:worker              # http://localhost:8787 (Worker simulado)
node test/smoke.mjs --live      # pruebas contra la API real del INE
```

---

## 4. Ejemplos de consultas

```
¿Cuál es el último valor del IPC en España?
Dame los últimos 12 meses del IPC con formato amigable
¿Qué operaciones estadísticas tiene disponibles el INE?
Dame los datos de la tabla 50902 de los últimos 3 periodos
¿Qué variables tiene la operación EPA?
¿Cuáles son las provincias de Andalucía en los datos del INE?
```

## 5. Parámetros comunes

- **idioma**: `ES` (predeterminado) | `EN`
- **det**: `0` básico | `1` medio | `2` completo
- **tip**: `A` amigable | `M` metadatos | `AM` ambos
- **p** (periodicidad): `1` mensual | `3` trimestral | `6` semestral | `12` anual
- **nult**: últimos N periodos
- **tv / g1..g5**: filtros `ID_VARIABLE:ID_VALOR`

---

## Recursos

- [README completo](./README.md)
- [API del INE](https://www.ine.es/dyngs/DataLab/manual.html?cid=45)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [opencode MCP](https://opencode.ai/docs/mcp-servers/)
