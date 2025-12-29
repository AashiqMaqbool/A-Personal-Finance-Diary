import { Income } from '../types';
import { getUserData, setUserData } from '../utils/userStorage';
import { getCurrentUser } from '../utils/auth';

const STORAGE_KEY = 'income_tracker_data';

const loadFromStorage = (): Income[] => {
  return getUserData<Income[]>(STORAGE_KEY, []);
};

const saveToStorage = (incomes: Income[]) => {
  setUserData(STORAGE_KEY, incomes);
};

let mockIncomes: Income[] = loadFromStorage();

export const incomeService = {
  async create(data: Omit<Income, 'incomeId' | 'year' | 'month' | 'day' | 'createdAt' | 'updatedAt'>) {
    const date = new Date(data.date);
    const newIncome: Income = {
      ...data,
      incomeId: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockIncomes.push(newIncome);
    saveToStorage(mockIncomes);
    return newIncome;
  },

  async getByMonth(month: number, year: number): Promise<Income[]> {
    mockIncomes = loadFromStorage();
    return mockIncomes.filter(i => i.month === month && i.year === year);
  },

  async update(incomeId: string, data: Partial<Income>) {
    mockIncomes = loadFromStorage();
    const index = mockIncomes.findIndex(i => i.incomeId === incomeId);
    if (index !== -1) {
      const updatedData = { ...data };
      if (data.date) {
        const date = new Date(data.date);
        updatedData.year = date.getFullYear();
        updatedData.month = date.getMonth() + 1;
        updatedData.day = date.getDate();
      }
      mockIncomes[index] = { ...mockIncomes[index], ...updatedData, updatedAt: new Date().toISOString() };
      saveToStorage(mockIncomes);
      return mockIncomes[index];
    }
    throw new Error('Income not found');
  },

  async delete(incomeId: string) {
    mockIncomes = loadFromStorage();
    mockIncomes = mockIncomes.filter(i => i.incomeId !== incomeId);
    saveToStorage(mockIncomes);
  },
};
