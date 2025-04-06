@echo off
echo Starting form tracking deployment to Heroku...
echo.

node scripts/heroku_deploy_form_tracking.js

echo.
if %ERRORLEVEL% EQU 0 (
  echo Deployment completed successfully!
  echo.
  echo The following files were deployed:
  echo - src/hooks/analytics/useFormTracking.ts
  echo - src/context/AnalyticsContext.tsx
  echo - src/pages/ProductsPage.tsx
  echo - src/pages/EnergyAuditPage.tsx
  echo - src/components/audit/EnergyAuditForm.tsx
  echo.
  echo Check the admin dashboard to verify that form tracking events are being recorded.
) else (
  echo Deployment failed with error code %ERRORLEVEL%
  echo Please check the error messages above.
)

pause
