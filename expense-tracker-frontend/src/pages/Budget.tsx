import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { BudgetCard } from '../components/budget/BudgetCard';
import { BudgetForm } from '../components/budget/BudgetForm';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { budgetService } from '../services/budgetService';
import { Budget } from '../types';
import { getCurrentMonthYear } from '../utils/formatters';

export const BudgetPage: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { month, year } = getCurrentMonthYear();

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const data = await budgetService.getByMonth(month, year);
      setBudgets(data);
    } catch (error) {
      console.error('Failed to load budgets:', error);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      await budgetService.createOrUpdate({
        category: data.category,
        monthlyLimit: parseFloat(data.monthlyLimit),
        month,
        year,
      });
      setIsModalOpen(false);
      loadBudgets();
    } catch (error) {
      console.error('Failed to save budget:', error);
    }
  };

  const handleDelete = async (category: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      try {
        await budgetService.delete(category, year, month);
        loadBudgets();
      } catch (error) {
        console.error('Failed to delete budget:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Budget Planning</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="inline mr-2" />
          Set Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No budgets set for this month</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <BudgetCard key={budget.budgetId} budget={budget} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Set Budget">
        <BudgetForm onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default BudgetPage;
