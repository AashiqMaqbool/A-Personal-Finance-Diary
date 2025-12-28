import { Expense } from '../types/common';
import { ExpenseRepository } from '../repositories/ExpenseRepository';

export class ExpenseService {
  private repository: ExpenseRepository;

  constructor() {
    this.repository = new ExpenseRepository();
  }

  async createExpense(userId: string, expenseData: any): Promise<Expense> {
    const date = new Date(expenseData.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return this.repository.create(userId, {
      amount: expenseData.amount,
      category: expenseData.category,
      description: expenseData.description,
      date: expenseData.date,
      paymentMode: expenseData.paymentMode,
      year,
      month,
      day
    });
  }

  async getExpense(userId: string, year: number, month: number, expenseId: string): Promise<Expense | null> {
    return this.repository.findById(userId, year, month, expenseId);
  }

  async getExpensesByMonth(userId: string, year: number, month: number): Promise<Expense[]> {
    return this.repository.findByMonth(userId, year, month);
  }

  async updateExpense(userId: string, year: number, month: number, expenseId: string, updates: any): Promise<Expense> {
    return this.repository.update(userId, year, month, expenseId, updates);
  }

  async deleteExpense(userId: string, year: number, month: number, expenseId: string): Promise<void> {
    return this.repository.delete(userId, year, month, expenseId);
  }
}
