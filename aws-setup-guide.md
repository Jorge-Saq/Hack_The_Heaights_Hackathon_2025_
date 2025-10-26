# Crowd Catcher AWS Setup Guide

## Prerequisites

Before starting, you'll need:

1. **AWS Account** - Create one at [aws.amazon.com](https://aws.amazon.com)
2. **AWS CLI** - Install from [aws.amazon.com/cli](https://aws.amazon.com/cli)
3. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org)
4. **Git** - Install from [git-scm.com](https://git-scm.com)

## Step 1: AWS Account Setup

### 1.1 Create AWS Account
- Go to [aws.amazon.com](https://aws.amazon.com)
- Click "Create an AWS Account"
- Follow the registration process
- **Important**: You'll need a credit card, but we'll stay within free tier limits

### 1.2 Configure AWS CLI
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (us-east-1 recommended)
- Default output format (json)

### 1.3 Create IAM User (Recommended)
1. Go to AWS Console → IAM → Users
2. Click "Create user"
3. Username: `crowd-catcher-admin`
4. Attach policies: `AdministratorAccess` (for development)
5. Create access keys and download the CSV file

## Step 2: Deploy Infrastructure

### 2.1 Install Dependencies
```bash
npm install
```

### 2.2 Deploy CloudFormation Stack
```bash
aws cloudformation deploy \
  --template-file infrastructure.yaml \
  --stack-name crowd-catcher-stack \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides Environment=dev
```

### 2.3 Get Stack Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name crowd-catcher-stack \
  --query 'Stacks[0].Outputs'
```

## Step 3: Manual AWS Service Configuration

### 3.1 Amazon Rekognition Face Collection
After infrastructure deployment, create the face collection:

```bash
aws rekognition create-collection \
  --collection-id "crowd-catcher-stack-faces-dev"
```

### 3.2 Amazon SES Setup
1. Go to AWS Console → SES → Verified identities
2. Click "Create identity"
3. Choose "Email address" and enter your email
4. Check your email and click the verification link
5. Request production access if needed (for sending to any email)

### 3.3 S3 Event Notifications
Configure S3 event triggers:

```bash
# For user profiles bucket
aws s3api put-bucket-notification-configuration \
  --bucket crowd-catcher-stack-user-profiles-dev \
  --notification-configuration '{
    "LambdaConfigurations": [{
      "Id": "index-user-face-trigger",
      "LambdaFunctionArn": "arn:aws:lambda:us-east-1:YOUR_ACCOUNT:function:crowd-catcher-stack-index-user-face-dev",
      "Events": ["s3:ObjectCreated:*"]
    }]
  }'

# For event photos bucket
aws s3api put-bucket-notification-configuration \
  --bucket crowd-catcher-stack-event-photos-dev \
  --notification-configuration '{
    "LambdaConfigurations": [{
      "Id": "process-event-photo-trigger",
      "LambdaFunctionArn": "arn:aws:lambda:us-east-1:YOUR_ACCOUNT:function:crowd-catcher-stack-process-event-photo-dev",
      "Events": ["s3:ObjectCreated:*"]
    }]
  }'
```

## Step 4: Environment Variables

Create a `.env.local` file:

```env
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your-client-id
NEXT_PUBLIC_API_GATEWAY_URL=your-api-gateway-url

# S3 Buckets
NEXT_PUBLIC_USER_PROFILES_BUCKET=crowd-catcher-stack-user-profiles-dev
NEXT_PUBLIC_EVENT_PHOTOS_BUCKET=crowd-catcher-stack-event-photos-dev

# DynamoDB Tables
NEXT_PUBLIC_USER_PROFILES_TABLE=crowd-catcher-stack-user-profiles-dev
NEXT_PUBLIC_MATCHED_PHOTOS_TABLE=crowd-catcher-stack-matched-photos-dev

# Rekognition
NEXT_PUBLIC_REKOGNITION_COLLECTION_ID=crowd-catcher-stack-faces-dev
```

## Step 5: Required AWS Services & Permissions

### 5.1 Services You'll Need Access To:
- **Amazon Cognito** - User authentication
- **Amazon S3** - Photo storage
- **Amazon Rekognition** - Face detection and matching
- **Amazon DynamoDB** - Data storage
- **AWS Lambda** - Serverless functions
- **Amazon API Gateway** - API endpoints
- **Amazon SES** - Email notifications
- **AWS CloudFormation** - Infrastructure deployment

### 5.2 IAM Permissions Required:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:*",
        "s3:*",
        "rekognition:*",
        "dynamodb:*",
        "lambda:*",
        "apigateway:*",
        "ses:*",
        "cloudformation:*",
        "iam:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Step 6: Cost Estimation

### Free Tier (First 12 months):
- **S3**: 5GB storage, 20,000 GET requests, 2,000 PUT requests
- **Lambda**: 1M requests, 400,000 GB-seconds
- **DynamoDB**: 25GB storage, 25 RCU, 25 WCU
- **Rekognition**: 5,000 images per month
- **SES**: 62,000 emails per month (if verified)

### Estimated Monthly Cost (after free tier):
- **S3**: ~$0.50-2.00 (depending on storage)
- **Lambda**: ~$0.20-1.00 (depending on usage)
- **DynamoDB**: ~$1.00-5.00 (depending on reads/writes)
- **Rekognition**: ~$1.00-10.00 (depending on image processing)
- **SES**: ~$0.10 per 1,000 emails

**Total estimated cost: $3-20/month** (depending on usage)

## Step 7: Security Best Practices

1. **Never commit AWS credentials** to version control
2. **Use IAM roles** instead of access keys when possible
3. **Enable MFA** on your AWS account
4. **Set up billing alerts** to monitor costs
5. **Use least privilege principle** for IAM permissions
6. **Enable CloudTrail** for audit logging

## Step 8: Testing Your Setup

1. **Test Cognito**: Try creating a user account
2. **Test S3**: Upload a photo to verify presigned URLs work
3. **Test Rekognition**: Upload a face photo to verify indexing works
4. **Test API Gateway**: Make API calls to verify endpoints work
5. **Test SES**: Send a test email to verify notifications work

## Troubleshooting

### Common Issues:
1. **CORS errors**: Check S3 bucket CORS configuration
2. **Permission denied**: Verify IAM roles and policies
3. **Lambda timeouts**: Increase timeout in Lambda configuration
4. **SES sandbox**: Request production access for sending to any email
5. **Rekognition limits**: Check service limits in AWS Console

### Getting Help:
- AWS Documentation: [docs.aws.amazon.com](https://docs.aws.amazon.com)
- AWS Support: Available in AWS Console
- Stack Overflow: Tag questions with `aws`, `rekognition`, `lambda`
