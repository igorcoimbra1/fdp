#!/bin/bash

# Script para iniciar o servidor FDP
echo "🚀 Iniciando servidor FDP..."

# Parar processos existentes na porta 3000
echo "🔍 Verificando processos na porta 3000..."
PIDS=$(lsof -ti:3000 2>/dev/null || true)

if [ ! -z "$PIDS" ]; then
    echo "⚠️  Matando processos existentes: $PIDS"
    echo $PIDS | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Iniciar o servidor
echo "🎮 Iniciando servidor na porta 3000..."
node server.js
