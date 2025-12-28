import axios from 'axios';
import { TimelineEntry, DayGroup, MonthChapter, ApiResponse, TimelineFilter } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const timelineService = {
  async getTimeline(filter: TimelineFilter): Promise<DayGroup[]> {
    const response = await axios.get<ApiResponse<DayGroup[]>>(`${API_BASE_URL}/timeline`, {
      params: filter,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch timeline');
    }
    return response.data.data;
  },

  async getMonthChapter(month: number, year: number): Promise<MonthChapter> {
    const response = await axios.get<ApiResponse<MonthChapter>>(`${API_BASE_URL}/timeline/chapter`, {
      params: { month, year },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch month chapter');
    }
    return response.data.data;
  },

  async addNote(note: { date: string; title: string; description: string; tags?: string[] }): Promise<TimelineEntry> {
    const response = await axios.post<ApiResponse<TimelineEntry>>(`${API_BASE_URL}/timeline/note`, note);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to add note');
    }
    return response.data.data;
  },

  async searchTimeline(query: string, filter?: TimelineFilter): Promise<TimelineEntry[]> {
    const response = await axios.get<ApiResponse<TimelineEntry[]>>(`${API_BASE_URL}/timeline/search`, {
      params: { query, ...filter },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to search timeline');
    }
    return response.data.data;
  },
};
