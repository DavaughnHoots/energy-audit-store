@echo off
echo ===== Deploying Application with PostgreSQL Import Fixes =====

echo.
echo === Step 1: Building server code ===
cd backend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed! Please check for TypeScript errors.
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo === Step 2: Committing changes ===
git add .
git commit -m "Fix ES module compatibility for pg imports"

echo.
echo === Step 3: Deploying to Heroku ===
git push heroku main

echo.
echo === Step 4: Checking Heroku logs ===
"C:\Program Files\heroku\bin\heroku.cmd" logs --tail

echo.
echo ===== Deployment Complete =====
echo.
echo You can verify the deployment by visiting:
echo https://energy-audit-store.herokuapp.com/
