import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { ExpenseForm } from '../components/expense/ExpenseForm';
import { ExpenseList } from '../components/expense/ExpenseList';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { PeriodNavigator } from '../components/common/PeriodNavigator';
import { expenseService } from '../services/expenseService';
import { Expense } from '../types';
import { getCurrentMonthYear } from '../utils/formatters';

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    loadExpenses();
  }, [selectedMonth, selectedYear]);

  const loadExpenses = async () => {
    try {
      const data = await expenseService.getByMonth(selectedMonth, selectedYear);
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingExpense) {
        await expenseService.update(editingExpense.expenseId, editingExpense.year, editingExpense.month, {
          ...data,
          date: new Date(data.date).toISOString(),
        });
      } else {
        await expenseService.create({
          ...data,
          amount: parseFloat(data.amount),
          date: new Date(data.date).toISOString(),
        });
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      loadExpenses();
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDelete = async (expense: Expense) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseService.delete(expense.expenseId, expense.year, expense.month);
        loadExpenses();
      } catch (error) {
        console.error('Failed to delete expense:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <div className="flex items-center gap-3">
          <PeriodNavigator
            month={selectedMonth}
            year={selectedYear}
            onPeriodChange={(month, year) => {
              setSelectedMonth(month);
              setSelectedYear(year);
            }}
          />
          <Button onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}>
            <Plus size={20} className="inline mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <ExpenseList expenses={expenses} onEdit={handleEdit} onDelete={handleDelete} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingExpense(null); }}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
      >
        <ExpenseForm
          onSubmit={handleSubmit}
          initialData={editingExpense || undefined}
          onCancel={() => { setIsModalOpen(false); setEditingExpense(null); }}
        />
      </Modal>
    </div>
  );
};

export default Expenses;
