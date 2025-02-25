#!/bin/bash

# Exit on error
set -e

echo "Building frontend..."
npm install
npm run build

echo "Moving frontend build to backend..."
mkdir -p backend/dist
cp -r dist/* backend/dist/

echo "Building backend..."
cd backend
npm install --production
npm run build

echo "Build completed successfully"
