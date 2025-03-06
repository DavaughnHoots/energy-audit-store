# PowerShell script to run the migration on Heroku
$herokuCmd = "C:\Program Files\heroku\bin\heroku.cmd"
$appName = "energy-audit-store"
$sqlFilePath = "backend\src\migrations\add_visualization_data_table.sql"

Write-Host "Running migration on Heroku app: $appName"

# Read the SQL file content
$sqlContent = Get-Content -Path $sqlFilePath -Raw

# Create a temporary file with the SQL content
$tempFilePath = "temp_migration.sql"
Set-Content -Path $tempFilePath -Value $sqlContent

try {
    # Run the SQL file on the Heroku database
    Write-Host "Executing SQL migration..."
    & $herokuCmd pg:psql --app $appName -c (Get-Content -Path $tempFilePath -Raw)
    
    Write-Host "Migration completed successfully!"
}
catch {
    Write-Host "Error running migration: $_"
}
finally {
    # Clean up the temporary file
    if (Test-Path $tempFilePath) {
        Remove-Item $tempFilePath
    }
}
