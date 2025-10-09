#!/bin/bash

# Script para iniciar el servidor MCP INE en modo HTTP

echo "🚀 Iniciando MCP INE Server (HTTP JSON-RPC)..."

# Verificar si está compilado
if [ ! -d "dist" ]; then
  echo "📦 Compilando el proyecto..."
  npm run build
fi

# Iniciar servidor
echo "🔧 Servidor escuchando en puerto 3000"
echo "📚 Documentación: http://localhost:3000/api-docs"
echo "🔌 Endpoint MCP: http://localhost:3000/mcp/v1"
echo ""

npm start
