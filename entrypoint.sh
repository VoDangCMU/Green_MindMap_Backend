#!/bin/sh

# Exit on error
set -e

echo "Running database migrations..."
npm run migration:run

# Run dev or production
if [ "$NODE_ENV" = "production" ]; then
  echo "Starting in production mode..."
  node dist/index.js
else
  echo "Starting in development mode..."
  yarn dev
fi
