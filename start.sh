#!/bin/sh
set -e

# echo "⏳ Iniciando as migrations do banco de dados..."
# node dist/database/migrate.js
# echo "✅ Migrations concluídas com sucesso!"


echo "🚀 Iniciando a aplicação Node.js..."

exec node dist/index.js