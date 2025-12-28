import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Budget } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Card } from '../common/Card';

interface BudgetCardProps {
  budget: Budget;
  onDelete: (category: string) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onDelete }) => {
  const progressPercentage = Math.min(budget.percentageUsed, 100);

  return (
    <Card>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg">{budget.category}</h3>
        {budget.isOverBudget && <AlertCircle className="text-red-500" size={20} />}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Budget</span>
          <span className="font-medium">{formatCurrency(budget.monthlyLimit)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Spent</span>
          <span className={budget.isOverBudget ? 'text-red-600 font-medium' : 'font-medium'}>
            {formatCurrency(budget.spent)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Remaining</span>
          <span className={budget.remaining < 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
            {formatCurrency(budget.remaining)}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <span>Progress</span>
          <span className={budget.isOverBudget ? 'text-red-600' : ''}>{budget.percentageUsed.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${budget.isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <button
        onClick={() => onDelete(budget.category)}
        className="mt-4 text-sm text-red-600 hover:text-red-800"
      >
        Delete Budget
      </button>
    </Card>
  );
};
