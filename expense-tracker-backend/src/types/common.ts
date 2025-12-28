// ============================================================================
// BACKEND TYPE SYSTEM - DynamoDB Schema
// ============================================================================

export const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Groceries', 'Train Tickets', 'Transportation', 'House Rent','Family',
  'Bills and Payments', 'Healthcare','Entertainment', 'Shopping', 'Education', 'Insurance', 
  'Personal Care', 'Gyms & Fitness', 'Office Expenses',
  'Gifts & Donations', 'Fuel', 'Subscriptions','Other'
] as const;

export const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Business', 'Investment Returns', 'Rental Income',
  'Gifts Received', 'Refunds', 'Other Income'
] as const;

export const PAYMENT_MODES = [
  'Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet', 'Other'
] as const;

export const ASSET_TYPES = [
  'Stocks', 'Mutual Funds', 'Fixed Deposit', 'Gold', 'Real Estate',
  'Crypto', 'Bonds', 'PPF', 'EPF', 'Other'
] as const;

export const GOAL_TYPES = [
  'Emergency Fund', 'Vacation', 'Home Purchase', 'Car Purchase',
  'Education', 'Retirement', 'Debt Payoff', 'Wedding', 'Other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type PaymentMode = typeof PAYMENT_MODES[number];
export type AssetType = typeof ASSET_TYPES[number];
export type GoalType = typeof GOAL_TYPES[number];

// ============================================================================
// DOMAIN MODELS
// ============================================================================

export interface Expense {
  expenseId: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  subCategory?: string;
  description: string;
  date: string;
  paymentMode: PaymentMode;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  tags?: string[];
  notes?: string;
  linkedGoalId?: string;
  year: number;
  month: number;
  day: number;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  incomeId: string;
  userId: string;
  amount: number;
  category: IncomeCategory;
  source: string;
  description: string;
  date: string;
  isRecurring?: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'yearly';
  tags?: string[];
  notes?: string;
  year: number;
  month: number;
  day: number;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  budgetId: string;
  userId: string;
  category: ExpenseCategory;
  monthlyLimit: number;
  year: number;
  month: number;
  rolloverEnabled?: boolean;
  rolloverAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OverallBudget {
  budgetId: string;
  userId: string;
  totalMonthlyBudget: number;
  year: number;
  month: number;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  goalId: string;
  userId: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  milestones?: Milestone[];
  linkedExpenses?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  milestoneId: string;
  name: string;
  targetAmount: number;
  targetDate: string;
  isCompleted: boolean;
  completedDate?: string;
}

export interface Investment {
  investmentId: string;
  userId: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  purchaseDate: string;
  isSIP?: boolean;
  sipAmount?: number;
  sipFrequency?: 'monthly' | 'quarterly';
  sector?: string;
  notes?: string;
  transactions: InvestmentTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentTransaction {
  transactionId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  totalAmount: number;
  date: string;
  notes?: string;
}

export interface StockHolding {
  stockId: string;
  userId: string;
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  transactions: StockTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface StockTransaction {
  transactionId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  totalAmount: number;
  date: string;
  notes?: string;
}

export interface AIInsight {
  insightId: string;
  userId: string;
  type: 'spending_pattern' | 'budget_discipline' | 'savings_mindset' | 
        'goal_alignment' | 'portfolio_risk' | 'behavioral_projection' | 'monthly_story';
  title: string;
  narrative: string;
  severity: 'info' | 'warning' | 'success' | 'neutral';
  category?: string;
  relatedData?: any;
  actionable?: boolean;
  suggestions?: string[];
  month: number;
  year: number;
  generatedAt: string;
}

// ============================================================================
// DYNAMODB ITEM TYPES
// ============================================================================

export interface DynamoDBExpenseItem {
  PK: string;                    // USER#{userId}
  SK: string;                    // EXPENSE#{year}#{month}#{day}#{expenseId}
  GSI1PK: string;                // USER#{userId}#YEAR#{year}#MONTH#{month}
  GSI1SK: string;                // EXPENSE#{timestamp}
  GSI2PK: string;                // USER#{userId}#CATEGORY#{category}
  GSI2SK: string;                // EXPENSE#{year}#{month}#{timestamp}
  entityType: 'EXPENSE';
  expenseId: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  subCategory?: string;
  description: string;
  date: string;
  paymentMode: PaymentMode;
  isRecurring?: boolean;
  recurringFrequency?: string;
  tags?: string[];
  notes?: string;
  linkedGoalId?: string;
  year: number;
  month: number;
  day: number;
  createdAt: string;
  updatedAt: string;
}

export interface DynamoDBIncomeItem {
  PK: string;                    // USER#{userId}
  SK: string;                    // INCOME#{year}#{month}#{day}#{incomeId}
  GSI1PK: string;                // USER#{userId}#YEAR#{year}#MONTH#{month}
  GSI1SK: string;                // INCOME#{timestamp}
  entityType: 'INCOME';
  incomeId: string;
  userId: string;
  amount: number;
  category: IncomeCategory;
  source: string;
  description: string;
  date: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  tags?: string[];
  notes?: string;
  year: number;
  month: number;
  day: number;
  createdAt: string;
  updatedAt: string;
}

export interface DynamoDBBudgetItem {
  PK: string;                    // USER#{userId}
  SK: string;                    // BUDGET#{year}#{month}#{category}
  GSI1PK: string;                // USER#{userId}#YEAR#{year}#MONTH#{month}
  GSI1SK: string;                // BUDGET#{category}
  entityType: 'BUDGET';
  budgetId: string;
  userId: string;
  category: ExpenseCategory;
  monthlyLimit: number;
  year: number;
  month: number;
  rolloverEnabled?: boolean;
  rolloverAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DynamoDBGoalItem {
  PK: string;                    // USER#{userId}
  SK: string;                    // GOAL#{goalId}
  GSI1PK: string;                // USER#{userId}#GOALS
  GSI1SK: string;                // GOAL#{status}#{targetDate}
  entityType: 'GOAL';
  goalId: string;
  userId: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  priority: string;
  status: string;
  milestones?: Milestone[];
  linkedExpenses?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DynamoDBInvestmentItem {
  PK: string;                    // USER#{userId}
  SK: string;                    // INVESTMENT#{investmentId}
  GSI1PK: string;                // USER#{userId}#INVESTMENTS
  GSI1SK: string;                // INVESTMENT#{assetType}#{purchaseDate}
  entityType: 'INVESTMENT';
  investmentId: string;
  userId: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  purchaseDate: string;
  isSIP?: boolean;
  sipAmount?: number;
  sipFrequency?: string;
  sector?: string;
  notes?: string;
  transactions: InvestmentTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface DynamoDBStockItem {
  PK: string;                    // USER#{userId}
  SK: string;                    // STOCK#{stockId}
  GSI1PK: string;                // USER#{userId}#STOCKS
  GSI1SK: string;                // STOCK#{symbol}
  entityType: 'STOCK';
  stockId: string;
  userId: string;
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  transactions: StockTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface DynamoDBInsightItem {
  PK: string;                    // USER#{userId}
  SK: string;                    // INSIGHT#{year}#{month}#{insightId}
  GSI1PK: string;                // USER#{userId}#YEAR#{year}#MONTH#{month}
  GSI1SK: string;                // INSIGHT#{type}#{generatedAt}
  entityType: 'INSIGHT';
  insightId: string;
  userId: string;
  type: string;
  title: string;
  narrative: string;
  severity: string;
  category?: string;
  relatedData?: any;
  actionable?: boolean;
  suggestions?: string[];
  month: number;
  year: number;
  generatedAt: string;
}
