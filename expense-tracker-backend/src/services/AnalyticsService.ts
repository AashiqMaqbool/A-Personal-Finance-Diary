import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { BudgetRepository } from '../repositories/BudgetRepository';

export class AnalyticsService {
  private expenseRepository: ExpenseRepository;
  private budgetRepository: BudgetRepository;

  constructor() {
    this.expenseRepository = new ExpenseRepository();
    this.budgetRepository = new BudgetRepository();
  }

  async getMonthlyAnalytics(userId: string, year: number, month: number) {
    const expenses = await this.expenseRepository.findByMonth(userId, year, month);
    const budgets = await this.budgetRepository.findByMonth(userId, year, month);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.monthlyLimit, 0);
    const totalSavings = totalBudget - totalExpenses;

    // Category breakdown
    const categoryMap = new Map<string, { amount: number; budget: number }>();
    
    expenses.forEach(exp => {
      const current = categoryMap.get(exp.category) || { amount: 0, budget: 0 };
      categoryMap.set(exp.category, { ...current, amount: current.amount + exp.amount });
    });

    budgets.forEach(budget => {
      const current = categoryMap.get(budget.category) || { amount: 0, budget: 0 };
      categoryMap.set(budget.category, { ...current, budget: budget.monthlyLimit });
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: Math.round(data.amount * 100) / 100,
      percentage: totalExpenses > 0 ? Math.round((data.amount / totalExpenses) * 10000) / 100 : 0,
      budget: data.budget,
      remaining: data.budget - data.amount,
      isOverBudget: data.amount > data.budget
    }));

    // Top categories
    const topCategories = categoryBreakdown
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(({ category, amount, percentage }) => ({ category, amount, percentage }));

    // Payment mode breakdown
    const paymentModeMap = new Map<string, number>();
    expenses.forEach(exp => {
      if (exp.paymentMode) {
        paymentModeMap.set(exp.paymentMode, (paymentModeMap.get(exp.paymentMode) || 0) + exp.amount);
      }
    });

    const paymentModeBreakdown = Array.from(paymentModeMap.entries()).map(([mode, amount]) => ({
      mode,
      amount: Math.round(amount * 100) / 100,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 10000) / 100 : 0
    }));

    // Daily expenses
    const dailyMap = new Map<string, number>();
    expenses.forEach(exp => {
      const date = exp.date.split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + exp.amount);
    });

    const dailyExpenses = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary: {
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalBudget: Math.round(totalBudget * 100) / 100,
        totalSavings: Math.round(totalSavings * 100) / 100,
        savingsPercentage: totalBudget > 0 ? Math.round((totalSavings / totalBudget) * 10000) / 100 : 0,
        expenseCount: expenses.length,
        month,
        year
      },
      categoryBreakdown,
      topCategories,
      paymentModeBreakdown,
      dailyExpenses
    };
  }
}
