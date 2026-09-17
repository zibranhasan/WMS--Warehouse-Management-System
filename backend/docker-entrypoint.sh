#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting backend server as node user..."
exec su-exec node node dist/server.js
