# ECTRACC API Documentation

This document provides comprehensive documentation for the ECTRACC backend API.

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-backend.onrender.com/api`

## Authentication

The API uses JWT tokens from Supabase for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication States

- 🔓 **Public**: No authentication required
- 🔒 **Protected**: JWT token required
- 🔐 **Admin**: Admin privileges required

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (development only)",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 requests | 15 minutes |
| Authentication | 5 requests | 15 minutes |
| Profile Updates | 10 requests | 5 minutes |
| Data Tracking | 30 requests | 1 minute |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time

## Endpoints

### Health Check

#### GET /healthcheck 🔓

Check API health and service status.

**Response:**
```json
{
  "success": true,
  "message": "ECTRACC API with MongoDB and Supabase",
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "uptime": 3600000,
    "environment": "production",
    "services": {
      "mongodb": {
        "status": "connected",
        "responseTime": "15ms"
      },
      "supabase": {
        "status": "connected",
        "responseTime": "25ms"
      }
    },
    "responseTime": "45ms"
  }
}
```

#### GET /ping 🔓

Simple ping endpoint for basic connectivity testing.

**Response:**
```json
{
  "success": true,
  "message": "pong",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### User Management

#### GET /users/profile 🔒

Get authenticated user's profile information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "email_confirmed_at": "2025-01-15T10:00:00.000Z",
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:00:00.000Z",
      "last_sign_in_at": "2025-01-15T10:30:00.000Z"
    },
    "profile": {
      "user_id": "user-uuid",
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:00:00.000Z"
    }
  }
}
```

#### PUT /users/profile 🔒

Update authenticated user's profile.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Validation Rules:**
- `full_name`: Required, 1-100 characters, letters/spaces/hyphens/apostrophes only
- `avatar_url`: Optional, must be valid URL

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "user_id": "user-uuid",
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z"
    }
  },
  "message": "Profile updated successfully"
}
```

### Product Search

#### GET /products/search 🔓

Search for products in the database.

**Query Parameters:**
- `q` (string): Search query
- `category` (string): Filter by category
- `brand` (string): Filter by brand
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20, max: 100)
- `sort_by` (string): Sort field (name, carbon_footprint, created_at)
- `sort_order` (string): Sort order (asc, desc)

**Example Request:**
```
GET /products/search?q=apple&category=food&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product-id",
        "name": "Apple",
        "brand": "Generic",
        "category": "food",
        "carbon_footprint": 0.5,
        "unit": "per 100g",
        "barcode": "1234567890123",
        "created_at": "2025-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### GET /products/barcode/:barcode 🔓

Get product by barcode.

**Parameters:**
- `barcode` (string): Product barcode

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "product-id",
      "name": "Apple",
      "brand": "Generic",
      "category": "food",
      "carbon_footprint": 0.5,
      "unit": "per 100g",
      "barcode": "1234567890123",
      "nutritional_info": {
        "calories": 52,
        "protein": 0.3,
        "carbs": 14,
        "fat": 0.2
      },
      "created_at": "2025-01-15T10:00:00.000Z"
    }
  }
}
```

### Carbon Footprint Tracking

#### POST /footprints/track 🔒

Track a new carbon footprint entry.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "manual_item": "Apple",
  "amount": 100,
  "carbon_total": 0.5,
  "category": "food",
  "unit": "g",
  "logged_at": "2025-01-15T10:30:00.000Z"
}
```

**Validation Rules:**
- Either `product_barcode` OR `manual_item` required
- `amount`: Required, positive number
- `carbon_total`: Required, positive number
- `category`: Required, valid category
- `unit`: Optional, default "g"
- `logged_at`: Optional, defaults to current time

**Response:**
```json
{
  "success": true,
  "data": {
    "footprint": {
      "id": "footprint-id",
      "user_id": "user-uuid",
      "manual_item": "Apple",
      "amount": 100,
      "carbon_total": 0.5,
      "category": "food",
      "unit": "g",
      "logged_at": "2025-01-15T10:30:00.000Z",
      "created_at": "2025-01-15T10:30:00.000Z"
    }
  },
  "message": "Footprint tracked successfully"
}
```

#### GET /footprints/history 🔒

Get user's footprint history with aggregation.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `period` (string): Aggregation period (daily, weekly, monthly)
- `start_date` (string): Start date (ISO format)
- `end_date` (string): End date (ISO format)
- `page` (number): Page number
- `limit` (number): Results per page

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "period": "2025-01-15",
        "total_carbon": 2.5,
        "entry_count": 3,
        "categories": {
          "food": 1.5,
          "transport": 1.0
        }
      }
    ],
    "summary": {
      "total_carbon": 2.5,
      "total_entries": 3,
      "period_start": "2025-01-15T00:00:00.000Z",
      "period_end": "2025-01-15T23:59:59.000Z"
    }
  }
}
```

### Goals Management

#### GET /footprints/goals 🔒

Get user's carbon footprint goals.

**Response:**
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "goal-id",
        "user_id": "user-uuid",
        "target_value": 10.0,
        "timeframe": "weekly",
        "description": "Weekly carbon limit",
        "created_at": "2025-01-15T10:00:00.000Z",
        "updated_at": "2025-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

#### POST /footprints/goals 🔒

Create or update a carbon footprint goal.

**Request Body:**
```json
{
  "target_value": 10.0,
  "timeframe": "weekly",
  "description": "Weekly carbon limit"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "goal": {
      "id": "goal-id",
      "user_id": "user-uuid",
      "target_value": 10.0,
      "timeframe": "weekly",
      "description": "Weekly carbon limit",
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z"
    }
  },
  "message": "Goal created successfully"
}
```

## Error Codes

| HTTP Status | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request data or validation failed |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## Common Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Full name is required",
    "Avatar URL must be a valid URL"
  ],
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "error": "Authorization token required",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Rate Limit Error (429)
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
class EctraccAPI {
  private baseURL: string;
  private token?: string;

  constructor(baseURL: string, token?: string) {
    this.baseURL = baseURL;
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(profileData: { full_name: string; avatar_url?: string }) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async trackFootprint(footprintData: any) {
    return this.request('/footprints/track', {
      method: 'POST',
      body: JSON.stringify(footprintData),
    });
  }
}

// Usage
const api = new EctraccAPI('https://api.ectracc.com', 'your-jwt-token');
const profile = await api.getProfile();
```

### cURL Examples

```bash
# Get health status
curl -X GET https://api.ectracc.com/healthcheck

# Get user profile
curl -X GET https://api.ectracc.com/users/profile \
  -H "Authorization: Bearer your-jwt-token"

# Update profile
curl -X PUT https://api.ectracc.com/users/profile \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "John Doe"}'

# Track footprint
curl -X POST https://api.ectracc.com/footprints/track \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "manual_item": "Apple",
    "amount": 100,
    "carbon_total": 0.5,
    "category": "food"
  }'
```

## Testing

### Health Check Test
```bash
curl -X GET https://api.ectracc.com/healthcheck
```

Expected response should include `"success": true` and service status information.

### Authentication Test
```bash
curl -X GET https://api.ectracc.com/users/profile \
  -H "Authorization: Bearer invalid-token"
```

Expected response: `401 Unauthorized` with authentication error.

## Support

For API support:
1. Check this documentation
2. Verify your authentication token
3. Check rate limits
4. Review error messages
5. Test with minimal requests first

## Changelog

### v2.0.0 (Current)
- Added comprehensive input validation
- Implemented standardized error responses
- Added rate limiting
- Enhanced security headers
- Improved logging and monitoring

### v1.0.0
- Initial API release
- Basic CRUD operations
- JWT authentication
- Product search functionality
