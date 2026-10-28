#!/bin/sh
set -e

echo "Running database migrations..."
./node_modules/.bin/prisma db push

echo "Starting Next.js on port 3000..."
exec ./node_modules/.bin/next start -p 3000 -H 0.0.0.0
