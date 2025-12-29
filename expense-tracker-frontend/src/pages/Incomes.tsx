import React, { useEffect, useState } from 'react';
import { Plus, TrendingUp, Calendar, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { incomeService } from '../services/incomeService';
import { Income, INCOME_CATEGORIES } from '../types';
import { getCurrentMonthYear, formatCurrency, formatDate } from '../utils/formatters';

export default function Incomes() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const { month, year } = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);

  useEffect(() => {
    loadIncomes();
  }, [selectedMonth, selectedYear]);

  const loadIncomes = async () => {
    try {
      const data = await incomeService.getByMonth(selectedMonth, selectedYear);
      setIncomes(data);
    } catch (error) {
      console.error('Failed to load incomes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      amount: parseFloat(formData.get('amount') as string),
      category: formData.get('category') as any,
      source: formData.get('source') as string,
      description: formData.get('description') as string,
      date: new Date(formData.get('date') as string).toISOString(),
    };

    try {
      if (editingIncome) {
        await incomeService.update(editingIncome.incomeId, data);
      } else {
        await incomeService.create(data);
      }
      setIsModalOpen(false);
      setEditingIncome(null);
      loadIncomes();
    } catch (error) {
      console.error('Failed to save income:', error);
    }
  };

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setIsModalOpen(true);
  };

  const handleDelete = async (income: Income) => {
    setIncomeToDelete(income);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (incomeToDelete) {
      try {
        await incomeService.delete(incomeToDelete.incomeId);
        loadIncomes();
      } catch (error) {
        console.error('Failed to delete income:', error);
      }
    }
    setShowDeleteConfirm(false);
    setIncomeToDelete(null);
  };

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Income Tracker</h1>
            <p className="text-slate-600 mt-2">Track all your income sources</p>
          </div>
          <button
            onClick={() => { setEditingIncome(null); setIsModalOpen(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Income
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Total Income</h2>
          </div>
          <p className="text-5xl font-bold">{formatCurrency(totalIncome)}</p>
          <p className="text-green-100 mt-2">{incomes.length} entries this month</p>
        </div>

        {/* Month/Year Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-slate-600" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={2024 + i} value={2024 + i}>
                  {2024 + i}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Income List - Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Income Records</h2>
          </div>
          {incomes.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">No income entries for this month</p>
              <p className="text-slate-500 text-sm mt-2">Click "Add Income" to start tracking</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Category</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Source</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Description</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Amount</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((income) => (
                    <tr key={income.incomeId} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-600">{formatDate(income.date)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {income.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900">{income.source}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">{income.description}</td>
                      <td className="py-3 px-4 text-right text-lg font-bold text-green-600">{formatCurrency(income.amount)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(income)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(income)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              {editingIncome ? 'Edit Income' : 'Add Income'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    required
                    defaultValue={editingIncome?.amount}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={editingIncome?.date.split('T')[0] || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                <select
                  name="category"
                  required
                  defaultValue={editingIncome?.category}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {INCOME_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Source *</label>
                <input
                  type="text"
                  name="source"
                  required
                  defaultValue={editingIncome?.source}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Company Name, Client Name, Investment Platform"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingIncome?.description}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Additional details..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingIncome(null); }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-success">
                  {editingIncome ? 'Update' : 'Add'} Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Delete Income Entry?</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this income entry? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setIncomeToDelete(null); }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
