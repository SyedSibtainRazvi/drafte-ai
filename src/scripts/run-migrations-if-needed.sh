#!/bin/bash
# Only run migrations if DATABASE_URL is not the dummy CI value
if [ "$DATABASE_URL" != "postgresql://dummy:dummy@localhost:5432/dummy" ]; then
  echo "Running database migrations..."
  npx prisma migrate deploy
else
  echo "Skipping migrations (CI environment with dummy DATABASE_URL)"
fi
