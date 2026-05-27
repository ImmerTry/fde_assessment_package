#!/bin/sh
set -e

echo "==> Running prisma db push..."
npx prisma db push --skip-generate

echo "==> Starting Next.js server..."
node server.js
