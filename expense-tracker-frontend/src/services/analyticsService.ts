import { api } from './api';
import { Analytics } from '../types';

export const analyticsService = {
  async getMonthlyAnalytics(month: number, year: number): Promise<Analytics> {
    const response = await api.get(`/analytics?month=${month}&year=${year}`);
    return response.data.data;
  },

  async getAnalytics(month: number, year: number): Promise<Analytics> {
    return this.getMonthlyAnalytics(month, year);
  },
};
