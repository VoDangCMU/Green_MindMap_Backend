#!/bin/sh

# Exit on error
set -e

# Run dev or production
if [ "$NODE_ENV" = "production" ]; then
  echo "Starting in production mode..."
  node dist/index.js
else
  echo "Starting in development mode..."
  yarn dev
fi
