import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../common/Card';

interface SpendingTrendChartProps {
  data: Array<{ date: string; amount: number }>;
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    date: new Date(item.date).getDate(),
    amount: item.amount,
  }));

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Daily Spending Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" label={{ value: 'Day', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
