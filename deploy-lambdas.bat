@echo off
REM Deploy Lambda Functions for Crowd Catcher
REM This script packages and deploys the Lambda functions with their actual code

echo ================================================
echo Deploying Crowd Catcher Lambda Functions
echo ================================================
echo.

REM Create temp directory for Lambda packages
if not exist "lambda-packages" mkdir lambda-packages

echo [1/4] Packaging IndexUserFace Lambda...
cd lambda
if exist indexUserFace.zip del indexUserFace.zip
powershell Compress-Archive -Path indexUserFace.js -DestinationPath ..\lambda-packages\indexUserFace.zip -Force
cd ..

echo [2/4] Deploying IndexUserFace Lambda...
aws lambda update-function-code ^
  --function-name crowd-catcher-stack-index-user-face-dev ^
  --zip-file fileb://lambda-packages/indexUserFace.zip ^
  --region us-east-1

echo.
echo [3/4] Packaging ProcessEventPhoto Lambda...
cd lambda
if exist processEventPhoto.zip del processEventPhoto.zip
powershell Compress-Archive -Path processEventPhoto.js -DestinationPath ..\lambda-packages\processEventPhoto.zip -Force
cd ..

echo [4/4] Deploying ProcessEventPhoto Lambda...
aws lambda update-function-code ^
  --function-name crowd-catcher-stack-process-event-photo-dev ^
  --zip-file fileb://lambda-packages/processEventPhoto.zip ^
  --region us-east-1

echo.
echo ================================================
echo Lambda Deployment Complete!
echo ================================================
echo.
echo Next steps:
echo 1. Upload your profile photos to test face indexing
echo 2. Check CloudWatch logs: aws logs tail /aws/lambda/crowd-catcher-stack-index-user-face-dev --follow --region us-east-1
echo 3. Verify face count: aws rekognition describe-collection --collection-id crowd-catcher-stack-faces-dev --region us-east-1
echo.
pause
