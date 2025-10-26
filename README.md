# Crowd Catcher - AI-Powered Crowd Photo Identification

An innovative application that uses Amazon Rekognition to identify people in crowd photos. Users upload profile photos, and the system automatically detects them in event photos uploaded by photographers.

## 🚀 Features

- **User Authentication**: Secure signup/login with Amazon Cognito
- **Profile Photo Upload**: Users upload 10 photos for face recognition
- **Photo Gallery**: View photos where you've been identified
- **Real-time Notifications**: Email alerts when you're spotted in new photos
- **Face Recognition**: Powered by Amazon Rekognition Face Collections
- **Serverless Architecture**: Built with AWS Lambda, API Gateway, and S3

## 🏗️ Architecture

The application uses a serverless architecture with the following AWS services:

- **Amazon Cognito**: User authentication and management
- **Amazon S3**: Photo storage (user profiles and event photos)
- **Amazon Rekognition**: Face detection and matching
- **AWS Lambda**: Serverless backend functions
- **Amazon API Gateway**: REST API endpoints
- **Amazon DynamoDB**: Data storage for matches and user profiles
- **Amazon SES**: Email notifications
- **Next.js**: React frontend application

## 📋 Prerequisites

Before you begin, ensure you have:

1. **AWS Account** - Create one at [aws.amazon.com](https://aws.amazon.com)
2. **AWS CLI** - Install from [aws.amazon.com/cli](https://aws.amazon.com/cli)
3. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org)
4. **Git** - Install from [git-scm.com](https://git-scm.com)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd crowd-catcher
```

### 2. Configure AWS CLI

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (us-east-1 recommended)
- Default output format (json)

### 3. Deploy Infrastructure

```bash
# Make deployment script executable (Linux/Mac)
chmod +x deploy.sh

# Deploy everything
./deploy.sh dev
```

This will:
- Deploy the complete AWS infrastructure using CloudFormation
- Create all necessary services (Cognito, S3, Lambda, etc.)
- Set up environment variables
- Install dependencies
- Build the application

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Manual Configuration

After deployment, you'll need to configure a few things manually:

### 1. Amazon SES Email Verification

```bash
# Verify your email address for sending notifications
aws ses verify-email-identity --email-address your-email@domain.com

# For production, verify your domain
aws ses verify-domain-identity --domain yourdomain.com
```

### 2. S3 Event Notifications

Configure S3 to trigger Lambda functions when photos are uploaded:

```bash
# Get your Lambda function ARNs from the CloudFormation outputs
aws cloudformation describe-stacks --stack-name crowd-catcher-stack --query 'Stacks[0].Outputs'
```

Then set up the event notifications in the AWS Console or using the AWS CLI.

## 📁 Project Structure

```
crowd-catcher/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Home page
│   │   ├── upload/            # Profile photo upload
│   │   ├── gallery/           # Photo gallery
│   │   └── notifications/      # Notifications page
│   └── lib/                   # Utility functions
│       ├── api.ts            # API client
│       └── upload.ts         # File upload utilities
├── lambda/                  # AWS Lambda functions
│   ├── generatePresignedUrl.js
│   ├── indexUserFace.js
│   ├── processEventPhoto.js
│   ├── getGalleryPhotos.js
│   └── updateMatchStatus.js
├── infrastructure.yaml       # CloudFormation template
├── deploy.sh                # Deployment script
└── package.json
```

## 🔐 Security Features

- **IAM Roles**: Least privilege access for all services
- **Cognito Authentication**: Secure user management
- **S3 Bucket Policies**: Restricted access with presigned URLs
- **API Gateway Authorization**: JWT token validation
- **Data Encryption**: S3 and DynamoDB encryption at rest

## 💰 Cost Estimation

### Free Tier (First 12 months):
- **S3**: 5GB storage, 20,000 GET requests, 2,000 PUT requests
- **Lambda**: 1M requests, 400,000 GB-seconds
- **DynamoDB**: 25GB storage, 25 RCU, 25 WCU
- **Rekognition**: 5,000 images per month
- **SES**: 62,000 emails per month

### Estimated Monthly Cost (after free tier):
- **S3**: ~$0.50-2.00 (depending on storage)
- **Lambda**: ~$0.20-1.00 (depending on usage)
- **DynamoDB**: ~$1.00-5.00 (depending on reads/writes)
- **Rekognition**: ~$1.00-10.00 (depending on image processing)
- **SES**: ~$0.10 per 1,000 emails

**Total estimated cost: $3-20/month** (depending on usage)

## 🧪 Testing

1. **Create User Account**: Sign up with email and password
2. **Upload Profile Photos**: Upload 10 clear photos of yourself
3. **Upload Event Photo**: Upload a crowd photo containing your face
4. **Check Gallery**: View the identified photo in your gallery
5. **Test Notifications**: Check email for identification alerts

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors**: Check S3 bucket CORS configuration
2. **Permission Denied**: Verify IAM roles and policies
3. **Lambda Timeouts**: Increase timeout in Lambda configuration
4. **SES Sandbox**: Request production access for sending to any email
5. **Rekognition Limits**: Check service limits in AWS Console

### Getting Help:

- AWS Documentation: [docs.aws.amazon.com](https://docs.aws.amazon.com)
- AWS Support: Available in AWS Console
- Stack Overflow: Tag questions with `aws`, `rekognition`, `lambda`

## 📚 API Endpoints

- `POST /upload-url` - Get presigned URL for photo upload
- `GET /gallery` - Get user's identified photos
- `POST /match-status` - Update match status (accept/decline)
- `GET /notifications` - Get user notifications

## 🔄 Development Workflow

1. **Make Changes**: Edit code in `src/` or `lambda/`
2. **Test Locally**: Run `npm run dev`
3. **Deploy Updates**: Run `./deploy.sh dev` to update infrastructure
4. **Test in AWS**: Verify functionality in the deployed environment

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For questions or issues:
- Create an issue in this repository
- Check the AWS documentation
- Contact the development team

---

**Built with ❤️ for the Hack The Heights Hackathon 2025**
