# MCP INE Server

Servidor **Model Context Protocol (MCP)** para consultar los datos estadísticos del
**Instituto Nacional de Estadística (INE)** de España, listo para desplegar en
**Cloudflare Workers** y usar con **opencode**, Claude Desktop, VS Code AI Toolkit,
Cursor o cualquier cliente MCP.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/manalejandro/mcp-ine)

---

## ✨ Características

- **24 herramientas MCP** que cubren las 24 funciones de la API pública del INE (`servicios.ine.es/wstempus/js`).
- **Desplegable en Cloudflare Workers** (sin servidor, sin coste fijo, TLS automático).
- **Dos transportes MCP**:
  - **Streamable HTTP / JSON-RPC** → `POST /mcp` (recomendado para opencode).
  - **SSE clásico** → `GET /sse` (compatible con Claude Desktop, Cursor, etc.).
- **Cero errores de timeout**: cada petición recibe siempre una respuesta inmediata
  (JSON, SSE o `202 Accepted` para notificaciones). El runtime de Workers nunca cancela
  peticiones colgadas.
- **Timeout de 25 s y caché en memoria (10 min)** para el acceso al INE: respuestas más
  rápidas y menos riesgo de rate-limiting.
- **Sin dependencias de Node en el Worker**: usa solo APIs web estándar (`fetch`, `ReadableStream`, `AbortController`).
- También conserva un **servidor Node/Express local** para desarrollo y modo `stdio`.

---

## 🌐 Datos disponibles

El INE ofrece datos oficiales de España organizados en **operaciones** estadísticas:

| Área | Ejemplos |
|---|---|
| 📊 Demografía y población | Cifras de población, censos, migraciones |
| 💰 Economía | IPC (inflación), PIB, comercio exterior, empresas |
| 👷 Empleo | EPA (paro y empleo), salarios, condiciones de trabajo |
| 🏢 Empresas y comercio | Sociedades mercantiles, hipotecas, turismo |
| 📚 Educación y sociedad | Condiciones de vida (ECV), educación, salud |
| 🌾 Agricultura y medio ambiente | Agricultura, energía, medio ambiente |

