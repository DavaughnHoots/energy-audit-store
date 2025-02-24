#!/bin/bash

# Exit on error
set -e

echo "Installing root dependencies..."
npm install

echo "Building frontend..."
npm run build

echo "Installing backend dependencies..."
cd backend
npm install

echo "Building backend..."
npm run build

echo "Build completed successfully"
