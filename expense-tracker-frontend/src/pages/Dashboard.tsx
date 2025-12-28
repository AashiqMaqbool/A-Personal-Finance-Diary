import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, PiggyBank } from 'lucide-react';
import { KPICard } from '../components/dashboard/KPICard';
import { CategoryPieChart } from '../components/dashboard/CategoryPieChart';
import { SpendingTrendChart } from '../components/dashboard/SpendingTrendChart';
import { BudgetComparisonChart } from '../components/dashboard/BudgetComparisonChart';
import { analyticsService } from '../services/analyticsService';
import { Analytics } from '../types';
import { formatCurrency, getCurrentMonthYear } from '../utils/formatters';

export const Dashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { month, year } = getCurrentMonthYear();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await analyticsService.getMonthlyAnalytics(month, year);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!analytics) return <div className="text-center py-8">No data available</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total Expenses"
          value={formatCurrency(analytics.summary.totalExpenses)}
          icon={DollarSign}
          color="bg-blue-500"
        />
        <KPICard
          title="Total Budget"
          value={formatCurrency(analytics.summary.totalBudget)}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <KPICard
          title="Savings"
          value={formatCurrency(analytics.summary.totalSavings)}
          icon={PiggyBank}
          color={analytics.summary.totalSavings >= 0 ? 'bg-green-500' : 'bg-red-500'}
          trend={`${analytics.summary.savingsPercentage.toFixed(1)}% of budget`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics.topCategories.length > 0 && (
          <CategoryPieChart data={analytics.topCategories} />
        )}
        {analytics.dailyExpenses.length > 0 && (
          <SpendingTrendChart data={analytics.dailyExpenses} />
        )}
      </div>

      {analytics.categoryBreakdown.length > 0 && (
        <BudgetComparisonChart
          data={analytics.categoryBreakdown.map(item => ({
            category: item.category,
            budget: item.budget,
            spent: item.amount,
          }))}
        />
      )}
    </div>
  );
};

export default Dashboard;
