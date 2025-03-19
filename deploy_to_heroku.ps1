# Install required dependencies
Write-Host "Installing required dependencies..."
cd backend
npm install sqlite sqlite3 pg @types/pg

# Compile TypeScript files
Write-Host "Compiling TypeScript files..."
Write-Host "Compiling product preferences migration script..."
npx tsc --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir build src/scripts/heroku_product_preferences_migration.ts

# Compile weather data upload script
Write-Host "Compiling weather data upload script..."
npx tsc --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir build src/scripts/upload_weather_data.ts

# Check if compilation was successful
if (Test-Path build/src/scripts/heroku_product_preferences_migration.js) {
    Write-Host "Product preferences migration script compilation successful!"
} else {
    Write-Host "Product preferences migration script compilation failed!"
    exit 1
}

if (Test-Path build/src/scripts/upload_weather_data.js) {
    Write-Host "Weather data upload script compilation successful!"
} else {
    Write-Host "Weather data upload script compilation failed!"
    exit 1
}

# Deploy to Heroku
Write-Host "Deploying to Heroku..."
cd ..
git add .
git commit -m "Add weather data integration"
git push heroku main

# Run migrations on Heroku
Write-Host "Running migrations on Heroku..."

# Run weather data tables migration
Write-Host "Running weather data tables migration..."
heroku pg:psql --command="$(Get-Content backend/src/migrations/20250319_01_add_weather_data_tables.sql -Raw)"

# Check if weather data database exists
$weatherDbPath = "processed_weather_data/weather_energy_data.db"
if (Test-Path $weatherDbPath) {
    Write-Host "Weather data database found at $weatherDbPath. Ready to upload data."
    
    # Set environment variable for upload script
    $env:HEROKU_DATABASE_URL = heroku config:get DATABASE_URL
    
    # Run data upload script with optimized filtering
    Write-Host "Uploading filtered weather data to Heroku PostgreSQL..."
    Write-Host "Using subset of major cities and recent years to stay within free tier limits..."
    Write-Host "This will take a few minutes..."
    
    # Skip daily_weather table by default to reduce data volume
    node backend/build/src/scripts/upload_weather_data.js --skip-tables daily_weather --verbose
    
    Write-Host "Weather data upload complete!"
} else {
    Write-Host "Weather data database not found at $weatherDbPath."
    Write-Host "Please run the preprocessing script first:"
    Write-Host "python preprocess_weather_data.py --input WeatherEvents_Jan2016-Dec2022.csv --output-dir processed_weather_data"
}

Write-Host "Deployment complete!"
