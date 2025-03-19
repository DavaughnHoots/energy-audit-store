# Deploy Rate Limiting Fixes to Heroku

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
Write-Host "Deploying the rate limit fixes to Heroku..."
cd ..

# Push the current branch to Heroku
Write-Host "Pushing current branch to Heroku..."
git push heroku fix/products-rate-limit-debugging:main -f

Write-Host "Deployment complete! The rate limit fixes are now live on Heroku."
