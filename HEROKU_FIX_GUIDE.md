# Heroku Deployment Fix Guide

This guide will help you fix the issues with your Heroku deployment for the Energy Audit Store application.

## Understanding the Current Issues

Based on the Heroku logs you provided, the application is crashing due to two main issues:

1. **Missing Dependency**: `Cannot find package 'dotenv' imported from /app/backend/build/server.js`
2. **Build Issues with Canvas**: Python is required to build the `canvas` dependency, but Python isn't available in the default Heroku environment.

## Using the Heroku Fix Utility

I've created a utility script that will automatically fix these issues:

```bash
# Run the Heroku dependency fix utility
npm run heroku-fix
```

### What the Utility Does

The script will:

1. Add the missing `dotenv` dependency to backend/package.json
2. Create an `Aptfile` with the necessary dependencies for building the canvas package
3. Check and update the `Procfile` if needed
4. Add Node.js engine constraints to package.json
5. Create a deployment script to push the fixes to Heroku

## Manual Steps After Running the Utility

After running the utility, you'll need to:

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
```

3. Deploy the fixes:

```bash
# Run the deployment script created by the utility
node scripts/heroku_deploy_dependency_fix.js

# Or manually
git add backend/package.json Procfile Aptfile package.json
git commit -m "Fix Heroku dependency issues"
git push heroku `git branch --show-current`:master -f
```

4. Monitor the deployment:

```bash
# Watch the logs to ensure successful deployment
heroku logs -tail -a energy-audit-store
```

## Common Troubleshooting

If you still encounter issues after deploying the fixes:

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
