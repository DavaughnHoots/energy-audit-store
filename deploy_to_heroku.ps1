# Compile TypeScript files
Write-Host "Compiling TypeScript files..."
cd backend
npx tsc --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir build src/scripts/heroku_product_preferences_migration.ts

# Check if compilation was successful
if (Test-Path build/src/scripts/heroku_product_preferences_migration.js) {
    Write-Host "Compilation successful!"
} else {
    Write-Host "Compilation failed!"
    exit 1
}

# Deploy to Heroku
Write-Host "Deploying to Heroku..."
cd ..
git add .
git commit -m "Add product preferences functionality"
git push heroku main

# Run migration on Heroku
Write-Host "Running migration on Heroku..."
heroku run node backend/build/src/scripts/heroku_product_preferences_migration.js

Write-Host "Deployment complete!"
