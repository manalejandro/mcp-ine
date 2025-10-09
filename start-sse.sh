#!/bin/bash

# Script para iniciar el servidor MCP INE en modo SSE

echo "🚀 Iniciando MCP INE Server (SSE)..."

# Verificar si está compilado
if [ ! -d "dist" ]; then
  echo "📦 Compilando el proyecto..."
  npm run build
fi

# Iniciar servidor SSE
echo "🔧 Servidor SSE escuchando en puerto 3001"
echo "📡 Endpoint SSE: http://localhost:3001/sse"
echo ""

npm run start:sse
