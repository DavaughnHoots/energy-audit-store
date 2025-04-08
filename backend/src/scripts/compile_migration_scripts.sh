#!/bin/bash

# Compile the migration scripts
echo "Compiling migration scripts..."

# Navigate to the backend directory
cd "$(dirname "$0")/../.."

# Compile TypeScript files
npx tsc --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir build src/scripts/run_product_preferences_migration.ts src/scripts/heroku_product_preferences_migration.ts

# Make the compiled scripts executable
chmod +x build/src/scripts/run_product_preferences_migration.js
chmod +x build/src/scripts/heroku_product_preferences_migration.js

echo "Migration scripts compiled successfully"
