# Web Dashboard Guide - Feature Flag Management

## Tổng quan

Web Dashboard là giao diện quản lý Feature Flag hoàn chỉnh, cho phép bạn tương tác với AWS Console thông qua giao diện web thân thiện. Dashboard cung cấp real-time monitoring, advanced controls, và tích hợp sâu với AWS services.

## Tính năng chính

### 1. **Real-time Dashboard**
- **Live Updates**: Tự động cập nhật dữ liệu real-time qua WebSocket
- **System Health**: Giám sát trạng thái hệ thống liên tục
- **Notifications**: Thông báo ngay lập tức khi có thay đổi
- **Connection Status**: Hiển thị trạng thái kết nối real-time

### 2. **Feature Flag Management**
- **Create/Edit**: Tạo và chỉnh sửa feature flags với giao diện trực quan
- **Toggle Control**: Bật/tắt feature flags một cách dễ dàng
- **Rollout Management**: Điều chỉnh phần trăm rollout với slider
- **Quick Actions**: Các hành động nhanh (0%, 25%, 50%, 75%, 100%)

### 3. **Advanced Controls**
- **A/B Testing**: Cấu hình variants với weight distribution
- **User Targeting**: Target specific user groups hoặc user IDs
- **Environment Management**: Quản lý theo môi trường (dev, staging, prod)
- **Metadata**: Owner, tags, descriptions cho feature flags

### 4. **AWS Console Integration**
- **AppConfig**: Quản lý applications, environments, deployments
- **CloudWatch**: Xem alarms, metrics, system health
- **Lambda**: Invoke functions, view status
- **Direct Links**: Liên kết trực tiếp đến AWS Console

### 5. **Monitoring & Metrics**
- **Performance Charts**: Biểu đồ hiệu suất real-time
- **Usage Statistics**: Thống kê sử dụng feature flags
- **Deployment History**: Lịch sử deployments
- **Error Tracking**: Theo dõi lỗi và rollback events

## Cách sử dụng

### Bước 1: Khởi động Dashboard

```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm start
```

Dashboard sẽ chạy tại `http://localhost:3000`

### Bước 2: Kết nối AWS

Đảm bảo các biến môi trường AWS đã được cấu hình:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
APPCONFIG_APPLICATION=feature-flag-app
APPCONFIG_ENVIRONMENT=production
APPCONFIG_PROFILE=feature-flags
```

### Bước 3: Tạo Feature Flag

1. **Click "Tạo mới"** trên dashboard
2. **Điền thông tin cơ bản**:
   - Tên feature flag (chỉ chứa chữ cái, số, dấu gạch ngang)
   - Mô tả chi tiết
   - Owner và environment
   - Trạng thái enabled/disabled

3. **Cấu hình Rollout**:
   - Sử dụng slider để điều chỉnh phần trăm rollout
   - Rollout từ 0% (không ai thấy) đến 100% (tất cả user)

4. **User Targeting** (Optional):
   - Thêm user groups: `beta-users`, `premium-users`
   - Thêm specific user IDs: `user123`, `admin456`

5. **A/B Testing** (Optional):
   - Tạo variants với tên và weight
   - Đảm bảo tổng weight = 100%
   - Ví dụ: `control` (60%), `variant-a` (40%)

### Bước 4: Quản lý Feature Flags

#### Toggle Feature Flag
- **Click nút toggle** để bật/tắt feature flag
- **Real-time notification** khi thay đổi
- **Automatic sync** với AWS AppConfig

#### Rollout Management
- **Quick buttons**: 0%, 25%, 50%, 75%, 100%
- **Slider control**: Điều chỉnh chính xác phần trăm
- **Progress bar**: Hiển thị trạng thái rollout hiện tại

#### Advanced Operations
- **Edit**: Chỉnh sửa tất cả thông tin feature flag
- **View Metrics**: Xem biểu đồ sử dụng
- **Rollback**: Quay lại version trước (nếu có lỗi)
- **Delete**: Xóa feature flag (cẩn thận!)

### Bước 5: AWS Console Integration

#### AppConfig Management
1. **View Applications**: Danh sách tất cả AppConfig applications
2. **Select Environment**: Chọn environment để xem deployments
3. **Monitor Deployments**: Theo dõi trạng thái deployment real-time
4. **Direct Links**: Click để mở AWS Console

#### CloudWatch Monitoring
1. **View Alarms**: Danh sách tất cả CloudWatch alarms
2. **Alarm Status**: OK, ALARM, INSUFFICIENT_DATA
3. **Metrics**: Load và hiển thị metrics data
4. **Real-time Updates**: Tự động cập nhật trạng thái

#### Lambda Functions
1. **List Functions**: Tất cả Lambda functions
2. **Invoke Function**: Test function trực tiếp từ dashboard
3. **View Logs**: Liên kết đến CloudWatch Logs
4. **Function Details**: Runtime, memory, timeout info

### Bước 6: Real-time Monitoring

#### WebSocket Connection
- **Connection Status**: Hiển thị ở góc trên bên phải
- **Auto Reconnect**: Tự động kết nối lại khi bị mất
- **Health Check**: Ping/pong để kiểm tra kết nối

#### Live Updates
- **Feature Flag Changes**: Cập nhật ngay khi có thay đổi
- **System Health**: Trạng thái services real-time
- **Metrics**: Biểu đồ cập nhật liên tục
- **Notifications**: Toast notifications cho mọi events

#### Event Types
- **Feature Flag**: Created, updated, deleted, toggled
- **Deployment**: Started, completed, failed, stopped
- **System Alert**: Info, warning, error, critical
- **Rollback**: Automated rollback events

## Troubleshooting

### 1. WebSocket Connection Issues
```javascript
// Check connection status
console.log('WebSocket connected:', isConnected);

