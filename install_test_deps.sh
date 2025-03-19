#!/bin/bash

# Script to install the required test dependencies for weather data testing

echo "Installing test dependencies..."

# Make sure we're in the backend directory
cd backend

# Install the chai testing library and type definitions
npm install --save-dev chai @types/chai

# Install sinon for mocking/stubbing and type definitions
npm install --save-dev sinon @types/sinon

# Install mocha test runner and type definitions if not already installed
npm install --save-dev mocha @types/mocha

# Install TypeScript node for running TS tests directly
npm install --save-dev ts-node

# Install sqlite3 and sqlite (required for the upload script)
npm install --save sqlite sqlite3

# Check if pg (PostgreSQL client) is already installed
if ! npm list | grep -q "pg@"; then
  echo "Installing PostgreSQL client..."
  npm install --save pg @types/pg
fi

echo "Test dependencies installed successfully!"
echo ""
echo "To run the tests, use:"
echo "cd backend && npx mocha -r ts-node/register src/tests/weatherDataService.test.ts"
