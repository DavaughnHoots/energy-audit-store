@echo off
echo ===== Deploying Education User Engagement Features =====

echo.
echo Step 1: Pushing to Heroku...
"C:\Program Files\heroku\bin\heroku.cmd" login
git push heroku education-user-engagement:main

echo.
echo Step 2: Migrating database tables...
echo Creating temporary SQL file...
copy backend\src\migrations\20250324_01_education_user_engagement.sql temp_migration.sql

echo Running SQL directly on Heroku PostgreSQL...
"C:\Program Files\heroku\bin\heroku.cmd" pg:psql --app energy-audit-store < temp_migration.sql

echo Cleaning up...
del temp_migration.sql

echo.
echo ===== Deployment Complete =====
echo.
echo To verify the deployment:
echo 1. Visit https://energy-audit-store.herokuapp.com/api/education
echo 2. Check database tables: heroku pg:psql --app energy-audit-store -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'resource_%%' OR table_name LIKE 'educational_%%';"
echo 3. Check Heroku logs: heroku logs --tail
