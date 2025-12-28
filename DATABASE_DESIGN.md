# Database Design - DynamoDB Schema

## Table: ExpenseTrackerTable

### Single-Table Design Strategy
Using a single DynamoDB table with composite keys to store both expenses and budgets efficiently.

## Primary Key Structure

| Attribute | Type | Description |
|-----------|------|-------------|
| PK (Partition Key) | String | `USER#{userId}` |
| SK (Sort Key) | String | `EXPENSE#{year}#{month}#{expenseId}` or `BUDGET#{year}#{month}#{category}` |

## Attributes

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| PK | String | Partition key | Yes |
| SK | String | Sort key | Yes |
| entityType | String | `EXPENSE` or `BUDGET` | Yes |
| amount | Number | Amount in currency | Yes |
| category | String | Expense/Budget category | Yes |
| description | String | Description text | No |
| date | String | ISO date string | Yes (Expense) |
| paymentMode | String | Cash, Card, UPI, etc. | No (Expense) |
| year | Number | Year (2024) | Yes |
| month | Number | Month (1-12) | Yes |
| monthlyLimit | Number | Budget limit | Yes (Budget) |
| createdAt | String | ISO timestamp | Yes |
| updatedAt | String | ISO timestamp | Yes |

## Global Secondary Indexes (GSI)

### GSI-1: MonthYearIndex
**Purpose**: Query all expenses/budgets for a specific month and year

| Attribute | Type | Key Type |
|-----------|------|----------|
| GSI1PK | String | Partition Key |
| GSI1SK | String | Sort Key |

- **GSI1PK**: `USER#{userId}#YEAR#{year}#MONTH#{month}`
- **GSI1SK**: `EXPENSE#{timestamp}` or `BUDGET#{category}`

### GSI-2: CategoryIndex
**Purpose**: Query expenses by category across time periods

| Attribute | Type | Key Type |
|-----------|------|----------|
| GSI2PK | String | Partition Key |
| GSI2SK | String | Sort Key |

- **GSI2PK**: `USER#{userId}#CATEGORY#{category}`
- **GSI2SK**: `EXPENSE#{year}#{month}#{timestamp}`

## Access Patterns

### 1. Create Expense
```
PutItem
PK: USER#user123
SK: EXPENSE#2024#05#exp-uuid-1234
```

### 2. Get All Expenses for a Month
```
Query
GSI1PK = USER#user123#YEAR#2024#MONTH#05
GSI1SK begins_with EXPENSE#
```

### 3. Get Single Expense
```
GetItem
PK: USER#user123
SK: EXPENSE#2024#05#exp-uuid-1234
```

### 4. Update Expense
```
UpdateItem
PK: USER#user123
SK: EXPENSE#2024#05#exp-uuid-1234
```

### 5. Delete Expense
```
DeleteItem
PK: USER#user123
SK: EXPENSE#2024#05#exp-uuid-1234
```

### 6. Get Expenses by Category
```
Query
GSI2PK = USER#user123#CATEGORY#Food
GSI2SK begins_with EXPENSE#2024#05
```

### 7. Set Monthly Budget
```
PutItem
PK: USER#user123
SK: BUDGET#2024#05#Food
```

### 8. Get All Budgets for a Month
```
Query
GSI1PK = USER#user123#YEAR#2024#MONTH#05
GSI1SK begins_with BUDGET#
```

### 9. Get Category Budget
```
GetItem
PK: USER#user123
SK: BUDGET#2024#05#Food
```

### 10. Get Analytics Data
```
Query (Multiple)
1. Get all expenses for month (GSI1)
2. Get all budgets for month (GSI1)
3. Aggregate in application layer
```

## Sample Data Items

### Expense Item
```json
{
  "PK": "USER#user123",
  "SK": "EXPENSE#2024#05#exp-550e8400-e29b-41d4-a716-446655440000",
  "GSI1PK": "USER#user123#YEAR#2024#MONTH#05",
  "GSI1SK": "EXPENSE#2024-05-15T10:30:00.000Z",
  "GSI2PK": "USER#user123#CATEGORY#Food",
  "GSI2SK": "EXPENSE#2024#05#2024-05-15T10:30:00.000Z",
  "entityType": "EXPENSE",
  "expenseId": "exp-550e8400-e29b-41d4-a716-446655440000",
  "amount": 1250.50,
  "category": "Food",
  "description": "Grocery shopping at Whole Foods",
  "date": "2024-05-15T10:30:00.000Z",
  "paymentMode": "Card",
  "year": 2024,
  "month": 5,
  "createdAt": "2024-05-15T10:30:00.000Z",
  "updatedAt": "2024-05-15T10:30:00.000Z"
}
```

### Budget Item
```json
{
  "PK": "USER#user123",
  "SK": "BUDGET#2024#05#Food",
  "GSI1PK": "USER#user123#YEAR#2024#MONTH#05",
  "GSI1SK": "BUDGET#Food",
  "entityType": "BUDGET",
  "budgetId": "budget-660e8400-e29b-41d4-a716-446655440001",
  "category": "Food",
  "monthlyLimit": 5000,
  "year": 2024,
  "month": 5,
  "createdAt": "2024-05-01T00:00:00.000Z",
  "updatedAt": "2024-05-01T00:00:00.000Z"
}
```

## Categories (Predefined)

```typescript
export const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Insurance',
  'Savings',
  'Other'
] as const;
```

## Payment Modes

```typescript
export const PAYMENT_MODES = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'UPI',
  'Net Banking',
  'Wallet',
  'Other'
] as const;
```

## DynamoDB Configuration

### Table Settings
- **Billing Mode**: On-Demand (Pay per request)
- **Encryption**: AWS managed keys (SSE)
- **Point-in-time Recovery**: Enabled
- **Stream**: Disabled (not needed for this use case)

### Capacity Planning
- **Read**: On-demand auto-scaling
- **Write**: On-demand auto-scaling
- **GSI**: Same as base table

### Cost Estimation (Monthly)
For 1000 users with 50 expenses/month:
- Storage: ~1GB = $0.25
- Reads: ~150K = $0.03
- Writes: ~50K = $0.06
- **Total**: ~$0.34/month

## Query Optimization Tips

1. **Use GSI1 for month-based queries**: Most efficient for dashboard
2. **Use GSI2 for category analysis**: Efficient for category trends
3. **Batch operations**: Use BatchGetItem for multiple expenses
4. **Projection expressions**: Only fetch needed attributes
5. **Consistent reads**: Use eventually consistent for cost savings

## Data Retention

- **Active Data**: Current year + previous year
- **Archive Strategy**: Export to S3 after 2 years (optional)
- **Backup**: Point-in-time recovery for 35 days

## Indexing Strategy

### Why Two GSIs?

1. **GSI1 (MonthYearIndex)**: 
   - Primary access pattern for dashboard
   - Fetches all data for a specific month
   - Supports both expenses and budgets

2. **GSI2 (CategoryIndex)**:
   - Category-specific analysis
   - Trend analysis across months
   - Budget vs actual by category

## Migration Considerations

If scaling beyond single-table design:
1. Separate tables for Expenses and Budgets
2. Add DynamoDB Streams for real-time analytics
3. Use ElastiCache for frequently accessed data
4. Consider Aurora Serverless for complex queries
