#!/bin/bash

if [ -z "$1" ]; then
    echo "Error: Migration name is required"
    echo "Usage: ./generate_migration.sh <MigrationName>"
    echo "Example: ./generate_migration.sh InitDB"
    exit 1
fi

MIGRATION_NAME="$1"

echo "Generating migration: $MIGRATION_NAME"
echo "Running command: npm run migration:generate $MIGRATION_NAME"

npm run migration:generate "$MIGRATION_NAME"

if [ $? -eq 0 ]; then
    echo "Migration '$MIGRATION_NAME' generated successfully!"
else
    echo "Failed to generate migration '$MIGRATION_NAME'"
    exit 1
fi
