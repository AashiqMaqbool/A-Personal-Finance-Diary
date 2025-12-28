import { api } from './api';
import { Expense } from '../types';
import { MOCK_MODE } from './mockData';

const STORAGE_KEY = 'expense_tracker_expenses';

const loadFromStorage = (): Expense[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (expenses: Expense[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

let mockExpenses: Expense[] = loadFromStorage();

// Initialize with sample data if empty
if (mockExpenses.length === 0) {
  mockExpenses = [
    { expenseId: 'exp-1', amount: 1200, category: 'Food & Dining', description: 'Grocery shopping', date: '2024-12-05T00:00:00Z', paymentMode: 'Credit Card', year: 2024, month: 12, day: 5, createdAt: '2024-12-05T00:00:00Z', updatedAt: '2024-12-05T00:00:00Z' },
    { expenseId: 'exp-2', amount: 800, category: 'Transportation', description: 'Fuel', date: '2024-12-08T00:00:00Z', paymentMode: 'UPI', year: 2024, month: 12, day: 8, createdAt: '2024-12-08T00:00:00Z', updatedAt: '2024-12-08T00:00:00Z' },
    { expenseId: 'exp-3', amount: 2500, category: 'Shopping', description: 'Clothes', date: '2024-12-10T00:00:00Z', paymentMode: 'Debit Card', year: 2024, month: 12, day: 10, createdAt: '2024-12-10T00:00:00Z', updatedAt: '2024-12-10T00:00:00Z' },
  ];
  saveToStorage(mockExpenses);
}

export const expenseService = {
  async create(data: Omit<Expense, 'expenseId' | 'year' | 'month' | 'day' | 'createdAt' | 'updatedAt'>) {
    if (MOCK_MODE) {
      const date = new Date(data.date);
      const newExpense: Expense = { ...data, expenseId: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      mockExpenses.push(newExpense);
      saveToStorage(mockExpenses);
      return newExpense;
    }
    const response = await api.post('/expenses', data);
    return response.data.data;
  },

  async getByMonth(month: number, year: number): Promise<Expense[]> {
    if (MOCK_MODE) {
      return mockExpenses.filter(e => e.month === month && e.year === year);
    }
    const response = await api.get(`/expenses?month=${month}&year=${year}`);
    return response.data.data.expenses;
  },

  async update(expenseId: string, year: number, month: number, data: Partial<Expense>) {
    if (MOCK_MODE) {
      const index = mockExpenses.findIndex(e => e.expenseId === expenseId);
      if (index !== -1) {
        const updatedData = { ...data };
        if (data.date) {
          const date = new Date(data.date);
          updatedData.year = date.getFullYear();
          updatedData.month = date.getMonth() + 1;
          updatedData.day = date.getDate();
        }
        mockExpenses[index] = { ...mockExpenses[index], ...updatedData, updatedAt: new Date().toISOString() };
        saveToStorage(mockExpenses);
        return mockExpenses[index];
      }
      throw new Error('Expense not found');
    }
    const response = await api.put(`/expenses/${expenseId}?year=${year}&month=${month}`, data);
    return response.data.data;
  },

  async delete(expenseId: string, year: number, month: number) {
    if (MOCK_MODE) {
      mockExpenses = mockExpenses.filter(e => e.expenseId !== expenseId);
      saveToStorage(mockExpenses);
      return;
    }
    await api.delete(`/expenses/${expenseId}?year=${year}&month=${month}`);
  },
};
