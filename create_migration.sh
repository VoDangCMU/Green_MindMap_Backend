#!/bin/bash

if [ -z "$1" ]; then
    echo "Error: Migration name is required"
    echo "Usage: ./create_migration.sh <MigrationName>"
    echo "Example: ./create_migration.sh AddUserTable"
    exit 1
fi

MIGRATION_NAME="$1"

echo "Creating migration: $MIGRATION_NAME"
echo "Running command: npm run migration:create $MIGRATION_NAME"

npm run migration:create "$MIGRATION_NAME"

if [ $? -eq 0 ]; then
    echo "Migration '$MIGRATION_NAME' created successfully!"
else
    echo "Failed to create migration '$MIGRATION_NAME'"
    exit 1
fi