> **Importante**: el INE **no** incluye datos de criminalidad. Para eso consulta el
> [Portal Estadístico de Criminalidad del Ministerio del Interior](https://estadisticasdecriminalidad.ses.mir.es/).

Operaciones más usadas: `IPC`, `EPA`, `PIB` (o `CNE`), `CIFRAS_POB`, `ECV`, `DEFUNCIONES`, `NACIMIENTOS`, `COMERCIO_EXT`, `HIPOTECAS`.

---

## 🚀 Despliegue en Cloudflare Workers

### Opción A — Botón (1 clic)

Pulsa el botón de arriba y sigue el asistente de Cloudflare. Necesitarás el repo
público y una cuenta de Cloudflare gratuita.

### Opción B — CLI con `wrangler`

```bash
# 1. Requisitos: Node 18+, cuenta de Cloudflare y autenticación
npm install -g wrangler
npx wrangler login

# 2. Instalar dependencias y compilar
npm install
npm run build

# 3. Verificar localmente antes de desplegar (http://localhost:8787)
npm run dev:worker

# 4. Configurar el dominio personalizado (edita wrangler.toml)
#    routes = [ { pattern = "mcp-ine.manalejandro.com", custom_domain = true } ]

# 5. Desplegar
npm run deploy
```

`npm run deploy` ejecuta `wrangler deploy`, que publica el Worker y enlaza el
dominio personalizado. Después puedes comprobar:

```bash
curl https://mcp-ine.manalejandro.com/health
```

---

## 🔌 Configuración en tu cliente MCP

### opencode (JSON-RPC / Streamable HTTP)

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

### Configuración local (desarrollo)

```json
{
  "mcpServers": {
    "ine": { "url": "http://localhost:3000/mcp/v1", "transport": "http" }
  }
}
```

---

## 🔗 URLs del servicio desplegado

| Recurso | URL |
|---|---|
| MCP JSON-RPC | `https://mcp-ine.manalejandro.com/mcp` |
| MCP SSE | `https://mcp-ine.manalejandro.com/sse` |
| Health check | `https://mcp-ine.manalejandro.com/health` |
| Página de información | `https://mcp-ine.manalejandro.com/` |
| API REST | `https://mcp-ine.manalejandro.com/api/...` |

---

## 🛠️ Herramientas MCP (24)

### Datos estadísticos
- `ine_datos_tabla` — datos de una tabla (ej: `50902`)
- `ine_datos_serie` — datos históricos de una serie (ej: `IPC251856`)
- `ine_datos_metadata_operacion` — datos de series con filtros avanzados (`g1`..`g5`)

### Operaciones
- `ine_operaciones_disponibles` — lista todas las operaciones
- `ine_operacion` — metadatos de una operación (ej: `IPC`)

### Variables y valores
- `ine_variables`, `ine_variables_operacion`
- `ine_valores_variable`, `ine_valores_variable_operacion`
- `ine_valores_hijos` — valores jerárquicos (ej: provincias de una CCAA)

### Series temporales
- `ine_serie`, `ine_series_operacion`, `ine_series_tabla`
- `ine_serie_metadata_operacion`, `ine_valores_serie`

### Tablas
- `ine_tablas_operacion`, `ine_grupos_tabla`, `ine_valores_grupos_tabla`

### Metadatos
- `ine_periodicidades`, `ine_publicaciones`, `ine_publicaciones_operacion`
- `ine_publicacion_fecha_publicacion`, `ine_clasificaciones`, `ine_clasificaciones_operacion`

---

## 📖 Ejemplos de uso

### Con curl (JSON-RPC)

```bash
# Handshake
curl -X POST https://mcp-ine.manalejandro.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05"},"id":1}'

# Listar herramientas
curl -X POST https://mcp-ine.manalejandro.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'

# Últimos datos del IPC
curl -X POST https://mcp-ine.manalejandro.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"ine_datos_serie","arguments":{"idSerie":"IPC251856","nult":12,"tip":"A"}},"id":3}'
```

### Con curl (SSE)

```bash
curl -N https://mcp-ine.manalejandro.com/sse
#   → event: endpoint
#     data: /message?sessionId=<id>
```

### Con opencode (chat)

```
¿Cuál es el último valor del IPC en España?
¿Qué operaciones estadísticas tiene el INE sobre población?
Dame los datos de la tabla 50902 de los últimos 5 periodos
¿Cuáles son las variables disponibles para la operación IPC?
```

---

## 🐛 Desarrollo local

```bash
npm install        # instalar dependencias (compila en prepare)
npm start          # servidor HTTP JSON-RPC en http://localhost:3000
npm run dev        # con recarga automática (tsx watch)
node dist/index.js --stdio   # modo stdio
npm run start:sse  # servidor SSE en http://localhost:3001
npm run dev:worker # Worker local con wrangler (http://localhost:8787)
npm run build      # compilar TypeScript
```

---

## 🗂️ Estructura del proyecto

```
mcp-ine/
├── src/
│   ├── worker.ts              # Entrada del Cloudflare Worker (MCP JSON-RPC + SSE)
│   ├── mcp.ts                 # Lógica MCP compartida (dispatch de herramientas)
│   ├── index.ts               # Servidor Node/Express local (JSON-RPC)
│   ├── server-sse.ts          # Servidor Node/Express SSE local
│   ├── services/
│   │   └── ine-client.ts      # Cliente de la API del INE (fetch estándar + caché)
│   ├── tools.ts               # Definición de las 24 herramientas
│   ├── types/ine.types.ts     # Tipos TypeScript
│   ├── swagger.ts             # Especificación OpenAPI (servidor local)
│   └── examples.ts            # Ejemplos ejecutables
├── test/
│   └── smoke.mjs              # Pruebas de protocolo y datos reales del INE
├── wrangler.toml              # Configuración de Cloudflare Workers
├── mcp-config.json            # Configuración MCP para clientes
├── API.txt                    # Referencia oficial de la API del INE
├── package.json
└── tsconfig.json
```

---

## 🧪 Pruebas

```bash
# Protocolo (initialize, tools/list, ping, SSE, errores) — sin red
node test/smoke.mjs

# Además, consultas reales a la API del INE
node test/smoke.mjs --live
```

Las pruebas cubren: handshake, negociación de versión del protocolo, listado de las
24 herramientas, llamadas a herramientas reales (IPC, operaciones, variables,
jerarquías…), transportes JSON-RPC y SSE, y respuestas de error (nunca cuelgan).

---

## 📚 Recursos

- [API del INE — documentación oficial](https://www.ine.es/dyngs/DataLab/manual.html?cid=45)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Documentación de opencode sobre MCP](https://opencode.ai/docs/mcp-servers/)

---

## 📄 Licencia

MIT

---

Desarrollado para facilitar el acceso a los datos estadísticos del **INE de España**
mediante el protocolo **MCP**.
