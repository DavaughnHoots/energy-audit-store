#!/bin/bash

# Build frontend
echo "Building frontend..."
npm install
npm run build

# Move frontend build to backend
echo "Moving frontend build to backend..."
mkdir -p backend/build/public
cp -r dist/* backend/build/public/
# Ensure proper permissions
chmod -R 755 backend/build/public

# Create a symlink for backward compatibility
echo "Creating symlink for backward compatibility..."
cd backend/build
ln -sf public dist
cd ../..

# Debug: List directory contents
echo "Listing backend/build directory contents:"
ls -la backend/build
echo "Listing backend/build/public directory contents:"
ls -la backend/build/public

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
