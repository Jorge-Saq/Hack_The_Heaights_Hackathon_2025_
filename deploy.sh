#!/bin/bash

# Crowd Catcher Deployment Script
# This script deploys the complete AWS infrastructure and sets up the application

set -e

echo "🚀 Starting Crowd Catcher deployment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "Visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account ID: $AWS_ACCOUNT_ID"

# Set environment
ENVIRONMENT=${1:-dev}
STACK_NAME="crowd-catcher-stack"

echo "📦 Deploying infrastructure for environment: $ENVIRONMENT"

# Deploy CloudFormation stack
echo "🏗️  Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file infrastructure.yaml \
    --stack-name $STACK_NAME \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides Environment=$ENVIRONMENT \
    --no-fail-on-empty-changeset

if [ $? -ne 0 ]; then
    echo "❌ CloudFormation deployment failed"
    exit 1
fi

echo "✅ CloudFormation stack deployed successfully"

# Get stack outputs
echo "📋 Getting stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs' \
    --output json)

# Extract values
USER_POOL_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UserPoolId") | .OutputValue')
USER_POOL_CLIENT_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UserPoolClientId") | .OutputValue')
USER_PROFILES_BUCKET=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UserProfilesBucketName") | .OutputValue')
EVENT_PHOTOS_BUCKET=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="EventPhotosBucketName") | .OutputValue')
API_GATEWAY_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="ApiGatewayUrl") | .OutputValue')

echo "📝 Stack outputs:"
echo "  User Pool ID: $USER_POOL_ID"
echo "  User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "  User Profiles Bucket: $USER_PROFILES_BUCKET"
echo "  Event Photos Bucket: $EVENT_PHOTOS_BUCKET"
echo "  API Gateway URL: $API_GATEWAY_URL"

# Create Rekognition Face Collection
echo "👤 Creating Rekognition Face Collection..."
COLLECTION_ID="${STACK_NAME}-faces-${ENVIRONMENT}"

aws rekognition create-collection \
    --collection-id $COLLECTION_ID \
    --region us-east-1 || echo "⚠️  Collection may already exist"

echo "✅ Rekognition collection created: $COLLECTION_ID"

# Create .env.local file
echo "📝 Creating .env.local file..."
cat > .env.local << EOF
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
NEXT_PUBLIC_API_GATEWAY_URL=$API_GATEWAY_URL

# S3 Buckets
NEXT_PUBLIC_USER_PROFILES_BUCKET=$USER_PROFILES_BUCKET
NEXT_PUBLIC_EVENT_PHOTOS_BUCKET=$EVENT_PHOTOS_BUCKET

# DynamoDB Tables
NEXT_PUBLIC_USER_PROFILES_TABLE=${STACK_NAME}-user-profiles-${ENVIRONMENT}
NEXT_PUBLIC_MATCHED_PHOTOS_TABLE=${STACK_NAME}-matched-photos-${ENVIRONMENT}

# Rekognition
NEXT_PUBLIC_REKOGNITION_COLLECTION_ID=$COLLECTION_ID

# SES
SES_FROM_EMAIL=noreply@crowd-catcher.com
EOF

echo "✅ Environment file created"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure Amazon SES for email notifications:"
echo "   aws ses verify-email-identity --email-address noreply@yourdomain.com"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "4. Create a user account and upload profile photos"
echo ""
echo "🔧 Manual configuration needed:"
echo "- Set up S3 event notifications for Lambda triggers"
echo "- Configure SES domain verification for production"
echo "- Set up custom domain for API Gateway (optional)"
