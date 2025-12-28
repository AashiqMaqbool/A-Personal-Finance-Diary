# Monthly Expense Tracker - System Architecture

## Overview
A serverless, cloud-native expense tracking application with budget planning and analytics capabilities.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React + TypeScript + Vite + Tailwind CSS                 │  │
│  │  - Expense Management UI                                  │  │
│  │  - Budget Planning UI                                     │  │
│  │  - Analytics Dashboard (Recharts)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CDN & Hosting Layer                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CloudFront (CDN) → S3 (Static Hosting)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Gateway (REST)                                       │  │
│  │  - Request validation                                     │  │
│  │  - CORS configuration                                     │  │
│  │  - Rate limiting                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Invoke
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Compute Layer                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AWS Lambda Functions (Node.js 18 + TypeScript)          │  │
│  │  - expenseHandler                                         │  │
│  │  - budgetHandler                                          │  │
│  │  - analyticsHandler                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ AWS SDK v3
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Amazon DynamoDB                                          │  │
│  │  - ExpenseTrackerTable                                    │  │
│  │  - GSI: MonthYearIndex                                    │  │
│  │  - GSI: CategoryIndex                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (Optional)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Authentication Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Amazon Cognito                                           │  │
│  │  - User Pool                                              │  │
│  │  - JWT tokens                                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **HTTP Client**: Axios
- **Routing**: React Router v6

### Backend
- **Runtime**: AWS Lambda (Node.js 18)
- **Language**: TypeScript
- **API**: API Gateway (REST)
- **SDK**: AWS SDK v3

### Database
- **Primary**: Amazon DynamoDB
- **Access Pattern**: Single-table design

### Infrastructure
- **IaC**: AWS SAM (Serverless Application Model)
- **Hosting**: S3 + CloudFront
- **Auth**: Amazon Cognito (optional)

## Design Principles

1. **Serverless-First**: No server management, pay-per-use
2. **Single-Table Design**: Efficient DynamoDB usage
3. **Type Safety**: TypeScript throughout
4. **Clean Architecture**: Separation of concerns
5. **Scalability**: Auto-scaling by default
6. **Cost-Efficient**: Minimal resource usage
7. **Maintainable**: Modular, testable code

## Key Features

### 1. Expense Management
- CRUD operations for expenses
- Month/Year grouping
- Category classification
- Payment mode tracking

### 2. Budget Planning
- Monthly budget limits
- Category-wise budgets
- Real-time tracking
- Over-budget alerts

### 3. Analytics Dashboard
- Monthly spending trends
- Category distribution
- Budget vs Actual comparison
- Month-over-month analysis
- KPI cards

### 4. Data Persistence
- DynamoDB for reliable storage
- Historical data access
- Efficient querying with GSIs

## Security Considerations

1. **API Security**: API Gateway with request validation
2. **Data Encryption**: DynamoDB encryption at rest
3. **HTTPS Only**: CloudFront with SSL/TLS
4. **CORS**: Properly configured origins
5. **Input Validation**: Both client and server-side
6. **Authentication**: Cognito integration (optional)

## Scalability

- **Lambda**: Auto-scales with concurrent executions
- **DynamoDB**: On-demand billing mode
- **CloudFront**: Global CDN distribution
- **API Gateway**: Handles millions of requests

## Cost Optimization

- **Lambda**: Pay per invocation
- **DynamoDB**: On-demand pricing
- **S3**: Minimal storage costs
- **CloudFront**: Free tier eligible
- **API Gateway**: Free tier for first 1M requests

## Monitoring & Observability

- CloudWatch Logs for Lambda
- CloudWatch Metrics for API Gateway
- DynamoDB metrics
- X-Ray for distributed tracing (optional)
