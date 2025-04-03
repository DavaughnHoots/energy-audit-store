# PowerShell script to run analytics diagnostics on Heroku from Windows
# This script avoids issues with spaces in paths and quotes

Write-Host "Running analytics diagnostics on Heroku..." -ForegroundColor Cyan
Write-Host ""

# Try to run the command using various methods
Write-Host "Trying to execute with the Heroku CLI..." -ForegroundColor Yellow
try {
    & heroku run 'node backend/scripts/heroku_check_analytics.js' --app energy-audit-store
}
catch {
    Write-Host "Error executing command: $_" -ForegroundColor Red
    Write-Host "First method failed, trying alternate approach..." -ForegroundColor Yellow
    Write-Host ""
    
    # Try with npx
    try {
        & npx heroku run 'node backend/scripts/heroku_check_analytics.js' --app energy-audit-store
    }
    catch {
        Write-Host "Error executing with npx: $_" -ForegroundColor Red
        Write-Host "Both approaches failed. Please make sure Heroku CLI is installed correctly." -ForegroundColor Red
        Write-Host ""
        Write-Host "You can try running this command manually in Git Bash:" -ForegroundColor Cyan
        Write-Host "heroku run 'node backend/scripts/heroku_check_analytics.js' --app energy-audit-store" -ForegroundColor White
        Write-Host ""
    }
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
