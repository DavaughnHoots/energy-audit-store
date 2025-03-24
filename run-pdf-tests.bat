@echo off
echo Running PDF generation tests...

:: Run the test script with Node.js 
node test-pdf-generation.js

:: Check if the script completed successfully
if %ERRORLEVEL% EQU 0 (
  echo Tests completed successfully.
  echo PDF files are available in the ./test-pdfs directory.
  
  :: Count and list the generated PDFs
  echo Generated PDFs:
  dir /b test-pdfs\*.pdf 2>nul | find /c /v ""
  dir test-pdfs\*.pdf 2>nul
) else (
  echo Tests failed. Check the error output above.
)

pause
