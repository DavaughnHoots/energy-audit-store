# Module Compatibility Guide

## Overview

This document explains the module system used in the Energy Audit Store application and how to properly create and run test scripts that work with our codebase.

## Module Systems

Our project uses two different JavaScript module systems:

1. **ES Modules (ESM)** - Used in the backend TypeScript code (note the `"type": "module"` in backend/package.json)
2. **CommonJS (CJS)** - Used in some utility scripts

## Test Script Setup

When creating test scripts for components that are compiled from TypeScript, follow these guidelines:

### ES Module Test Scripts (Required for Backend Tests)

1. Use the `.js` extension with proper ES Module syntax
2. Import using ES module syntax:
   ```javascript
   import { SomeClass } from './path/to/file.js';
   ```
3. Note the `.js` extension in the import path (even when importing from TypeScript files)
4. Run using: `node --input-type=module test-script.js`

### Running Tests

We've set up a simplified system to run tests:

1. Use the `--input-type=module` flag with Node.js to specify that JavaScript files should be treated as ES modules
2. The `run-enhancement-tests.bat` script handles the proper execution of all tests

## Common Issues

### "ERR_REQUIRE_ESM" Error

This error occurs when you try to use `require()` to import an ES module. The solution is to:

1. Switch to `import` syntax instead of `require()`
2. Add the `.js` extension to all import paths 
3. Use async/await for top-level async operations
4. Run Node.js with the `--input-type=module` flag

### Import Path Resolution

Always include the `.js` extension in import paths, even when importing TypeScript files:

```javascript
// Correct:
import { MyClass } from './build/utils/myClass.js';

// Incorrect - will fail:
import { MyClass } from './build/utils/myClass';
```

## Creating New Tests

When creating new test scripts:

1. Create the test file using ES Module syntax 
2. Make sure to use the `.js` extension in import paths
3. Add the test to the run-enhancement-tests.bat script or create a new script that uses the `--input-type=module` flag

## TypeScript Compilation Notes

When TypeScript compiles files with the backend's configuration (`"type": "module"` in package.json), it creates ES module JavaScript files. This means:

1. These files use `import`/`export` instead of `require`/`module.exports`
2. The compiled files can't be loaded with `require()` in CommonJS scripts
3. When importing these files in test scripts, we must use ES module syntax

## Deployment

Our deployment scripts handle all necessary testing before deployment. The test system has been designed to work with our Heroku production environment, which also uses ES modules for the backend services.
