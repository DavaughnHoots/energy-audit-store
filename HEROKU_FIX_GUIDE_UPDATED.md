# Heroku Deployment Fix Guide - Updated

This guide will help you fix the issues with your Heroku deployment for the Energy Audit Store application.

## Understanding the Current Issues

Based on the Heroku logs, the application is crashing due to several issues:

1. **Missing Dependencies**: 
   - `Cannot find package 'dotenv' imported from /app/backend/build/server.js`
   - `Cannot find package 'papaparse' imported from /app/backend/build/services/productDataService.js`

2. **TypeScript Compilation Errors**:
   - Multiple TypeScript errors related to implicit any types, property access, and type mismatches
   - These errors appear during the build process but don't prevent compilation

## Using the Dependency Fix Utilities

I've created utility scripts that will automatically fix these issues:

```bash
# Step 1: Run the initial Heroku dependency fix utility
npm run heroku-fix

# Step 2: Run the additional missing dependencies fix
npm run fix-dependencies
```

### What the Utilities Do

The scripts will:

1. Add missing dependencies to backend/package.json:
   - `dotenv`: For environment variable handling
   - `papaparse`: For CSV parsing in productDataService

2. Create an `Aptfile` with necessary dependencies for building the canvas package

3. Check and update the `Procfile` if needed

4. Add Node.js engine constraints to package.json

5. Create deployment scripts to push the fixes to Heroku

## Manual Steps After Running the Utilities

After running the utilities, you'll need to:

1. Add the required buildpacks to Heroku:

```bash
# Clear existing buildpacks
heroku buildpacks:clear -a energy-audit-store

# Add the Node.js buildpack
heroku buildpacks:add heroku/nodejs -a energy-audit-store

# Add the Apt buildpack for system dependencies (including Python)
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-apt -a energy-audit-store
```

2. Set environment variables:

```bash
# Set NODE_ENV to production
heroku config:set NODE_ENV=production -a energy-audit-store

# Allow installation of dev dependencies if needed
heroku config:set NPM_CONFIG_PRODUCTION=false -a energy-audit-store

# Bypass TypeScript errors (temporary solution)
npm run heroku-config
# This runs: heroku config:set TS_NODE_TRANSPILE_ONLY=true -a energy-audit-store
```

3. Deploy the fixes:

```bash
# Run the improved deployment script (recommended)
npm run heroku-deploy-final

# Or use the basic fixed script
npm run heroku-deploy
```

The final deployment script includes additional improvements:
- Checks if there are changes to commit first (avoids errors)
- Verifies required files exist
- Provides more detailed error handling
- Confirms Heroku CLI is installed

4. Monitor the deployment:

```bash
# Watch the logs to ensure successful deployment
heroku logs -tail -a energy-audit-store
```

## Fixing TypeScript Errors

To properly fix the TypeScript errors, you would need to update the backend's tsconfig.json file with the following compiler options:

```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true
  }
}
```

While the `TS_NODE_TRANSPILE_ONLY=true` environment variable will bypass these errors temporarily, a more permanent solution would be to fix the actual TypeScript errors in the source code.

## Common Troubleshooting

If you still encounter issues after deploying the fixes:

### TypeScript Errors

If TypeScript errors persist:

```bash
# Create a minimal tsconfig.json in the backend root
cat > backend/tsconfig.fix.json << EOF
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true
  }
}
EOF

# Tell Heroku to use this config
heroku config:set TS_CONFIG_PATH=tsconfig.fix.json -a energy-audit-store
```

### Node.js Version Issues

If the app crashes due to Node.js version compatibility:

```bash
# Set a specific Node.js version
heroku config:set NODE_VERSION=18.x -a energy-audit-store
```

### Missing Dependencies

If other dependencies are missing:

```bash
# SSH into the Heroku dyno to troubleshoot
heroku run bash -a energy-audit-store

# Check installed packages
npm list --depth=0
```

### Buildpack Issues

If buildpack issues persist:

```bash
# Verify buildpacks
heroku buildpacks -a energy-audit-store

# Rebuild without cache
heroku builds:create -a energy-audit-store --source=HEAD
```

## After Successful Deployment

Once the app is successfully deployed, you'll be able to access the admin dashboard at:
https://energy-audit-store-e66479ed4f2b.herokuapp.com/admin/dashboard

You can then proceed with implementing the requested feature: adding a section to the admin dashboard that creates a website roadmap based on Most Used Features & Most Visited Pages.
