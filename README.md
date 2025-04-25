# Energy Audit Store - Admin Dashboard Tools

A collection of tools to help fix deployment issues and add features to the Energy Audit Store admin dashboard.

## Overview

This project contains utilities to:

1. Fix Heroku deployment issues
2. Manage GitHub repository
3. Analyze the admin dashboard for future feature implementation

## Deployment Fix Tools

The application was experiencing several issues with Heroku deployment:

- Missing dependencies (`dotenv`, `papaparse`)
- TypeScript compilation errors
- Canvas building failures due to missing Python

### Dependency Fix Tools

```bash
# Fix basic dependencies (dotenv)
npm run heroku-fix

# Fix additional dependencies (papaparse)
npm run fix-dependencies

# Fix TypeScript compilation errors
npm run fix-typescript
```

### Deployment Scripts

```bash
# Deploy with Windows-compatible script
npm run heroku-deploy

# Deploy with enhanced error handling script
npm run heroku-deploy-final
```

## GitHub Repository Management

Tools for pushing your local changes to GitHub:

```bash
# Interactive tool with multiple push strategies
npm run github-options

# Simple GitHub push utility
npm run push-github
```

## Admin Dashboard Analysis

Tools to analyze the admin dashboard structure for implementing new features:

```bash
# Inspect the live admin dashboard
npm run inspect

# Pull Heroku app files
npm run pull

# Pull from Heroku using Git
npm run git-pull
```

## Documentation

- [GitHub Push Guide](./GITHUB_PUSH_GUIDE.md) - Detailed instructions for pushing to GitHub
- [Heroku Fix Guide](./HEROKU_FIX_GUIDE.md) - Guide for fixing Heroku deployment issues
- [Updated Heroku Fix Guide](./HEROKU_FIX_GUIDE_UPDATED.md) - Comprehensive guide including TypeScript fixes

## Feature Implementation Plan

After fixing the deployment issues, we can implement the requested feature:

> Add a section on the admin dashboard that can create a website roadmap based on Most Used Features & Most Visited Pages.

Steps:
1. Use the web inspector tool to analyze the existing admin dashboard structure
2. Locate the analytics data source in the application
3. Create a new component for the roadmap feature
4. Integrate with the existing analytics data
5. Add visualization for the most used features and visited pages
6. Deploy the changes to Heroku
