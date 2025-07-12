# API Documentation - Feature Flag Management System

## Tổng quan

Feature Flag Management System cung cấp REST API để quản lý feature flags, A/B testing, và gradual rollouts. API được thiết kế để tích hợp dễ dàng với applications và support real-time configuration changes.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Hiện tại API không yêu cầu authentication trong development mode. Trong production, recommend sử dụng AWS IAM hoặc JWT tokens.

## Response Format

Tất cả API responses đều follow consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## API Endpoints

### Health Check

#### GET /api/health
Kiểm tra trạng thái hệ thống và AWS services.

**Response:**
```json
{
  "status": "healthy",
  "responseTime": "23ms",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "application": {
      "status": "healthy",
      "uptime": 3600,
      "version": "1.0.0",
      "nodeVersion": "v18.17.0",
      "memory": {
        "rss": 45678592,
        "heapTotal": 29417472,
        "heapUsed": 20123456
      }
    },
    "aws": {
      "status": "healthy",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "services": {
        "appConfig": "connected",
        "cloudWatch": "connected"
      }
    }
  }
}
```

### Feature Flags Management

#### GET /api/feature-flags
Lấy danh sách tất cả feature flags.

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "flags": {
      "new-ui-design": {
        "enabled": false,
        "rolloutPercentage": 0,
        "targeting": {
          "userGroups": [],
          "userIds": []
        },
        "variants": [
          {
            "name": "control",
            "weight": 50
          },
          {
            "name": "variant-a",
            "weight": 50
          }
        ],
        "metadata": {
          "description": "New UI Design Feature",
          "owner": "frontend-team",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      }
    },
    "cacheInfo": {
      "lastUpdated": "2024-01-01T00:00:00.000Z",
      "totalFlags": 3
    }
  }
}
```

#### GET /api/feature-flags/stats
Lấy thống kê tổng quan về feature flags.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFlags": 3,
    "enabledFlags": 2,
    "disabledFlags": 1,
    "partialRollouts": 1,
    "abTestFlags": 2,
    "cacheInfo": {
      "lastUpdated": "2024-01-01T00:00:00.000Z",
      "version": "1.0.0"
    }
  }
}
```

#### GET /api/feature-flags/:flagName
Lấy thông tin chi tiết của một feature flag.

