// ============================================================================
// DIARY-STYLE PERSONAL FINANCE MANAGEMENT SYSTEM - TYPE DEFINITIONS
// ============================================================================

// Core Categories
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
// TRANSACTION TYPES
// ============================================================================

export interface Expense {
  expenseId: string;
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

// ============================================================================
// BUDGET TYPES
// ============================================================================

export interface Budget {
  budgetId: string;
  category: ExpenseCategory;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  year: number;
  month: number;
  rolloverEnabled?: boolean;
  rolloverAmount?: number;
}

export interface OverallBudget {
  budgetId: string;
  totalMonthlyBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentageUsed: number;
  year: number;
  month: number;
}

// ============================================================================
// GOAL TYPES
// ============================================================================

export interface Goal {
  goalId: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  progress: number;
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

// ============================================================================
// INVESTMENT & PORTFOLIO TYPES
// ============================================================================

export interface Investment {
  investmentId: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
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
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  dayPL: number;
  totalPL: number;
  totalPLPercentage: number;
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

// ============================================================================
// TIMELINE & DIARY TYPES
// ============================================================================

export interface TimelineEntry {
  entryId: string;
  type: 'expense' | 'income' | 'investment' | 'goal' | 'note';
  date: string;
  title: string;
  description: string;
  amount?: number;
  category?: string;
  tags?: string[];
  linkedId?: string;
  year: number;
  month: number;
  day: number;
}

export interface DayGroup {
  date: string;
  entries: TimelineEntry[];
  totalExpense: number;
  totalIncome: number;
  netFlow: number;
}

export interface MonthChapter {
  year: number;
  month: number;
  monthName: string;
  summary: MonthSummary;
  insights: string[];
  topExpenses: Expense[];
  topCategories: CategorySummary[];
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface Analytics {
  summary: {
    totalExpenses: number;
    totalIncome: number;
    totalSavings: number;
    savingsRate: number;
    netWorth: number;
    expenseCount: number;
    incomeCount: number;
    month: number;
    year: number;
  };
  categoryBreakdown: CategorySummary[];
  topCategories: CategorySummary[];
  paymentModeBreakdown: PaymentModeSummary[];
  dailyExpenses: DailyExpense[];
  monthlyTrends: MonthlyTrend[];
  budgetComparison: BudgetComparison[];
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  budget?: number;
  remaining?: number;
  isOverBudget?: boolean;
}

export interface PaymentModeSummary {
  mode: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface DailyExpense {
  date: string;
  amount: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  monthNum: number;
  expenses: number;
  income: number;
  savings: number;
  savingsRate: number;
}

export interface BudgetComparison {
  category: string;
  budget: number;
  actual: number;
  difference: number;
  percentageUsed: number;
}

export interface MonthSummary {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  savingsRate: number;
  budgetAdherence: number;
  topCategory: string;
  expenseCount: number;
  incomeCount: number;
}

// ============================================================================
// AI INSIGHTS TYPES
// ============================================================================

export interface AIInsight {
  insightId: string;
  type: 'spending_pattern' | 'budget_discipline' | 'savings_mindset' | 
        'goal_alignment' | 'portfolio_risk' | 'behavioral_projection' | 'monthly_story';
  title: string;
  narrative: string;
  severity: 'info' | 'warning' | 'success' | 'neutral';
  category?: string;
  relatedData?: any;
  actionable?: boolean;
  suggestions?: string[];
  generatedAt: string;
  month: number;
  year: number;
}

export interface MonthlyStory {
  storyId: string;
  month: number;
  year: number;
  title: string;
  narrative: string;
  highlights: string[];
  concerns: string[];
  achievements: string[];
  keyMetrics: {
    totalSpent: number;
    totalEarned: number;
    savedAmount: number;
    savingsRate: number;
  };
  generatedAt: string;
}

// ============================================================================
// DASHBOARD WIDGET TYPES
// ============================================================================

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'story' | 'expense' | 'budget' | 'goal' | 'portfolio' | 'insight' | 'health';
  data: any;
  route?: string;
}

export interface FinancialHealthScore {
  overall: number;
  budgetDiscipline: number;
  savingsRate: number;
  goalProgress: number;
  portfolioDiversification: number;
  debtManagement: number;
  month: number;
  year: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

export interface DateFilter {
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
}

export interface ExpenseFilter extends DateFilter {
  categories?: ExpenseCategory[];
  paymentModes?: PaymentMode[];
  minAmount?: number;
  maxAmount?: number;
  tags?: string[];
  searchQuery?: string;
}

export interface TimelineFilter extends DateFilter {
  types?: TimelineEntry['type'][];
  categories?: string[];
  tags?: string[];
  searchQuery?: string;
}
