@echo off
echo Running user role update script on Heroku...
heroku run node scripts/heroku_update_user_role.js -a energy-audit-store
echo Script execution completed.
pause
