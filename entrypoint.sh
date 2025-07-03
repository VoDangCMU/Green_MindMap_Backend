#!/bin/sh

# Exit on error
set -e

# Wait for DB (optional)
# ./wait-for-it.sh db:5432 --timeout=30 --strict -- echo "DB is up"

# Run dev or production
if [ "$NODE_ENV" = "production" ]; then
  echo "Starting in production mode..."
  node dist/index.js
else
  echo "Starting in development mode..."
  yarn dev
fi
