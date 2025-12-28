import axios from 'axios';
import { Goal, ApiResponse } from '../types';
import { MOCK_MODE, mockGoals } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const goalService = {
  async createGoal(goal: Omit<Goal, 'goalId' | 'currentAmount' | 'progress' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const response = await axios.post<ApiResponse<Goal>>(`${API_BASE_URL}/goals`, goal);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create goal');
    }
    return response.data.data;
  },

  async getGoals(): Promise<Goal[]> {
    if (MOCK_MODE) return Promise.resolve(mockGoals);
    const response = await axios.get<ApiResponse<Goal[]>>(`${API_BASE_URL}/goals`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch goals');
    }
    return response.data.data;
  },

  async getGoalById(goalId: string): Promise<Goal> {
    const response = await axios.get<ApiResponse<Goal>>(`${API_BASE_URL}/goals/${goalId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch goal');
    }
    return response.data.data;
  },

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    const response = await axios.put<ApiResponse<Goal>>(`${API_BASE_URL}/goals/${goalId}`, updates);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update goal');
    }
    return response.data.data;
  },

  async deleteGoal(goalId: string): Promise<void> {
    const response = await axios.delete<ApiResponse<void>>(`${API_BASE_URL}/goals/${goalId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete goal');
    }
  },

  async addContribution(goalId: string, amount: number): Promise<Goal> {
    const response = await axios.post<ApiResponse<Goal>>(`${API_BASE_URL}/goals/${goalId}/contribute`, { amount });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to add contribution');
    }
    return response.data.data;
  },

  async updateMilestone(goalId: string, milestoneId: string, isCompleted: boolean): Promise<Goal> {
    const response = await axios.put<ApiResponse<Goal>>(`${API_BASE_URL}/goals/${goalId}/milestones/${milestoneId}`, { isCompleted });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update milestone');
    }
    return response.data.data;
  },
};
