#!/bin/bash

# Exit on error
set -e

echo "Installing root dependencies..."
npm install
npm install tailwindcss postcss autoprefixer

echo "Building frontend..."
npm run build

echo "Moving frontend build to backend..."
mkdir -p backend/dist
cp -r dist/* backend/dist/

echo "Installing backend dependencies..."
cd backend
npm install

echo "Building backend..."
npm run build

echo "Build completed successfully"
