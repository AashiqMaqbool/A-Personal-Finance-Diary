import axios from 'axios';
import { Income, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const incomeService = {
  async createIncome(income: Omit<Income, 'incomeId' | 'createdAt' | 'updatedAt'>): Promise<Income> {
    const response = await axios.post<ApiResponse<Income>>(`${API_BASE_URL}/income`, income);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create income');
    }
    return response.data.data;
  },

  async getIncome(month: number, year: number): Promise<Income[]> {
    const response = await axios.get<ApiResponse<Income[]>>(`${API_BASE_URL}/income`, {
      params: { month, year },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch income');
    }
    return response.data.data;
  },

  async getIncomeById(incomeId: string): Promise<Income> {
    const response = await axios.get<ApiResponse<Income>>(`${API_BASE_URL}/income/${incomeId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch income');
    }
    return response.data.data;
  },

  async updateIncome(incomeId: string, updates: Partial<Income>): Promise<Income> {
    const response = await axios.put<ApiResponse<Income>>(`${API_BASE_URL}/income/${incomeId}`, updates);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update income');
    }
    return response.data.data;
  },

  async deleteIncome(incomeId: string): Promise<void> {
    const response = await axios.delete<ApiResponse<void>>(`${API_BASE_URL}/income/${incomeId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete income');
    }
  },

  async getYearlyIncome(year: number): Promise<Income[]> {
    const response = await axios.get<ApiResponse<Income[]>>(`${API_BASE_URL}/income/yearly/${year}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch yearly income');
    }
    return response.data.data;
  },
};
