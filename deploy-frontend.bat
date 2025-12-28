@echo off
echo ========================================
echo   Expense Tracker - Frontend Deployment
echo ========================================
echo.

REM Get bucket name from user
set /p BUCKET_NAME="Enter a unique bucket name (e.g., expense-tracker-yourname): "

echo.
echo Step 1: Building frontend...
cd expense-tracker-frontend
call npm run build

echo.
echo Step 2: Creating S3 bucket...
aws s3 mb s3://%BUCKET_NAME%

echo.
echo Step 3: Enabling website hosting...
aws s3 website s3://%BUCKET_NAME% --index-document index.html --error-document index.html

echo.
echo Step 4: Uploading files...
aws s3 sync dist/ s3://%BUCKET_NAME% --acl public-read

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Your app is live at:
echo http://%BUCKET_NAME%.s3-website-us-east-1.amazonaws.com
echo.
echo Copy this URL and share it with anyone!
echo ========================================

pause
