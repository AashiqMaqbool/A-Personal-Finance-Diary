import { Budget } from '../types/common';
import { BudgetRepository } from '../repositories/BudgetRepository';
import { ExpenseRepository } from '../repositories/ExpenseRepository';

export class BudgetService {
  private budgetRepository: BudgetRepository;
  private expenseRepository: ExpenseRepository;

  constructor() {
    this.budgetRepository = new BudgetRepository();
    this.expenseRepository = new ExpenseRepository();
  }

  async createOrUpdateBudget(userId: string, budgetData: any): Promise<Budget> {
    return this.budgetRepository.createOrUpdate(userId, {
      category: budgetData.category,
      monthlyLimit: budgetData.monthlyLimit,
      year: budgetData.year,
      month: budgetData.month
    });
  }

  async getBudgetsByMonth(userId: string, year: number, month: number): Promise<any[]> {
    const budgets = await this.budgetRepository.findByMonth(userId, year, month);
    const expenses = await this.expenseRepository.findByMonth(userId, year, month);

    // Calculate spent amount per category
    const categorySpending = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return budgets.map(budget => {
      const spent = categorySpending[budget.category] || 0;
      const remaining = budget.monthlyLimit - spent;
      const percentageUsed = (spent / budget.monthlyLimit) * 100;

      return {
        ...budget,
        spent,
        remaining,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        isOverBudget: spent > budget.monthlyLimit
      };
    });
  }

  async deleteBudget(userId: string, year: number, month: number, category: string): Promise<void> {
    return this.budgetRepository.delete(userId, year, month, category);
  }
}
