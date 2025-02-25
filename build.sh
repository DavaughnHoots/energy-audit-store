#!/bin/bash

# Exit on error
set -e

echo "Building frontend..."
npm install
NODE_OPTIONS="--max_old_space_size=4096" npm run build

echo "Moving frontend build to backend..."
mkdir -p backend/dist
cp -r dist/* backend/dist/

echo "Building backend..."
cd backend
npm install --production

# Set memory options for TypeScript compilation
export NODE_OPTIONS="--max_old_space_size=4096"

# Run the build in smaller chunks to avoid memory issues
echo "Cleaning build directory..."
rimraf build

echo "Running TypeScript compilation..."
tsc

echo "Copying migration files..."
mkdir -p build/migrations
cp -r src/migrations/* build/migrations/

echo "Copying config files..."
mkdir -p build/config
cp -r src/config/* build/config/

echo "Build completed successfully"
