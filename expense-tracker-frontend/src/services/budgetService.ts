import { api } from './api';
import { Budget } from '../types';
import { MOCK_MODE } from './mockData';

const STORAGE_KEY = 'expense_tracker_budgets';

const loadFromStorage = (): Budget[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (budgets: Budget[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

let mockBudgets: Budget[] = loadFromStorage();

// Initialize with sample data if empty
if (mockBudgets.length === 0) {
  mockBudgets = [
    { budgetId: 'bud-1', category: 'Food & Dining', monthlyLimit: 5000, spent: 1200, remaining: 3800, year: 2024, month: 12, createdAt: '2024-12-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
    { budgetId: 'bud-2', category: 'Transportation', monthlyLimit: 3000, spent: 800, remaining: 2200, year: 2024, month: 12, createdAt: '2024-12-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
    { budgetId: 'bud-3', category: 'Shopping', monthlyLimit: 4000, spent: 2500, remaining: 1500, year: 2024, month: 12, createdAt: '2024-12-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
    { budgetId: 'bud-4', category: 'Entertainment', monthlyLimit: 2000, spent: 0, remaining: 2000, year: 2024, month: 12, createdAt: '2024-12-01T00:00:00Z', updatedAt: '2024-12-01T00:00:00Z' },
  ];
  saveToStorage(mockBudgets);
}

export const budgetService = {
  async createOrUpdate(data: { category: string; monthlyLimit: number; month: number; year: number }) {
    if (MOCK_MODE) {
      const existing = mockBudgets.findIndex(b => b.category === data.category && b.month === data.month && b.year === data.year);
      if (existing !== -1) {
        mockBudgets[existing] = { ...mockBudgets[existing], monthlyLimit: data.monthlyLimit, updatedAt: new Date().toISOString() };
        saveToStorage(mockBudgets);
        return mockBudgets[existing];
      }
      const newBudget: Budget = { budgetId: `bud-${Date.now()}`, ...data, spent: 0, remaining: data.monthlyLimit, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      mockBudgets.push(newBudget);
      saveToStorage(mockBudgets);
      return newBudget;
    }
    const response = await api.post('/budgets', data);
    return response.data.data;
  },

  async getByMonth(month: number, year: number): Promise<Budget[]> {
    if (MOCK_MODE) {
      return mockBudgets.filter(b => b.month === month && b.year === year);
    }
    const response = await api.get(`/budgets?month=${month}&year=${year}`);
    return response.data.data.budgets;
  },

  async delete(category: string, year: number, month: number) {
    if (MOCK_MODE) {
      mockBudgets = mockBudgets.filter(b => !(b.category === category && b.year === year && b.month === month));
      saveToStorage(mockBudgets);
      return;
    }
    await api.delete(`/budgets/${encodeURIComponent(category)}?year=${year}&month=${month}`);
  },
};
