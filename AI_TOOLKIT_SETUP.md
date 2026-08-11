# Configuración para VS Code AI Toolkit

Conecta el servidor **MCP INE** a VS Code AI Toolkit usando el servicio desplegado
en **Cloudflare Workers** o un servidor local.

---

## Opción 1: Servicio remoto (Cloudflare Workers) — recomendada 🎯

Sin iniciar nada: el servidor ya está publicado en `mcp-ine.manalejandro.com`.

### HTTP JSON-RPC

```json
{
  "mcpServers": {
    "ine": {
      "url": "https://mcp-ine.manalejandro.com/mcp",
      "transport": "http",
      "description": "API del Instituto Nacional de Estadística (INE) de España - 24 herramientas"
    }
  }
}
```

### SSE (Server-Sent Events)

```json
{
  "mcpServers": {
    "ine-sse": {
      "url": "https://mcp-ine.manalejandro.com/sse",
      "transport": "sse",
      "description": "API del INE de España vía SSE"
    }
  }
}
```

1. En VS Code: `Ctrl+Shift+P` → **"AI Toolkit: Configure MCP Servers"**.
2. Pega la configuración y **reinicia AI Toolkit**.
3. Verifica que aparezca "ine" con **24 herramientas**.

---

## Opción 2: Servidor local (Node)

```bash
cd mcp-ine
npm install
npm start   # http://localhost:3000
```

```json
{
  "mcpServers": {
    "ine": {
      "url": "http://localhost:3000/mcp/v1",
      "transport": "http",
      "description": "API del INE de España (local)"
    }
  }
}
```

---

## Verificar que funciona

```bash
# Servicio remoto
curl https://mcp-ine.manalejandro.com/health

# Listar herramientas
curl -X POST https://mcp-ine.manalejandro.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

Respuesta esperada: `"status":"ok"` y **24 herramientas**.

---

## Ejemplos de consultas

```
¿Cuál es el último valor del IPC en España?
Dame los últimos 12 meses del IPC
¿Qué operaciones estadísticas tiene disponibles el INE?
¿Qué variables tiene la operación IPC?
Busca datos del IPC para Madrid (provincia 29) con variación mensual
¿Cuáles son las provincias de Andalucía en los datos del INE?
¿Qué periodicidades están disponibles en el INE?
```

---

## Solución de problemas

| Problema | Solución |
|---|---|
| No aparece el servidor | Verifica `https://mcp-ine.manalejandro.com/health`; reinicia VS Code |
| No hay herramientas | Revisa que la URL termine en `/mcp` (http) o `/sse` (sse) |
| Error de conexión local | Comprueba que `npm start` esté corriendo y el puerto 3000 libre |

## Documentación adicional

- [README completo](./README.md)
- [Guía rápida](./QUICKSTART.md)
- [API del INE](https://www.ine.es/dyngs/DataLab/manual.html?cid=45)
