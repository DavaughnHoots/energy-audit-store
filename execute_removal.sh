#!/bin/bash

# Remove tracked files from Git (but keep them locally)
git rm --cached "analytics-tracking-implementation-plan.md.backup"
git rm --cached "backend/src/scripts/heroku_migration.ts"
git rm --cached "backend/src/scripts/heroku_product_preferences_migration.ts"
git rm --cached "dashboard-redesign-implementation-plan.md.backup"
git rm --cached "heroku_import_products.js"

# Commit the changes
git commit -m "Remove test and deploy scripts from Git tracking"

# Push to GitHub
git push origin fix/data-mishape-property
