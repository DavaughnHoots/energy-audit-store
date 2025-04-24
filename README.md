# Energy Audit Store - Admin Dashboard Analysis

This project contains utilities to help analyze and understand the admin dashboard of the Energy Audit Store application deployed on Heroku, specifically for adding a section on the admin dashboard that creates a website roadmap based on Most Used Features & Most Visited Pages.

## Overview

The Energy Audit Store has an admin dashboard at:
https://energy-audit-store-e66479ed4f2b.herokuapp.com/admin/dashboard

Our goal is to:
1. Understand how the admin dashboard is implemented
2. Add a section for building a website roadmap based on usage analytics
3. Integrate with the existing analytics data

## Available Utilities

This package includes several scripts to help you analyze and understand the existing codebase:

### 1. Web Inspector

Analyzes the structure of the admin dashboard by making HTTP requests to the live site:

```bash
npm run inspect
```

This will:
- Fetch the admin dashboard HTML
- Extract and download JS and CSS files
- Analyze files for admin dashboard related code
- Save everything into an "app-analysis" directory

### 2. Heroku Pull Script

Attempts to download the app files using Heroku CLI:

```bash
npm run pull
```

### 3. Git-based Heroku Pull

Attempts to clone the Heroku Git repository:

```bash
npm run git-pull
```

## Manual Examination

If the automated tools don't work (perhaps due to authentication requirements), you can:

1. Visit the admin dashboard while logged in
2. Use browser developer tools to inspect the page
3. Look at the JavaScript files that are loaded
4. Examine network requests made by the dashboard

See [direct-download-instructions.md](./direct-download-instructions.md) for detailed steps.

## Next Steps After Analysis

Once you understand the structure of the admin dashboard:

1. Identify the relevant components:
   - Admin dashboard main component
   - Analytics data source
   - Any existing roadmap-related features

2. Create or modify the appropriate components:
   - Create UI for displaying Most Used Features & Most Visited Pages
   - Implement roadmap builder functionality
   - Connect to analytics data

3. Test your changes

4. Deploy the modified version

## Important Files to Look For

When analyzing the code, focus on these likely important files:

- `src/pages/AdminDashboardPage.tsx` - The main admin dashboard page
- `src/components/admin/RoadmapFeature.tsx` - Existing roadmap feature (if any)
- `src/components/admin/RoadmapBuilder.tsx` - Roadmap building component (if any)
- `backend/src/routes/analytics.ts` - Backend API for analytics data
- Any files containing "admin", "dashboard", "roadmap", or "analytics"

## Working with the Files

After you've retrieved the source code, you can modify the relevant files to add the new roadmap feature based on analytics data. The exact implementation will depend on the existing codebase structure, which you'll discover during analysis.
