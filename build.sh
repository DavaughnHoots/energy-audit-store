#!/bin/bash

# Build frontend
echo "Building frontend..."
npm install
npm run build

# Move frontend build to backend
echo "Moving frontend build to backend..."
mkdir -p backend/build/public
cp -r dist/* backend/build/public/

# Create a symlink for backward compatibility
echo "Creating symlink for backward compatibility..."
cd backend/build
ln -sf public dist
cd ../..

# Copy data files
echo "Copying data files..."
mkdir -p backend/build/public/data
cp -r public/data/* backend/build/public/data/

# Build backend
echo "Building backend..."
cd backend
npm install --production
npm run build

echo "Build completed successfully"
