import axios from 'axios';
import { AIInsight, MonthlyStory, ApiResponse } from '../types';
import { MOCK_MODE, mockInsights, mockStory } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const insightService = {
  async getMonthlyInsights(month: number, year: number): Promise<AIInsight[]> {
    if (MOCK_MODE) return Promise.resolve(mockInsights);
    const response = await axios.get<ApiResponse<AIInsight[]>>(`${API_BASE_URL}/insights`, {
      params: { month, year },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch insights');
    }
    return response.data.data;
  },

  async getMonthlyStory(month: number, year: number): Promise<MonthlyStory> {
    if (MOCK_MODE) return Promise.resolve(mockStory);
    const response = await axios.get<ApiResponse<MonthlyStory>>(`${API_BASE_URL}/insights/story`, {
      params: { month, year },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch monthly story');
    }
    return response.data.data;
  },

  async generateInsights(month: number, year: number): Promise<AIInsight[]> {
    const response = await axios.post<ApiResponse<AIInsight[]>>(`${API_BASE_URL}/insights/generate`, {
      month,
      year,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to generate insights');
    }
    return response.data.data;
  },

  async getInsightsByType(type: AIInsight['type'], month?: number, year?: number): Promise<AIInsight[]> {
    const response = await axios.get<ApiResponse<AIInsight[]>>(`${API_BASE_URL}/insights/type/${type}`, {
      params: { month, year },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch insights by type');
    }
    return response.data.data;
  },

  async getBehavioralProjections(): Promise<AIInsight[]> {
    const response = await axios.get<ApiResponse<AIInsight[]>>(`${API_BASE_URL}/insights/projections`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch projections');
    }
    return response.data.data;
  },
};
