# Setup Guide - Feature Flag Management System

## Tổng quan

Hướng dẫn này sẽ giúp bạn thiết lập và triển khai hệ thống Feature Flag Management với AWS AppConfig từ A-Z.

## Yêu cầu hệ thống

### Prerequisites
- **Node.js** 16.x hoặc cao hơn
- **AWS CLI** được cấu hình
- **AWS Account** với quyền truy cập AppConfig, CloudWatch, Lambda
- **Git** để clone repository

### AWS Permissions cần thiết
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "appconfig:*",
        "cloudwatch:*",
        "lambda:*",
        "sns:*",
        "logs:*",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```

## Bước 1: Chuẩn bị AWS Environment

### 1.1 Cấu hình AWS CLI
```bash
aws configure
# Nhập Access Key ID, Secret Access Key, Region (us-east-1)
```

### 1.2 Tạo AWS AppConfig Application
```bash
cd aws-config
chmod +x deploy-appconfig.sh
./deploy-appconfig.sh
```

### 1.3 Thiết lập CloudWatch Monitoring
```bash
chmod +x setup-cloudwatch.sh
./setup-cloudwatch.sh
```

## Bước 2: Cài đặt Backend

### 2.1 Cài đặt dependencies
```bash
cd backend
npm install
```

### 2.2 Cấu hình Environment Variables
Tạo file `.env` từ template:
```bash
cp config/.env.example .env
```

Chỉnh sửa `.env` file:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_ACCOUNT_ID=your-account-id

# AppConfig Configuration
APPCONFIG_APPLICATION=feature-flag-app
APPCONFIG_ENVIRONMENT=production
APPCONFIG_PROFILE=feature-flags
```

### 2.3 Khởi chạy Backend
```bash
npm start
```

Kiểm tra health check:
```bash
curl http://localhost:3000/api/health
```

## Bước 3: Cài đặt Frontend (Optional)

### 3.1 Tạo React App
```bash
npx create-react-app frontend
cd frontend
npm install axios chart.js react-chartjs-2
```

### 3.2 Cấu hình Environment
Tạo file `.env`:
```env
REACT_APP_API_URL=http://localhost:3000/api
```

### 3.3 Khởi chạy Frontend
```bash
npm start
```

## Bước 4: Triển khai Lambda Function

### 4.1 Tạo Lambda Function
```bash
cd aws-config/lambda
zip -r rollback-function.zip rollback-function.js
```

### 4.2 Deploy Lambda
```bash
aws lambda create-function \
  --function-name feature-flag-rollback \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR-ACCOUNT:role/lambda-execution-role \
  --handler rollback-function.handler \
  --zip-file fileb://rollback-function.zip \
  --environment Variables='{
    "APPCONFIG_APPLICATION":"feature-flag-app",
    "APPCONFIG_ENVIRONMENT":"production",
    "APPCONFIG_PROFILE":"feature-flags",
    "SNS_TOPIC_ARN":"arn:aws:sns:us-east-1:YOUR-ACCOUNT:feature-flag-alerts"
  }'
```

### 4.3 Cấu hình SNS Trigger
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR-ACCOUNT:feature-flag-alerts \
  --protocol lambda \
  --notification-endpoint arn:aws:lambda:us-east-1:YOUR-ACCOUNT:function:feature-flag-rollback
```

## Bước 5: Testing và Validation

### 5.1 Test API Endpoints
```bash
# Get all feature flags
curl http://localhost:3000/api/feature-flags

# Evaluate feature flag
curl -X POST http://localhost:3000/api/feature-flags/enhanced-search/evaluate \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "userGroups": ["beta-users"]}'

# Update rollout percentage
curl -X PUT http://localhost:3000/api/feature-flags/enhanced-search/rollout \
  -H "Content-Type: application/json" \
  -d '{"percentage": 50}'
```

### 5.2 Test A/B Testing
```bash
curl -X POST http://localhost:3000/api/feature-flags/premium-features/evaluate \
  -H "Content-Type: application/json" \
  -d '{"userId": "user456", "userGroups": ["premium-users"]}'
