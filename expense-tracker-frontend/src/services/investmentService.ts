import axios from 'axios';
import { Investment, StockHolding, ApiResponse } from '../types';
import { MOCK_MODE, mockInvestments, mockStocks } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const investmentService = {
  async createInvestment(investment: Omit<Investment, 'investmentId' | 'currentValue' | 'gainLoss' | 'gainLossPercentage' | 'createdAt' | 'updatedAt'>): Promise<Investment> {
    const response = await axios.post<ApiResponse<Investment>>(`${API_BASE_URL}/investments`, investment);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create investment');
    }
    return response.data.data;
  },

  async getInvestments(): Promise<Investment[]> {
    if (MOCK_MODE) return Promise.resolve(mockInvestments);
    const response = await axios.get<ApiResponse<Investment[]>>(`${API_BASE_URL}/investments`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch investments');
    }
    return response.data.data;
  },

  async getInvestmentById(investmentId: string): Promise<Investment> {
    const response = await axios.get<ApiResponse<Investment>>(`${API_BASE_URL}/investments/${investmentId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch investment');
    }
    return response.data.data;
  },

  async updateInvestment(investmentId: string, updates: Partial<Investment>): Promise<Investment> {
    const response = await axios.put<ApiResponse<Investment>>(`${API_BASE_URL}/investments/${investmentId}`, updates);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update investment');
    }
    return response.data.data;
  },

  async deleteInvestment(investmentId: string): Promise<void> {
    const response = await axios.delete<ApiResponse<void>>(`${API_BASE_URL}/investments/${investmentId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete investment');
    }
  },

  async getPortfolioSummary(): Promise<any> {
    if (MOCK_MODE) {
      const totalValue = mockInvestments.reduce((sum, i) => sum + i.currentValue, 0) +
                        mockStocks.reduce((sum, s) => sum + s.currentValue, 0);
      return Promise.resolve({ totalValue });
    }
    const response = await axios.get<ApiResponse<any>>(`${API_BASE_URL}/investments/portfolio/summary`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch portfolio summary');
    }
    return response.data.data;
  },
};

export const stockService = {
  async createStock(stock: Omit<StockHolding, 'stockId' | 'quantity' | 'avgBuyPrice' | 'currentValue' | 'totalInvested' | 'dayPL' | 'totalPL' | 'totalPLPercentage' | 'createdAt' | 'updatedAt'>): Promise<StockHolding> {
    const response = await axios.post<ApiResponse<StockHolding>>(`${API_BASE_URL}/stocks`, stock);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create stock');
    }
    return response.data.data;
  },

  async getStocks(): Promise<StockHolding[]> {
    if (MOCK_MODE) return Promise.resolve(mockStocks);
    const response = await axios.get<ApiResponse<StockHolding[]>>(`${API_BASE_URL}/stocks`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch stocks');
    }
    return response.data.data;
  },

  async getStockById(stockId: string): Promise<StockHolding> {
    const response = await axios.get<ApiResponse<StockHolding>>(`${API_BASE_URL}/stocks/${stockId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch stock');
    }
    return response.data.data;
  },

  async addTransaction(stockId: string, transaction: any): Promise<StockHolding> {
    const response = await axios.post<ApiResponse<StockHolding>>(`${API_BASE_URL}/stocks/${stockId}/transactions`, transaction);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to add transaction');
    }
    return response.data.data;
  },

  async updateCurrentPrice(stockId: string, currentPrice: number): Promise<StockHolding> {
    const response = await axios.put<ApiResponse<StockHolding>>(`${API_BASE_URL}/stocks/${stockId}/price`, { currentPrice });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update price');
    }
    return response.data.data;
  },

  async deleteStock(stockId: string): Promise<void> {
    const response = await axios.delete<ApiResponse<void>>(`${API_BASE_URL}/stocks/${stockId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete stock');
    }
  },
};
