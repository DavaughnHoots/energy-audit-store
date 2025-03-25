@echo off
echo ===== Deploying Database Tables for Education User Engagement =====

echo.
echo === Step 1: Dumping SQL to temporary file ===
copy backend\src\migrations\20250324_01_education_user_engagement.sql temp_migration.sql

echo.
echo === Step 2: Running SQL migration directly on Heroku PostgreSQL ===
heroku pg:psql --app energy-audit-store < temp_migration.sql

echo.
echo === Step 3: Cleanup ===
del temp_migration.sql

echo.
echo === Deployment Complete ===
echo.
echo You can verify the database tables by running:
echo heroku pg:psql --app energy-audit-store -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'resource_%%' OR table_name LIKE 'educational_%%';"
