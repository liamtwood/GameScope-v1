#!/bin/bash
set -e

npm install --legacy-peer-deps
npm run db:push
npx tsx server/seed-hemp.ts
