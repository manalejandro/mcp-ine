#!/bin/bash

# Script de instalación y configuración

echo "📦 Instalando MCP INE Server..."
echo ""

# Instalar dependencias
echo "1️⃣ Instalando dependencias de Node.js..."
npm install

# Compilar TypeScript
echo ""
echo "2️⃣ Compilando TypeScript..."
npm run build

# Hacer scripts ejecutables
chmod +x start-server.sh
chmod +x start-sse.sh

echo ""
echo "✅ Instalación completada!"
echo ""
echo "Para iniciar el servidor, usa uno de estos comandos:"
echo "  - Modo HTTP JSON-RPC: ./start-server.sh  o  npm start"
echo "  - Modo SSE:          ./start-sse.sh     o  npm run start:sse"
echo "  - Modo stdio:        node dist/index.js --stdio"
echo ""
echo "Documentación Swagger estará disponible en:"
echo "  http://localhost:3000/api-docs"
echo ""
