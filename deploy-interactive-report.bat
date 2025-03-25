@echo off
echo ===============================
echo Interactive Report Preview Deployment
echo ===============================

echo Building frontend...
call npm run build

echo Building backend...
cd backend
call npm run build
cd ..

git add .
git commit -m "Prepare interactive report preview for deployment"

echo Deploying to Heroku...
git push heroku master

echo ===============================
echo Visit your application to test the interactive report feature
echo ===============================

pause
