# Energy Audit Store - Troubleshooting Guide

This guide addresses common issues you might encounter when setting up, deploying, or using the Energy Audit Store application. Use this as a reference when you encounter problems with the application.

## Table of Contents

1. [Frontend Issues](#frontend-issues)
2. [Backend Issues](#backend-issues)
3. [Database Issues](#database-issues)
4. [Heroku Deployment Issues](#heroku-deployment-issues)
5. [Environment Variable Issues](#environment-variable-issues)
6. [Build Errors](#build-errors)

## Frontend Issues

### Component Path Resolution Errors

**Problem:** Errors like `Could not resolve "../components/products/SearchBar" from "src/pages/Products2Page.tsx"`

**Solution:**
1. Run the path fix script:
   ```bash
   node scripts/fix_product_search_components.js
   ```
2. Check that the component files exist in the correct locations
3. Verify that vite.config.ts has the correct path aliases

### TypeScript Build Errors

**Problem:** TypeScript errors during build

**Solution:**
1. Run TypeScript verification:
   ```bash
   npx tsc --noEmit
   ```
2. Fix any TypeScript errors that appear
3. If errors persist with product components, run:
   ```bash
   node scripts/fix_typescript_errors.js
   ```

### Development Server Doesn't Start

**Problem:** `npm run dev` fails to start the development server

**Solution:**
1. Check for error messages in the terminal
2. Ensure all dependencies are installed:
   ```bash
   npm ci
   ```
3. Verify that the port (default 5173) is not in use by another application
4. Check that your .env file is set up correctly

## Backend Issues

### Backend Server Doesn't Start

**Problem:** `npm run dev` in the backend directory fails

**Solution:**
1. Check PostgreSQL is running
2. Verify your .env file contains correct database credentials
3. Ensure all dependencies are installed:
   ```bash
   cd backend
   npm ci
   ```
4. Check for port conflicts (default port 5000)

### Module Import Errors

**Problem:** ES Module import errors in the backend

**Solution:**
1. Run the import fix script:
   ```bash
   cd backend
   npm run fix-imports
   ```
2. Ensure backend package.json has `"type": "module"` if using ES modules

## Database Issues

### Connection Errors

**Problem:** Cannot connect to the database

**Solution:**
1. Verify PostgreSQL is running
2. Check database credentials in .env file
3. Ensure the database exists:
   ```bash
   psql -U postgres -c "SELECT datname FROM pg_database WHERE datname='energy_efficient_store';"
   ```
4. Try connecting manually to verify credentials:
   ```bash
   psql -U postgres -d energy_efficient_store
   ```

### Migration Errors

**Problem:** Database migrations fail

**Solution:**
1. Check error messages for specific SQL errors
2. Verify PostgreSQL version (should be 14.x+)
3. Ensure database user has CREATE/ALTER permissions
4. For Heroku, check logs:
   ```bash
   heroku logs --tail
   ```

## Heroku Deployment Issues

### Build Failures

**Problem:** Heroku build fails during deployment

**Solution:**
1. Check Heroku logs:
   ```bash
   heroku logs --tail
   ```
2. Ensure all dependencies are in the main `dependencies` section (not `devDependencies`) for production use
3. Verify that the Procfile is set up correctly
4. Check for path resolution issues and run:
   ```bash
   node scripts/fix_product_search_components.js
   ```

### PostgreSQL Connection Issues in Production

**Problem:** Application cannot connect to Heroku PostgreSQL

**Solution:**
1. Verify the SSL configuration in your database connection:
   ```javascript
   ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
   ```
2. Check that your application is reading the `DATABASE_URL` environment variable provided by Heroku
3. Run check environment script:
   ```bash
   heroku run "cd backend && node build/scripts/check_env.js"
   ```

### Missing Dependencies on Heroku

**Problem:** Application crashes with module not found errors

**Solution:**
1. Run the dependency fix script:
   ```bash
   node scripts/fix_missing_dependencies.js
   ```
2. Ensure all required dependencies are in package.json under `dependencies` (not `devDependencies`)
3. Check for platform-specific dependencies that might not work on Heroku

## Environment Variable Issues

### Missing Environment Variables

**Problem:** Application errors related to undefined environment variables

**Solution:**
1. Check your .env files are properly set up
2. For Heroku, verify environment variables are set:
   ```bash
   heroku config
   ```
3. Ensure you're setting required variables:
   ```bash
   heroku config:set JWT_SECRET=your_secure_jwt_secret NODE_ENV=production
   ```

### Production vs Development Configuration

**Problem:** Different behavior between local and production environments

**Solution:**
1. Verify NODE_ENV is set correctly:
   ```bash
   heroku config:set NODE_ENV=production
   ```
2. Ensure your code properly handles environment differences
3. Check for hard-coded URLs or configuration values

## Build Errors

### Vite Build Errors

**Problem:** Errors during `npm run build`

**Solution:**
1. Check TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```
2. Fix path resolution issues:
   ```bash
   node scripts/fix_product_search_components.js
   ```
3. Ensure vite.config.ts is correctly configured
4. Try clearing the build cache:
   ```bash
   rm -rf node_modules/.vite
   ```

### Backend Build Errors

**Problem:** Backend build fails with `npm run build` or `npm run build:heroku`

**Solution:**
1. Check TypeScript errors
2. Verify file paths in the build script
3. Ensure TypeScript configurations are correct
4. For Windows users, use Windows-compatible commands in package.json

## Deployment Checklist

Use this checklist to verify you've completed all required steps for a successful deployment:

### Local Testing
- [ ] Frontend runs locally with `npm run dev`
- [ ] Backend runs locally with `cd backend && npm run dev`
- [ ] Database connections work properly
- [ ] TypeScript builds without errors: `npx tsc --noEmit`
- [ ] Frontend build completes successfully: `npm run build`
- [ ] Backend build completes successfully: `cd backend && npm run build`

### Heroku Preparation
- [ ] Heroku CLI is installed and logged in
- [ ] Heroku app is created
- [ ] PostgreSQL addon is added
- [ ] Environment variables are configured
- [ ] Package.json engines field specifies correct Node.js and npm versions
- [ ] Procfile is set up correctly
- [ ] Product search components are fixed with `node scripts/fix_product_search_components.js`

### Deployment Process
- [ ] New git branch created for deployment
- [ ] All changes are committed
- [ ] Successfully pushed to Heroku
- [ ] Database migrations run successfully
- [ ] Application opens in browser with `heroku open`

If you encounter issues not covered in this guide, please refer to the [Heroku Documentation](https://devcenter.heroku.com/categories/reference) or contact the development team.
