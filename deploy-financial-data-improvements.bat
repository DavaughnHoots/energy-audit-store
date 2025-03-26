@echo off
echo ====================================================================
echo Deploying Recommendation Financial Data Improvements
echo ====================================================================
echo.

echo Pushing code to Heroku...
git add backend/src/utils/reportValidationHelper.ts
git add backend/src/types/energyAudit.ts
git add implementation_tracker.md
git commit -m "Implement recommendation financial data improvements"

echo.
echo Deploying to Heroku...
git push heroku main

echo.
echo Financial data improvements have been deployed!
echo.
echo The following changes were made:
echo  - Enhanced ReportValidationHelper to provide intelligent defaults for financial data
echo  - Added sophisticated savings estimation based on recommendation type and property size
echo  - Added cost estimation with square footage-based calculations
echo  - Added scope coverage factor to adjust estimates for partial-home recommendations
echo  - Added isEstimated flag to indicate when values are system-generated estimates
echo.
echo All recommendations should now show proper financial values instead of N/A
echo.
echo ====================================================================
