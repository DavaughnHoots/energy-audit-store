#!/bin/bash

# Check if we're in production mode
if [ "$NODE_ENV" = "production" ]; then
  echo "Running production build..."
  PRODUCTION_BUILD=true
else
  echo "Running development build..."
  PRODUCTION_BUILD=false
fi

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

# Create additional symlinks to ensure files are found
echo "Creating additional symlinks for compatibility..."
mkdir -p backend/public
cp -r dist/* backend/public/
chmod -R 755 backend/public

# Copy data files
echo "Copying data files..."
mkdir -p backend/build/public/data
cp -r public/data/* backend/build/public/data/

# Build backend
echo "Building backend..."
cd backend

# Install dependencies
if [ "$PRODUCTION_BUILD" = true ]; then
  # For production, install only production dependencies
  echo "Installing production dependencies only..."
  npm install --production
else
  # For development, install all dependencies
  echo "Installing all dependencies..."
  npm install
fi

# Build the backend
npm run build

# For production, remove development dependencies to reduce size
if [ "$PRODUCTION_BUILD" = true ]; then
  echo "Removing development dependencies..."
  npm prune --production
  
  # Remove test files from the build
  echo "Removing test files from build..."
  find build -name "*.test.js" -type f -delete
  find build -name "__tests__" -type d -exec rm -rf {} +
  find build -name "tests" -type d -exec rm -rf {} +
  rm -f build/scripts/test_*.js
  rm -f build/scripts/run_*_tests.*
  
  # Remove documentation files
  echo "Removing documentation files..."
  find build -name "*.md" -type f -delete
  find build -name "*.txt" -type f -delete
  
  # Keep README.md if it exists
  if [ -f "../README.md" ]; then
    cp "../README.md" "build/"
  fi
fi

echo "Build completed successfully"
