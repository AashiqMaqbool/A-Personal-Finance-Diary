import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../common/Card';

interface BudgetComparisonChartProps {
  data: Array<{ category: string; budget: number; spent: number }>;
}

export const BudgetComparisonChart: React.FC<BudgetComparisonChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    category: item.category.substring(0, 8),
    Budget: item.budget,
    Spent: item.spent,
  }));

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Budget vs Actual</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Legend />
          <Bar dataKey="Budget" fill="#10B981" />
          <Bar dataKey="Spent" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
