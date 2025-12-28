import React from 'react';
import { Trash2, Edit } from 'lucide-react';
import { Expense } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onEdit, onDelete }) => {
  if (expenses.length === 0) {
    return <div className="text-center py-8 text-gray-500">No expenses found</div>;
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <div key={expense.expenseId} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-lg">{formatCurrency(expense.amount)}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{expense.category}</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">{expense.description}</p>
            <div className="flex gap-4 text-xs text-gray-500 mt-2">
              <span>{formatDate(expense.date)}</span>
              {expense.paymentMode && <span>{expense.paymentMode}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(expense)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
              <Edit size={18} />
            </button>
            <button onClick={() => onDelete(expense)} className="p-2 text-red-600 hover:bg-red-50 rounded">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
