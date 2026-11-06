#!/bin/sh
set -e

echo "=================================================="
echo "📦 Starting BorrowBox Backend Container Service"
echo "=================================================="

# Wait for PostgreSQL database to accept TCP connections
echo "⏳ Waiting for PostgreSQL connection..."
until node -e "
import('net').then(({ default: net }) => {
  const url = process.env.DATABASE_URL || '';
  const match = url.match(/@([^:]+):(\d+)/);
  const host = match ? match[1] : (process.env.DB_HOST || 'postgres');
  const port = match ? parseInt(match[2], 10) : parseInt(process.env.DB_PORT || '5432', 10);
  const socket = net.createConnection({ host, port }, () => {
    socket.end();
    process.exit(0);
  });
  socket.on('error', () => process.exit(1));
  setTimeout(() => { socket.destroy(); process.exit(1); }, 2000);
}).catch(() => process.exit(1));
" 2>/dev/null; do
  echo "Database is starting up... retrying in 2 seconds"
  sleep 2
done

echo "✅ PostgreSQL is reachable!"

# Apply Prisma migrations to the container database
echo "🔄 Running Prisma migrations (migrate deploy)..."
npx prisma migrate deploy

# Seed initial demo personas and sample items idempotently
echo "🌱 Running idempotent database seed..."
node prisma/seed.js

echo "🚀 Launching BorrowBox Express & Socket.IO server..."
exec "$@"

