# Deployment Guide

## Prerequisites

- Node.js 18+
- AWS CLI configured with credentials
- AWS SAM CLI installed
- npm or yarn

## Step 1: Deploy Backend

### 1.1 Install Dependencies
```bash
cd expense-tracker-backend
npm install
```

### 1.2 Build TypeScript
```bash
npm run build
```

### 1.3 Deploy with SAM
```bash
cd ../expense-tracker-infrastructure
sam build
sam deploy --guided
```

During guided deployment, provide:
- Stack Name: `expense-tracker-stack`
- AWS Region: `us-east-1` (or your preferred region)
- Confirm changes: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Save arguments to configuration file: `Y`

### 1.4 Note the API Endpoint
After deployment, SAM will output the API Gateway endpoint URL. Save this for frontend configuration.

Example output:
```
Outputs:
ApiEndpoint: https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/
```

## Step 2: Deploy Frontend

### 2.1 Install Dependencies
```bash
cd expense-tracker-frontend
npm install
```

### 2.2 Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and add your API endpoint:
```
VITE_API_BASE_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

### 2.3 Build for Production
```bash
npm run build
```

### 2.4 Deploy to S3 (Optional)

Create S3 bucket:
```bash
aws s3 mb s3://expense-tracker-frontend-bucket
```

Enable static website hosting:
```bash
aws s3 website s3://expense-tracker-frontend-bucket --index-document index.html
```

Upload build files:
```bash
aws s3 sync dist/ s3://expense-tracker-frontend-bucket --acl public-read
```

### 2.5 Setup CloudFront (Optional)

Create CloudFront distribution pointing to S3 bucket for HTTPS and CDN benefits.

## Step 3: Test the Application

### 3.1 Run Frontend Locally
```bash
cd expense-tracker-frontend
npm run dev
```

Access at: http://localhost:3000

### 3.2 Test API Endpoints

Test expense creation:
```bash
curl -X POST https://your-api-endpoint/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "category": "Food",
    "description": "Test expense",
    "date": "2024-05-15T10:00:00.000Z",
    "paymentMode": "Cash"
  }'
```

## Step 4: Seed Sample Data (Optional)

Use the seed data script to populate test data:

```bash
cd expense-tracker-infrastructure/scripts

# For each expense in seed-data.json
curl -X POST https://your-api-endpoint/expenses \
  -H "Content-Type: application/json" \
  -d @seed-data.json
```

## Step 5: Monitor and Verify

### Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/expense-tracker-stack-ExpenseFunction --follow
```

### Check DynamoDB Table
```bash
aws dynamodb scan --table-name ExpenseTrackerTable --limit 10
```

## Troubleshooting

### Backend Issues

1. **Lambda timeout**: Increase timeout in template.yaml
2. **DynamoDB access denied**: Check IAM policies in SAM template
3. **CORS errors**: Verify CORS configuration in API Gateway

### Frontend Issues

1. **API connection failed**: Verify VITE_API_BASE_URL in .env
2. **Build errors**: Clear node_modules and reinstall
3. **Chart not rendering**: Check recharts installation

## Cleanup

To remove all resources:

```bash
cd expense-tracker-infrastructure
sam delete
```

Delete S3 bucket (if created):
```bash
aws s3 rb s3://expense-tracker-frontend-bucket --force
```

## Cost Monitoring

Monitor costs in AWS Cost Explorer:
- DynamoDB: On-demand pricing
- Lambda: Per invocation
- API Gateway: Per request
- S3: Storage and data transfer
- CloudFront: Data transfer

Expected monthly cost for 1000 users: ~$1.39

## Production Checklist

- [ ] Enable CloudWatch alarms
- [ ] Setup backup for DynamoDB
- [ ] Configure custom domain
- [ ] Enable AWS WAF for API Gateway
- [ ] Setup CI/CD pipeline
- [ ] Enable X-Ray tracing
- [ ] Configure Cognito for authentication
- [ ] Setup monitoring dashboard
- [ ] Enable DynamoDB point-in-time recovery
- [ ] Configure CloudFront with SSL certificate