```

### 5.3 Test Automated Rollback
```bash
# Trigger high error rate to test rollback
for i in {1..100}; do
  curl http://localhost:3000/api/feature-flags/non-existent-flag &
done
```

## Bước 6: Monitoring

### 6.1 CloudWatch Dashboard
Truy cập: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=FeatureFlags-Dashboard

### 6.2 Metrics hiện có
- **TotalRequests**: Tổng số requests
- **ErrorRate**: Tỷ lệ lỗi (%)
- **ResponseTime**: Thời gian phản hồi (ms)
- **FeatureFlagEvaluations**: Số lần đánh giá feature flags
- **MemoryUsage**: Sử dụng memory (MB)

### 6.3 Alarms
- **FeatureFlags-HighErrorRate**: Cảnh báo khi error rate > 5%
- **FeatureFlags-HighResponseTime**: Cảnh báo khi response time > 5s
- **FeatureFlags-HighMemoryUsage**: Cảnh báo khi memory > 80%

## Bước 7: Production Deployment

### 7.1 Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 7.2 Build và Deploy
```bash
docker build -t feature-flag-management .
docker run -p 3000:3000 --env-file .env feature-flag-management
```

### 7.3 AWS ECS/EKS Deployment
```yaml
# kubernetes-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: feature-flag-management
spec:
  replicas: 3
  selector:
    matchLabels:
      app: feature-flag-management
  template:
    metadata:
      labels:
        app: feature-flag-management
    spec:
      containers:
      - name: app
        image: feature-flag-management:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: AWS_REGION
          value: "us-east-1"
```

## Troubleshooting

### Lỗi thường gặp

#### 1. AWS Credentials không hợp lệ
```bash
Error: The security token included in the request is invalid
```
**Giải pháp**: Kiểm tra AWS CLI configuration
```bash
aws configure list
aws sts get-caller-identity
```

#### 2. AppConfig Application không tồn tại
```bash
Error: Application not found
```
**Giải pháp**: Chạy lại deploy script
```bash
./deploy-appconfig.sh
```

#### 3. Lambda Function timeout
```bash
Error: Task timed out after 30.00 seconds
```
**Giải pháp**: Tăng timeout cho Lambda function
```bash
aws lambda update-function-configuration \
  --function-name feature-flag-rollback \
  --timeout 60
```

#### 4. High Memory Usage
```bash
Error: JavaScript heap out of memory
```
**Giải pháp**: Tăng memory limit cho Node.js
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Debug Commands

#### Check AWS Services
```bash
# Check AppConfig
aws appconfig list-applications

# Check CloudWatch metrics
aws cloudwatch list-metrics --namespace FeatureFlags

# Check Lambda function
aws lambda get-function --function-name feature-flag-rollback
```

#### Check Application Health
```bash
# Health check
curl http://localhost:3000/api/health

# Metrics
curl http://localhost:3000/api/metrics

# Feature flags
curl http://localhost:3000/api/feature-flags/stats
```

## Best Practices

### 1. Security
- Sử dụng IAM roles thay vì hardcode credentials
- Enable CloudTrail để audit
- Encrypt sensitive data

### 2. Performance
- Sử dụng cache để reduce AWS API calls
- Implement proper error handling
- Monitor memory usage

### 3. Monitoring
- Set up proper alerting thresholds
- Monitor business metrics
- Regular health checks

### 4. Deployment
- Use blue-green deployment
- Implement proper rollback strategy
- Test in staging environment first

## Kết luận

Sau khi hoàn thành setup guide này, bạn sẽ có một hệ thống Feature Flag Management hoàn chỉnh với:
- ✅ Backend API với Node.js
- ✅ AWS AppConfig integration
- ✅ CloudWatch monitoring
- ✅ Automated rollback
- ✅ A/B testing capabilities
- ✅ Production-ready deployment

Để biết thêm chi tiết, tham khảo [API Documentation](API_DOCUMENTATION.md) và [Architecture Guide](ARCHITECTURE.md). 