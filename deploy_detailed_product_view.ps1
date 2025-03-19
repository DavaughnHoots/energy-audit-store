# Deploy Detailed Product View Feature to Heroku

Write-Host "Installing backend dependencies..."
cd backend
npm install

# Compile TypeScript files
Write-Host "Compiling TypeScript files..."
npm run build

# Check if compilation was successful
if (Test-Path build/server.js) {
    Write-Host "Backend compilation successful!"
} else {
    Write-Host "Backend compilation failed!"
    exit 1
}

# Deploy to Heroku
Write-Host "Deploying the detailed product view feature branch to Heroku..."
cd ..

# Push the feature branch to Heroku
Write-Host "Pushing feature/detailed-product-view branch to Heroku..."
git push heroku feature/detailed-product-view:main -f

Write-Host "Deployment complete! The detailed product view feature is now live on Heroku."
