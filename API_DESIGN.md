# API Design - REST API Specification

## Base URL
```
Production: https://api.expense-tracker.com/v1
Development: https://dev-api.expense-tracker.com/v1
Local: http://localhost:3000/v1
```

## Authentication
All endpoints require authentication (optional for MVP, required for production)
```
Authorization: Bearer <JWT_TOKEN>
```

## Common Headers
```
Content-Type: application/json
Accept: application/json
```

---

## 1. Expense Endpoints

### 1.1 Create Expense
**POST** `/expenses`

#### Request Body
```json
{
  "amount": 1250.50,
  "category": "Food",
  "description": "Grocery shopping at Whole Foods",
  "date": "2024-05-15T10:30:00.000Z",
  "paymentMode": "Credit Card"
}
```

#### Validation Rules
- `amount`: Required, number, > 0, max 2 decimal places
- `category`: Required, string, must be from predefined list
- `description`: Optional, string, max 500 characters
- `date`: Required, ISO 8601 date string
- `paymentMode`: Optional, string, from predefined list

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "expenseId": "exp-550e8400-e29b-41d4-a716-446655440000",
    "amount": 1250.50,
    "category": "Food",
    "description": "Grocery shopping at Whole Foods",
    "date": "2024-05-15T10:30:00.000Z",
    "paymentMode": "Credit Card",
    "year": 2024,
    "month": 5,
    "createdAt": "2024-05-15T10:30:00.000Z",
    "updatedAt": "2024-05-15T10:30:00.000Z"
  },
  "message": "Expense created successfully"
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be greater than 0"
      }
    ]
  }
}
```

---

### 1.2 Get Expenses
**GET** `/expenses?month=5&year=2024`

#### Query Parameters
- `month`: Required, number (1-12)
- `year`: Required, number (2000-2100)
- `category`: Optional, string (filter by category)

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "expenseId": "exp-550e8400-e29b-41d4-a716-446655440000",
        "amount": 1250.50,
        "category": "Food",
        "description": "Grocery shopping",
        "date": "2024-05-15T10:30:00.000Z",
        "paymentMode": "Credit Card",
        "year": 2024,
        "month": 5,
        "createdAt": "2024-05-15T10:30:00.000Z",
        "updatedAt": "2024-05-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "month": 5,
    "year": 2024
  }
}
```

---

### 1.3 Get Single Expense
**GET** `/expenses/{expenseId}`

#### Path Parameters
- `expenseId`: Required, UUID string

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "expenseId": "exp-550e8400-e29b-41d4-a716-446655440000",
    "amount": 1250.50,
    "category": "Food",
    "description": "Grocery shopping",
    "date": "2024-05-15T10:30:00.000Z",
    "paymentMode": "Credit Card",
    "year": 2024,
    "month": 5,
    "createdAt": "2024-05-15T10:30:00.000Z",
    "updatedAt": "2024-05-15T10:30:00.000Z"
  }
}
```

#### Error Response (404 Not Found)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Expense not found"
  }
}
```

---

### 1.4 Update Expense
**PUT** `/expenses/{expenseId}`

#### Request Body
```json
{
  "amount": 1500.00,
  "category": "Food",
  "description": "Updated description",
  "date": "2024-05-15T10:30:00.000Z",
  "paymentMode": "Debit Card"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "expenseId": "exp-550e8400-e29b-41d4-a716-446655440000",
    "amount": 1500.00,
    "category": "Food",
    "description": "Updated description",
    "date": "2024-05-15T10:30:00.000Z",
    "paymentMode": "Debit Card",
    "year": 2024,
    "month": 5,
    "createdAt": "2024-05-15T10:30:00.000Z",
    "updatedAt": "2024-05-16T14:20:00.000Z"
  },
  "message": "Expense updated successfully"
}
```

---

### 1.5 Delete Expense
**DELETE** `/expenses/{expenseId}`

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

---

## 2. Budget Endpoints

### 2.1 Create/Update Budget
**POST** `/budgets`

#### Request Body
```json
{
  "category": "Food",
  "monthlyLimit": 5000,
  "month": 5,
  "year": 2024
}
```

#### Validation Rules
- `category`: Required, string, from predefined list
- `monthlyLimit`: Required, number, > 0
- `month`: Required, number (1-12)
- `year`: Required, number (2000-2100)

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "budgetId": "budget-660e8400-e29b-41d4-a716-446655440001",
    "category": "Food",
    "monthlyLimit": 5000,
    "month": 5,
    "year": 2024,
    "createdAt": "2024-05-01T00:00:00.000Z",
    "updatedAt": "2024-05-01T00:00:00.000Z"
  },
  "message": "Budget created successfully"
}
```

---

### 2.2 Get Budgets
**GET** `/budgets?month=5&year=2024`

#### Query Parameters
- `month`: Required, number (1-12)
- `year`: Required, number (2000-2100)

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "budgets": [
      {
        "budgetId": "budget-660e8400-e29b-41d4-a716-446655440001",
        "category": "Food",
        "monthlyLimit": 5000,
        "spent": 3250.50,
        "remaining": 1749.50,
        "percentageUsed": 65.01,
        "isOverBudget": false,
        "month": 5,
        "year": 2024
      },
      {
        "budgetId": "budget-660e8400-e29b-41d4-a716-446655440002",
        "category": "Transportation",
        "monthlyLimit": 2000,
        "spent": 2150.00,
        "remaining": -150.00,
        "percentageUsed": 107.5,
        "isOverBudget": true,
        "month": 5,
        "year": 2024
      }
    ],
    "totalBudget": 7000,
    "totalSpent": 5400.50,
    "totalRemaining": 1599.50,
    "month": 5,
    "year": 2024
  }
}
```

