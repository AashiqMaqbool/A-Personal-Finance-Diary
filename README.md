# FinDiary - Personal Finance Management System

A comprehensive personal finance management application with expense tracking, budget planning, salary management, and AI-powered payslip analysis. Built with React, AWS Lambda, and DynamoDB.

## 🌟 Live Demo

**Frontend**: http://personal-expense-tracker-v1.s3-website-us-east-1.amazonaws.com
**Backend API**: Deployed on AWS Lambda + API Gateway

## 🚀 Features

### 💸 Expense Management
- Add, edit, and delete expenses
- Categorize expenses (Food, Transportation, Housing, etc.)
- Track payment modes (Cash, Card, UPI, etc.)
- Month-wise and year-wise organization
- Detailed expense descriptions

### 📊 Budget Planning
- Set monthly budgets per category
- Real-time budget tracking
- Budget utilization percentage
- Over-budget alerts
- Remaining budget calculations

### 💼 Salary Tracker
- Track monthly salary entries
- Breakdown: Basic, Allowances, Bonus, Deductions
- Salary history and trends
- Average salary calculation
- Company-wise tracking

### 🤖 AI Payslip Analyzer
- Upload payslip images (JPG, PNG, PDF)
- AI-powered text extraction
- Automatic salary component detection
- One-click import to salary tracker
- Supports multiple payslip formats

### 📊 Analytics Dashboard
- Monthly spending trends (Line chart)
- Category distribution (Pie chart)
- Budget vs Actual comparison (Bar chart)
- KPI cards (Total spend, Savings, Budget remaining)
- Month-over-month comparison
- Top spending categories

### 💾 Data Persistence
- DynamoDB for reliable storage
- Historical data access
- Survives browser refresh
- Efficient querying with GSIs

## 🏗️ Architecture

```
React Frontend (S3 + CloudFront)
         ↓
   API Gateway (REST)
         ↓
   AWS Lambda (Node.js 18)
         ↓
   Amazon DynamoDB
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State**: React Context API
- **Forms**: React Hook Form
- **HTTP**: Axios

### Backend
- **Runtime**: AWS Lambda (Node.js 18)
- **Language**: TypeScript
- **API**: API Gateway (REST)
- **SDK**: AWS SDK v3

### Database
- **Primary**: Amazon DynamoDB
- **Design**: Single-table design with GSIs

### Infrastructure
- **IaC**: AWS SAM
- **Hosting**: S3 + CloudFront
- **Auth**: Amazon Cognito (optional)

## 📁 Project Structure

```
expense-manager/
├── expense-tracker-frontend/     # React application
├── expense-tracker-backend/      # Lambda functions
├── expense-tracker-infrastructure/ # AWS SAM templates
├── ARCHITECTURE.md              # System architecture
├── DATABASE_DESIGN.md          # DynamoDB schema
├── API_DESIGN.md              # API contracts
└── README.md                  # This file
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- AWS CLI configured
- AWS SAM CLI
- npm or yarn

### Installation

#### 1. Clone the repository
```bash
git clone <repository-url>
cd expense-manager
```

#### 2. Setup Backend
```bash
cd expense-tracker-backend
npm install
npm run build
```

#### 3. Setup Frontend
```bash
cd expense-tracker-frontend
npm install
cp .env.example .env
# Update .env with your API endpoint
```

#### 4. Deploy Infrastructure
```bash
cd expense-tracker-infrastructure
sam build
sam deploy --guided
```

#### 5. Run Frontend Locally
```bash
cd expense-tracker-frontend
npm run dev
```

## 📊 Database Schema

### Primary Table: ExpenseTrackerTable

**Primary Key:**
- PK: `USER#{userId}`
- SK: `EXPENSE#{year}#{month}#{expenseId}` or `BUDGET#{year}#{month}#{category}`

**GSIs:**
1. **MonthYearIndex**: Query by month/year
2. **CategoryIndex**: Query by category

See [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) for details.

## 🔌 API Endpoints

### Expenses
- `POST /expenses` - Create expense
- `GET /expenses?month=5&year=2024` - Get expenses
- `GET /expenses/{id}` - Get single expense
- `PUT /expenses/{id}` - Update expense
- `DELETE /expenses/{id}` - Delete expense

### Budgets
- `POST /budgets` - Create/update budget
- `GET /budgets?month=5&year=2024` - Get budgets
- `DELETE /budgets/{id}` - Delete budget

### Analytics
- `GET /analytics?month=5&year=2024` - Monthly analytics
- `GET /analytics/trends` - Trend analysis

See [API_DESIGN.md](./API_DESIGN.md) for complete API documentation.

## 🎨 UI Components

### Pages
- **Dashboard**: Overview with KPIs and charts
- **Expenses**: Expense list and management
- **Budget**: Budget planning and tracking

### Key Components
- `ExpenseForm`: Add/edit expenses
- `ExpenseList`: Display expenses
- `BudgetCard`: Budget overview
- `SpendingTrendChart`: Line chart
- `CategoryPieChart`: Pie chart
- `BudgetComparisonChart`: Bar chart
- `KPICard`: Metric cards

## 🔐 Security

- ✅ HTTPS only (CloudFront)
- ✅ DynamoDB encryption at rest
- ✅ API Gateway request validation
- ✅ CORS configuration
- ✅ Input validation (client + server)
- ✅ Cognito authentication (optional)

## 💰 Cost Estimation

For 1000 users with 50 expenses/month:
- **DynamoDB**: ~$0.34/month
- **Lambda**: ~$0.20/month
- **API Gateway**: ~$0.35/month
- **S3 + CloudFront**: ~$0.50/month
- **Total**: ~$1.39/month

## 🧪 Testing

### Backend Tests
```bash
cd expense-tracker-backend
npm test
```

### Frontend Tests
```bash
cd expense-tracker-frontend
npm test
```

## 📦 Deployment

### Backend Deployment
```bash
cd expense-tracker-infrastructure
sam build
sam deploy
```

### Frontend Deployment
```bash
cd expense-tracker-frontend
npm run build
aws s3 sync dist/ s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**
```
VITE_API_BASE_URL=https://api.expense-tracker.com/v1
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
```

**Backend (SAM template)**
```yaml
Environment:
  Variables:
    TABLE_NAME: ExpenseTrackerTable
    AWS_REGION: us-east-1
```

## 📈 Monitoring

- **CloudWatch Logs**: Lambda execution logs
- **CloudWatch Metrics**: API Gateway metrics
- **DynamoDB Metrics**: Read/write capacity
- **X-Ray**: Distributed tracing (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🙋 Support

For issues and questions:
- Open an issue on GitHub
- Check documentation files
- Review API design

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Recurring expenses
- [ ] Export to CSV/PDF
- [ ] Multi-currency support
- [ ] Shared budgets
- [ ] Receipt upload (S3)
- [ ] Email notifications (SES)
- [ ] Advanced analytics (QuickSight)

## 📚 Documentation

- [Architecture](./ARCHITECTURE.md)
- [Database Design](./DATABASE_DESIGN.md)
- [API Design](./API_DESIGN.md)
- [Project Structure](./PROJECT_STRUCTURE.md)

---

Built with ❤️ using AWS and React