**Parameters:**
- `flagName` (string): Tên của feature flag

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "enhanced-search",
    "enabled": true,
    "rolloutPercentage": 25,
    "targeting": {
      "userGroups": ["beta-users"],
      "userIds": []
    },
    "variants": [
      {
        "name": "control",
        "weight": 100
      }
    ],
    "metadata": {
      "description": "Enhanced Search Functionality",
      "owner": "search-team",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### POST /api/feature-flags/:flagName
Tạo mới hoặc cập nhật feature flag.

**Parameters:**
- `flagName` (string): Tên của feature flag

**Request Body:**
```json
{
  "enabled": true,
  "rolloutPercentage": 50,
  "targeting": {
    "userGroups": ["beta-users", "premium-users"],
    "userIds": ["user123", "user456"]
  },
  "variants": [
    {
      "name": "control",
      "weight": 60
    },
    {
      "name": "variant-a",
      "weight": 40
    }
  ],
  "metadata": {
    "description": "New feature description",
    "owner": "team-name"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "enhanced-search",
    "enabled": true,
    "rolloutPercentage": 50,
    "targeting": {
      "userGroups": ["beta-users", "premium-users"],
      "userIds": ["user123", "user456"]
    },
    "variants": [
      {
        "name": "control",
        "weight": 60
      },
      {
        "name": "variant-a",
        "weight": 40
      }
    ],
    "metadata": {
      "description": "New feature description",
      "owner": "team-name",
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Feature flag updated successfully"
}
```

#### DELETE /api/feature-flags/:flagName
Xóa feature flag.

**Parameters:**
- `flagName` (string): Tên của feature flag

**Response:**
```json
{
  "success": true,
  "message": "Feature flag 'enhanced-search' deleted successfully"
}
```

### Feature Flag Evaluation

#### POST /api/feature-flags/:flagName/evaluate
Đánh giá feature flag cho một user cụ thể.

**Parameters:**
- `flagName` (string): Tên của feature flag

**Request Body:**
```json
{
  "userId": "user123",
  "userGroups": ["beta-users"],
  "userAttributes": {
    "plan": "premium",
    "region": "us-east-1"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "flagName": "enhanced-search",
    "userId": "user123",
    "enabled": true,
    "variant": "control",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/feature-flags/batch-evaluate
Đánh giá multiple feature flags cho một user.

**Request Body:**
```json
{
  "flagNames": ["enhanced-search", "premium-features", "new-ui-design"],
  "userId": "user123",
  "userGroups": ["beta-users"],
  "userAttributes": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "results": {
      "enhanced-search": {
        "enabled": true,
        "variant": "control"
      },
      "premium-features": {
        "enabled": true,
        "variant": "variant-a"
      },
      "new-ui-design": {
        "enabled": false,
        "variant": null
      }
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Rollout Management

#### PUT /api/feature-flags/:flagName/rollout
Cập nhật rollout percentage cho feature flag.

**Parameters:**
- `flagName` (string): Tên của feature flag

**Request Body:**
```json
{
  "percentage": 75
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "enhanced-search",
    "enabled": true,
    "rolloutPercentage": 75,
    "targeting": {
      "userGroups": ["beta-users"],
      "userIds": []
    },
    "variants": [
      {
        "name": "control",
        "weight": 100
      }
    ],
    "metadata": {
      "description": "Enhanced Search Functionality",
      "owner": "search-team",
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Rollout percentage updated to 75%"
}
```

### Cache Management

#### POST /api/feature-flags/refresh
Refresh feature flags cache từ AWS AppConfig.

**Response:**
```json
{
  "success": true,
  "message": "Feature flags cache refreshed successfully"
}
```

### Metrics

#### GET /api/metrics
Lấy application metrics hiện tại.

**Response:**
```json
{
  "success": true,
  "data": {
    "requestCount": 1250,
    "errorCount": 5,
    "featureFlagEvaluations": {
      "enhanced-search": {
        "enabled": 320,
        "disabled": 80,
        "total": 400
      },
      "premium-features": {
        "enabled": 180,
        "disabled": 20,
        "total": 200
      }
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/metrics/cloudwatch
Lấy CloudWatch metrics.

**Query Parameters:**
- `metricName` (string): Tên metric (default: TotalRequests)
- `startTime` (string): Thời gian bắt đầu (ISO 8601)
- `endTime` (string): Thời gian kết thúc (ISO 8601)
- `period` (number): Khoảng thời gian (seconds, default: 300)

**Example:**
```
GET /api/metrics/cloudwatch?metricName=ErrorRate&startTime=2024-01-01T00:00:00.000Z&endTime=2024-01-01T01:00:00.000Z&period=300
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metricName": "ErrorRate",
    "metrics": [
      {
        "Timestamp": "2024-01-01T00:00:00.000Z",
        "Average": 2.5,
        "Sum": 10,
        "Maximum": 5,
        "Minimum": 0
      }
    ],
    "period": 300,
    "startTime": "2024-01-01T00:00:00.000Z",
    "endTime": "2024-01-01T01:00:00.000Z"
  }
}
```

#### GET /api/feature-flags/:flagName/metrics
Lấy metrics cho feature flag cụ thể.

**Parameters:**
- `flagName` (string): Tên của feature flag

**Query Parameters:**
- `startTime` (string): Thời gian bắt đầu (ISO 8601)
- `endTime` (string): Thời gian kết thúc (ISO 8601)
- `period` (number): Khoảng thời gian (seconds, default: 300)

**Response:**
```json
{
  "success": true,
  "data": {
    "flagName": "enhanced-search",
    "metrics": [
      {
        "Timestamp": "2024-01-01T00:00:00.000Z",
        "Average": 120,
        "Sum": 600,
        "Maximum": 150,
        "Minimum": 80
      }
    ],
    "period": 300,
    "startTime": "2024-01-01T00:00:00.000Z",
    "endTime": "2024-01-01T01:00:00.000Z"
  }
}
```

## Error Codes

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid request parameters |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Service temporarily unavailable |

### Custom Error Types

| Error Type | Description |
|------------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `FEATURE_FLAG_NOT_FOUND` | Feature flag does not exist |
| `AWS_SERVICE_ERROR` | AWS service error |
| `CACHE_ERROR` | Cache operation failed |
| `CONFIGURATION_ERROR` | Configuration error |

## Rate Limiting

API có rate limiting để prevent abuse:
- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

class FeatureFlagClient {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
    this.client = axios.create({ baseURL });
  }

  async isFeatureEnabled(flagName, userId, userGroups = []) {
    try {
      const response = await this.client.post(`/feature-flags/${flagName}/evaluate`, {
        userId,
        userGroups
      });
      return response.data.data.enabled;
    } catch (error) {
      console.error('Feature flag evaluation failed:', error);
      return false; // Default to disabled
    }
  }

  async getFeatureVariant(flagName, userId, userGroups = []) {
    try {
      const response = await this.client.post(`/feature-flags/${flagName}/evaluate`, {
        userId,
        userGroups
      });
      return response.data.data.variant;
    } catch (error) {
      console.error('Feature flag evaluation failed:', error);
      return 'control'; // Default to control
    }
  }

  async updateRolloutPercentage(flagName, percentage) {
    try {
      const response = await this.client.put(`/feature-flags/${flagName}/rollout`, {
        percentage
      });
      return response.data.data;
    } catch (error) {
      console.error('Rollout update failed:', error);
      throw error;
    }
  }
}

// Usage
const client = new FeatureFlagClient();

// Check if feature is enabled
const isEnabled = await client.isFeatureEnabled('enhanced-search', 'user123', ['beta-users']);

// Get A/B test variant
const variant = await client.getFeatureVariant('premium-features', 'user123');

// Update rollout percentage
await client.updateRolloutPercentage('enhanced-search', 50);
```

### Python

```python
import requests
import json

class FeatureFlagClient:
    def __init__(self, base_url="http://localhost:3000/api"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def is_feature_enabled(self, flag_name, user_id, user_groups=None):
        try:
            response = self.session.post(
                f"{self.base_url}/feature-flags/{flag_name}/evaluate",
                json={
                    "userId": user_id,
                    "userGroups": user_groups or []
                }
            )
            response.raise_for_status()
            return response.json()["data"]["enabled"]
        except requests.RequestException as e:
            print(f"Feature flag evaluation failed: {e}")
            return False  # Default to disabled
    
    def get_feature_variant(self, flag_name, user_id, user_groups=None):
        try:
            response = self.session.post(
                f"{self.base_url}/feature-flags/{flag_name}/evaluate",
                json={
                    "userId": user_id,
                    "userGroups": user_groups or []
                }
            )
            response.raise_for_status()
            return response.json()["data"]["variant"]
        except requests.RequestException as e:
            print(f"Feature flag evaluation failed: {e}")
            return "control"  # Default to control

# Usage
client = FeatureFlagClient()

# Check if feature is enabled
is_enabled = client.is_feature_enabled('enhanced-search', 'user123', ['beta-users'])

# Get A/B test variant
variant = client.get_feature_variant('premium-features', 'user123')
```

## Best Practices

### 1. Error Handling
Always implement proper error handling và fallback values:

```javascript
async function checkFeature(flagName, userId) {
  try {
    const response = await api.evaluateFeatureFlag(flagName, userId);
    return response.enabled;
  } catch (error) {
    // Log error but don't fail the user experience
    console.error('Feature flag check failed:', error);
    return false; // Safe default
  }
}
```

### 2. Caching
Implement client-side caching để reduce API calls:

```javascript
class FeatureFlagClient {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async isFeatureEnabled(flagName, userId) {
    const cacheKey = `${flagName}:${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.value;
    }

    const result = await this.fetchFeatureFlag(flagName, userId);
    this.cache.set(cacheKey, {
      value: result,
      timestamp: Date.now()
    });
    
    return result;
  }
}
```

### 3. Performance
- Use batch evaluation cho multiple flags
- Implement request timeout
- Use connection pooling

### 4. Security
- Validate user inputs
- Sanitize user attributes
- Implement rate limiting
- Use HTTPS in production

## Changelog

### Version 1.0.0
- Initial API release
- Feature flag CRUD operations
- A/B testing support
- AWS AppConfig integration
- CloudWatch metrics
- Automated rollback

---

Để biết thêm chi tiết về implementation, xem [Setup Guide](SETUP_GUIDE.md) và [Architecture Guide](ARCHITECTURE.md). 