---

### 2.3 Delete Budget
**DELETE** `/budgets/{budgetId}`

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Budget deleted successfully"
}
```

---

## 3. Analytics Endpoints

### 3.1 Get Monthly Analytics
**GET** `/analytics?month=5&year=2024`

#### Query Parameters
- `month`: Required, number (1-12)
- `year`: Required, number (2000-2100)

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalExpenses": 15750.50,
      "totalBudget": 20000,
      "totalSavings": 4249.50,
      "savingsPercentage": 21.25,
      "expenseCount": 45,
      "month": 5,
      "year": 2024
    },
    "categoryBreakdown": [
      {
        "category": "Food",
        "amount": 5250.50,
        "percentage": 33.33,
        "budget": 6000,
        "remaining": 749.50,
        "isOverBudget": false
      },
      {
        "category": "Transportation",
        "amount": 3500.00,
        "percentage": 22.22,
        "budget": 3000,
        "remaining": -500.00,
        "isOverBudget": true
      }
    ],
    "topCategories": [
      {
        "category": "Food",
        "amount": 5250.50,
        "percentage": 33.33
      },
      {
        "category": "Transportation",
        "amount": 3500.00,
        "percentage": 22.22
      },
      {
        "category": "Shopping",
        "amount": 2800.00,
        "percentage": 17.78
      }
    ],
    "paymentModeBreakdown": [
      {
        "mode": "Credit Card",
        "amount": 8500.00,
        "percentage": 53.97
      },
      {
        "mode": "UPI",
        "amount": 4250.50,
        "percentage": 26.99
      },
      {
        "mode": "Cash",
        "amount": 3000.00,
        "percentage": 19.04
      }
    ],
    "dailyExpenses": [
      {
        "date": "2024-05-01",
        "amount": 450.00
      },
      {
        "date": "2024-05-02",
        "amount": 780.50
      }
    ]
  }
}
```

---

### 3.2 Get Trend Analysis
**GET** `/analytics/trends?startMonth=1&startYear=2024&endMonth=5&endYear=2024`

#### Query Parameters
- `startMonth`: Required, number (1-12)
- `startYear`: Required, number
- `endMonth`: Required, number (1-12)
- `endYear`: Required, number

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "monthlyTrends": [
      {
        "month": 1,
        "year": 2024,
        "totalExpenses": 12500.00,
        "totalBudget": 20000,
        "savings": 7500.00
      },
      {
        "month": 2,
        "year": 2024,
        "totalExpenses": 14200.00,
        "totalBudget": 20000,
        "savings": 5800.00
      }
    ],
    "categoryTrends": [
      {
        "category": "Food",
        "data": [
          { "month": 1, "year": 2024, "amount": 4500.00 },
          { "month": 2, "year": 2024, "amount": 5200.00 }
        ]
      }
    ],
    "averageMonthlyExpense": 13850.00,
    "highestSpendingMonth": {
      "month": 5,
      "year": 2024,
      "amount": 15750.50
    },
    "lowestSpendingMonth": {
      "month": 1,
      "year": 2024,
      "amount": 12500.00
    }
  }
}
```

---

## 4. Utility Endpoints

### 4.1 Get Categories
**GET** `/categories`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "categories": [
      "Food",
      "Transportation",
      "Housing",
      "Utilities",
      "Healthcare",
      "Entertainment",
      "Shopping",
      "Education",
      "Insurance",
      "Savings",
      "Other"
    ]
  }
}
```

---

### 4.2 Get Payment Modes
**GET** `/payment-modes`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "paymentModes": [
      "Cash",
      "Credit Card",
      "Debit Card",
      "UPI",
      "Net Banking",
      "Wallet",
      "Other"
    ]
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| NOT_FOUND | 404 | Resource not found |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| INTERNAL_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

---

## Rate Limiting

- **Rate**: 100 requests per minute per user
- **Burst**: 200 requests
- **Header**: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## CORS Configuration

```
Access-Control-Allow-Origin: https://expense-tracker.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

---

## API Versioning

- Current version: v1
- Version in URL: `/v1/expenses`
- Backward compatibility: Maintained for 1 year
- Deprecation notice: 6 months before removal
