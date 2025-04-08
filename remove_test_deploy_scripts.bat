@echo off
echo Removing test and deploy scripts from Git tracking...

REM Remove script files from the scripts directory
git rm --cached scripts/heroku_*.js
git rm --cached scripts/debug_*.js
git rm --cached scripts/check_*.js
git rm --cached scripts/deploy_*.js
git rm --cached scripts/direct_*.js

REM Remove batch files
git rm --cached *.bat
git rm --cached run-*.bat
git rm --cached deploy-*.bat

REM Remove PowerShell scripts
git rm --cached *.ps1
git rm --cached deploy_*.ps1

REM Remove test files
git rm --cached test-*.js
git rm --cached test-*.mjs
git rm --cached test-*.ts

REM Remove Python scripts
git rm --cached *.py

REM Remove documentation and implementation plan files that shouldn't be in the repo
git rm --cached *implementation-plan*.md
git rm --cached *implementation-summary*.md
git rm --cached *implementation_plan*.txt
git rm --cached *deployment*.md
git rm --cached *fix-plan*.md

echo.
echo Files have been removed from Git tracking but kept on your local machine.
echo Now commit these changes with: git commit -m "Remove test and deploy scripts from Git tracking"
echo.