// Manual reconnect
window.location.reload();
```

### 2. AWS Permission Errors
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify permissions
aws appconfig list-applications
aws cloudwatch describe-alarms
```

### 3. Feature Flag Not Updating
- **Check AWS AppConfig**: Verify deployment completed
- **Refresh Dashboard**: Click "Làm mới" button
- **Check Console**: Look for JavaScript errors

### 4. Real-time Updates Not Working
- **WebSocket Status**: Check connection indicator
- **Browser Console**: Look for WebSocket errors
- **Network**: Verify firewall/proxy settings

## Best Practices

### 1. Feature Flag Naming
```javascript
// Good
"new-checkout-flow"
"enhanced-search-v2"
"payment-gateway-stripe"

// Bad
"feature1"
"test flag"
"NewFeature!!!"
```

### 2. Rollout Strategy
```javascript
// Gradual rollout
0% → 5% → 25% → 50% → 100%

// A/B Testing
control: 50%, variant-a: 50%

// Canary deployment
control: 95%, canary: 5%
```

### 3. User Targeting
```javascript
// User Groups
["beta-users", "premium-subscribers", "internal-team"]

// Specific Users
["admin@company.com", "user123", "test-account"]
```

### 4. Monitoring
- **Set up CloudWatch alarms** cho error rates
- **Monitor rollout metrics** trước khi tăng phần trăm
- **Use automated rollback** cho production features
- **Track conversion metrics** cho A/B tests

## API Reference

### Feature Flags
```javascript
// Get all feature flags
GET /api/feature-flags

// Create feature flag
POST /api/feature-flags/{name}

// Update feature flag
PUT /api/feature-flags/{name}

// Toggle feature flag
PATCH /api/feature-flags/{name}/toggle

// Update rollout percentage
PATCH /api/feature-flags/{name}/rollout
```

### AWS Integration
```javascript
// AppConfig
GET /api/aws/appconfig/applications
GET /api/aws/appconfig/applications/{id}/environments
POST /api/aws/appconfig/applications/{id}/environments/{envId}/deployments

// CloudWatch
GET /api/aws/cloudwatch/alarms
GET /api/aws/cloudwatch/metrics

// Lambda
GET /api/aws/lambda/functions
POST /api/aws/lambda/functions/{name}/invoke
```

### WebSocket Events
```javascript
// Subscribe to updates
socket.emit('subscribe:feature-flags');
socket.emit('subscribe:metrics');
socket.emit('subscribe:system-health');

// Listen for updates
socket.on('feature-flags:update', (data) => {});
socket.on('metrics:update', (data) => {});
socket.on('notification', (notification) => {});
```

## Kết luận

Web Dashboard cung cấp một giải pháp hoàn chỉnh để quản lý Feature Flags với AWS AppConfig. Với real-time monitoring, advanced controls, và tích hợp sâu với AWS services, bạn có thể:

- **Quản lý feature flags** một cách trực quan và hiệu quả
- **Tương tác với AWS Console** mà không cần rời khỏi dashboard
- **Giám sát real-time** với WebSocket connections
- **Thực hiện A/B testing** và gradual rollouts
- **Automated rollback** khi có sự cố

Dashboard này giúp teams phát triển phần mềm triển khai tính năng một cách an toàn, có kiểm soát, và với khả năng quan sát tốt. 