import { useEffect, useState } from 'react';
import { Plus, TrendingUp, AlertTriangle, CheckCircle, DollarSign, ChevronLeft, ChevronRight, Calendar, X, Edit2, Copy, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { budgetService } from '../services/budgetService';
import { expenseService } from '../services/expenseService';
import { formatCurrency, formatPercentage, getCurrentMonthYear, getMonthName } from '../utils/formatters';
import { EXPENSE_CATEGORIES } from '../types';
import type { Budget, Expense, ExpenseCategory } from '../types';

export default function EnhancedBudget() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetupAll, setShowSetupAll] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({});
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [investmentGoal, setInvestmentGoal] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showAIBudgetModal, setShowAIBudgetModal] = useState(false);
  const [aiSuggestedBudgets, setAISuggestedBudgets] = useState<Record<string, number>>({});
  const [copyFromMonth, setCopyFromMonth] = useState(new Date().getMonth());
  const [copyFromYear, setCopyFromYear] = useState(new Date().getFullYear());
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetsData, expensesData] = await Promise.all([
        budgetService.getByMonth(selectedMonth, selectedYear),
        expenseService.getByMonth(selectedMonth, selectedYear),
      ]);
      setBudgets(budgetsData);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const budgetWithExpenses = [...EXPENSE_CATEGORIES, ...customCategories].map(category => {
    const budget = budgets.find(b => b.category === category);
    const categoryExpenses = expenses.filter(e => e.category === category);
    const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    return {
      category,
      budget: budget?.monthlyLimit || 0,
      spent,
      remaining: (budget?.monthlyLimit || 0) - spent,
      percentage: budget ? (spent / budget.monthlyLimit) * 100 : 0,
      isOverBudget: budget ? spent > budget.monthlyLimit : false,
      hasbudget: !!budget && budget.monthlyLimit > 0,
      expenseCount: categoryExpenses.length,
    };
  });

  const totalBudget = budgets.reduce((sum, b) => sum + (b?.monthlyLimit || 0), 0);
  const totalSpent = expenses.reduce((sum, e) => sum + (e?.amount || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const categoriesWithBudget = budgetWithExpenses.filter(b => b.hasbudget);
  const categoriesWithoutBudget = budgetWithExpenses.filter(b => !b.hasbudget);
  const overBudgetCategories = categoriesWithBudget.filter(b => b.isOverBudget);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f97316'];
  const budgetPieData = categoriesWithBudget.map(c => ({ name: c.category, value: c.budget }));

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const handleSaveBudgets = async () => {
    try {
      const allCategories = [...EXPENSE_CATEGORIES, ...customCategories];
      const promises = Object.entries(budgetInputs)
        .filter(([_, value]) => value && parseFloat(value) > 0)
        .map(([category, value]) =>
          budgetService.createOrUpdate({
            category: category as ExpenseCategory,
            monthlyLimit: parseFloat(value),
            month: selectedMonth,
            year: selectedYear,
          })
        );
      await Promise.all(promises);
      setShowSetupAll(false);
      setBudgetInputs({});
      loadData();
    } catch (error) {
      console.error('Failed to save budgets:', error);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !customCategories.includes(newCategory.trim())) {
      setCustomCategories([...customCategories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setCustomCategories(customCategories.filter(c => c !== category));
    const { [category]: _, ...rest } = budgetInputs;
    setBudgetInputs(rest);
  };

  const handleEditBudget = (category: string, currentBudget: number) => {
    setEditingBudget(category);
    setEditValue(currentBudget.toString());
  };

  const handleSaveEdit = async () => {
    if (editingBudget) {
      try {
        const value = parseFloat(editValue);
        if (value === 0 || !editValue) {
          // Delete budget if set to 0
          await budgetService.delete(editingBudget, selectedYear, selectedMonth);
        } else if (value > 0) {
          // Update budget
          await budgetService.createOrUpdate({
            category: editingBudget as ExpenseCategory,
            monthlyLimit: value,
            month: selectedMonth,
            year: selectedYear,
          });
        }
        setEditingBudget(null);
        setEditValue('');
        loadData();
      } catch (error) {
        console.error('Failed to update budget:', error);
      }
    }
  };

  const handleCopyBudget = async () => {
    try {
      const sourceBudgets = await budgetService.getByMonth(copyFromMonth, copyFromYear);
      if (sourceBudgets.length === 0) {
        setAlert({
          type: 'error',
          title: 'No Budgets Found',
          message: 'No budgets found for the selected month. Please choose a different month or create budgets first.',
        });
        return;
      }
      const promises = sourceBudgets.map(b =>
        budgetService.createOrUpdate({
          category: b.category,
          monthlyLimit: b.monthlyLimit,
          month: selectedMonth,
          year: selectedYear,
        })
      );
      await Promise.all(promises);
      setShowCopyModal(false);
      setAlert({
        type: 'success',
        title: 'Budget Copied',
        message: `Successfully copied ${sourceBudgets.length} budget(s) to ${getMonthName(selectedMonth)} ${selectedYear}.`,
      });
      loadData();
    } catch (error) {
      console.error('Failed to copy budget:', error);
      setAlert({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy budget. Please try again.',
      });
    }
  };

  const generateAIBudget = async () => {
    try {
      const last3Months = [];
      for (let i = 1; i <= 3; i++) {
        let month = selectedMonth - i;
        let year = selectedYear;
        if (month <= 0) {
          month += 12;
          year -= 1;
        }
        const monthExpenses = await expenseService.getByMonth(month, year);
        last3Months.push(...monthExpenses);
      }

      if (last3Months.length === 0) {
        setAlert({
          type: 'info',
          title: 'Insufficient Data',
          message: 'Not enough expense history to generate budget suggestions. Please add expenses for at least one of the previous 3 months.',
        });
        return;
      }

      const categorySpending: Record<string, number[]> = {};
      last3Months.forEach(expense => {
        if (!categorySpending[expense.category]) {
          categorySpending[expense.category] = [];
        }
        categorySpending[expense.category].push(expense.amount);
      });

      const suggestions: Record<string, number> = {};
      Object.entries(categorySpending).forEach(([category, amounts]) => {
        const total = amounts.reduce((sum, amt) => sum + amt, 0);
        const avg = total / 3;
        const buffer = avg * 0.15;
        suggestions[category] = Math.round((avg + buffer) / 10) * 10;
      });

      setAISuggestedBudgets(suggestions);
      setShowAIBudgetModal(true);
    } catch (error) {
      console.error('Failed to generate budget:', error);
      setAlert({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate budget suggestions. Please try again.',
      });
    }
  };

  const handleApproveAIBudget = async () => {
    try {
      const promises = Object.entries(aiSuggestedBudgets)
        .filter(([_, value]) => value > 0)
        .map(([category, value]) =>
          budgetService.createOrUpdate({
            category: category as ExpenseCategory,
            monthlyLimit: value,
            month: selectedMonth,
            year: selectedYear,
          })
        );
      await Promise.all(promises);
      setShowAIBudgetModal(false);
      setAISuggestedBudgets({});
      setAlert({
        type: 'success',
        title: 'Budget Applied',
        message: `Successfully applied smart budget suggestions for ${getMonthName(selectedMonth)} ${selectedYear}.`,
      });
      loadData();
    } catch (error) {
      console.error('Failed to save budgets:', error);
      setAlert({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save budget suggestions. Please try again.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <h1 className="text-4xl font-bold text-slate-900">Budget Planning</h1>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => navigateMonth('prev')} className="p-1 hover:bg-slate-200 rounded transition-colors">
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <button onClick={() => setShowMonthPicker(!showMonthPicker)} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <p className="text-slate-900 font-medium">{getMonthName(selectedMonth)} {selectedYear}</p>
                </button>
                <button onClick={() => navigateMonth('next')} className="p-1 hover:bg-slate-200 rounded transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              {showMonthPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)} />
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 w-80">
                    <div className="mb-3">
                      <label className="text-xs font-medium text-slate-600 mb-2 block">Year</label>
                      <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-2 block">Month</label>
                      <div className="grid grid-cols-3 gap-2">
                        {months.map((m, i) => (
                          <button key={m} onClick={() => { setSelectedMonth(i + 1); setShowMonthPicker(false); }} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedMonth === i + 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                            {m.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCopyModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
            >
              <Copy className="w-5 h-5" />
              Copy Budget
            </button>
            <button
              onClick={generateAIBudget}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Smart Budget
            </button>
            <button
              onClick={() => setShowSetupAll(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Setup Budgets
            </button>
          </div>
        </div>

        {/* Overall Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <p className="text-sm text-slate-600">Total Budget</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalBudget)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-sm text-slate-600">Total Spent</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalSpent)}</p>
            <p className="text-sm text-slate-600 mt-1">{formatPercentage(overallPercentage)} used</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                totalRemaining >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {totalRemaining >= 0 ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <p className="text-sm text-slate-600">Remaining</p>
            </div>
            <p className={`text-3xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(totalRemaining))}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-sm text-slate-600">Alerts</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{overBudgetCategories.length}</p>
            <p className="text-sm text-slate-600 mt-1">Over budget</p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Overall Budget Progress</h2>
            <span className={`text-lg font-semibold ${
              overallPercentage > 100 ? 'text-red-600' : overallPercentage > 80 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {formatPercentage(overallPercentage)}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                overallPercentage > 100 ? 'bg-red-500' : overallPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, overallPercentage)}%` }}
            />
          </div>
        </div>

        {/* Categories with Budget */}
        {categoriesWithBudget.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Budget by Category</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-center py-3 px-2 text-xs font-semibold text-slate-600 uppercase">Category</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-slate-600 uppercase">Budget</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-slate-600 uppercase">Spent</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-slate-600 uppercase">Remaining</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-slate-600 uppercase">Progress</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-slate-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriesWithBudget.map(item => (
                      <tr key={item.category} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{item.category}</p>
                            <p className="text-xs text-slate-500">{item.expenseCount} expenses</p>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">
                          {editingBudget === item.category ? (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-24 px-2 py-1 border border-blue-500 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => { setEditingBudget(null); setEditValue(''); }} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-sm font-semibold text-slate-900">{formatCurrency(item.budget)}</span>
                              <button onClick={() => handleEditBudget(item.category, item.budget)} className="p-1 text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="text-right py-3 px-2 text-sm font-semibold text-slate-900">{formatCurrency(item.spent)}</td>
                        <td className={`text-right py-3 px-2 text-sm font-semibold ${item.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(item.remaining))}
                        </td>
                        <td className="text-right py-3 px-2">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-slate-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  item.percentage > 100 ? 'bg-red-500' : item.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, item.percentage)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${
                              item.percentage > 100 ? 'text-red-600' : item.percentage > 80 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {formatPercentage(item.percentage)}
                            </span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-2">
                          {item.isOverBudget ? (
                            <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Over
                            </span>
                          ) : item.percentage > 80 ? (
                            <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                              ⚠️ High
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Good
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Budget Distribution Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Budget Distribution</h2>
              {budgetPieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(300, budgetPieData.length * 35)}>
                    <BarChart data={budgetPieData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                        {budgetPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">Allocated</p>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(totalBudget)}</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">Spent</p>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(totalSpent)}</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">Remaining</p>
                      <p className={`text-lg font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(totalRemaining))}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  <p>No budget data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories without Budget */}
        {categoriesWithoutBudget.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Categories Without Budget</h2>
            <p className="text-slate-600 mb-4">Set budgets for these categories to track your spending</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categoriesWithoutBudget.map(item => (
                <button
                  key={item.category}
                  className="px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm font-medium text-slate-700"
                >
                  {item.category}
                  {item.expenseCount > 0 && (
                    <span className="block text-xs text-slate-500 mt-1">
                      {item.expenseCount} expenses • {formatCurrency(item.spent)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Setup Budget Modal */}
        {showSetupAll && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Setup Budgets</h2>
                  <p className="text-sm text-slate-600 mt-1">{getMonthName(selectedMonth)} {selectedYear}</p>
                </div>
                <button onClick={() => { setShowSetupAll(false); setBudgetInputs({}); }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Savings & Investment Goals */}
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Financial Goals</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">💰 Savings Goal</label>
                    <input
                      type="number"
                      placeholder="Monthly savings target"
                      value={savingsGoal}
                      onChange={(e) => setSavingsGoal(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">📈 Investment Goal</label>
                    <input
                      type="number"
                      placeholder="Monthly investment target"
                      value={investmentGoal}
                      onChange={(e) => setInvestmentGoal(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Expense Categories */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Expense Categories</h3>
                <div className="space-y-3">
                  {EXPENSE_CATEGORIES.map(category => {
                    const existing = budgets.find(b => b.category === category);
                    return (
                      <div key={category} className="flex items-center gap-3">
                        <label className="flex-1 text-sm font-medium text-slate-700">{category}</label>
                        <input
                          type="number"
                          placeholder={existing ? formatCurrency(existing.monthlyLimit) : '0.00'}
                          value={budgetInputs[category] || ''}
                          onChange={(e) => setBudgetInputs({ ...budgetInputs, [category]: e.target.value })}
                          className="w-40 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Categories */}
              {customCategories.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Custom Categories</h3>
                  <div className="space-y-3">
                    {customCategories.map(category => (
                      <div key={category} className="flex items-center gap-3">
                        <label className="flex-1 text-sm font-medium text-slate-700">{category}</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={budgetInputs[category] || ''}
                          onChange={(e) => setBudgetInputs({ ...budgetInputs, [category]: e.target.value })}
                          className="w-40 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button onClick={() => handleRemoveCategory(category)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Category */}
              <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                <label className="block text-sm font-medium text-slate-700 mb-2">Add Custom Category</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button onClick={handleAddCategory} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => { setShowSetupAll(false); setBudgetInputs({}); }} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={handleSaveBudgets} className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
                  Save Budgets
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Copy Budget Modal */}
        {showCopyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Copy Budget</h2>
                  <p className="text-sm text-slate-600 mt-1">Copy budgets from another month</p>
                </div>
                <button onClick={() => setShowCopyModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Copy From</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={copyFromMonth} onChange={(e) => setCopyFromMonth(Number(e.target.value))} className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select value={copyFromYear} onChange={(e) => setCopyFromYear(Number(e.target.value))} className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Copy To:</strong> {getMonthName(selectedMonth)} {selectedYear}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowCopyModal(false)} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={handleCopyBudget} className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
                  Copy Budget
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Budget Modal */}
        {showAIBudgetModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Smart Budget Suggestions</h2>
                  <p className="text-sm text-slate-600 mt-1">Based on your last 3 months spending patterns</p>
                </div>
                <button onClick={() => { setShowAIBudgetModal(false); setAISuggestedBudgets({}); }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">Intelligent Analysis</p>
                    <p className="text-xs text-slate-600">
                      These budgets are calculated based on your average spending plus a 15% buffer for flexibility.
                      You can adjust any amount before approving.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {Object.entries(aiSuggestedBudgets).map(([category, amount]) => (
                  <div key={category} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="flex-1 text-sm font-medium text-slate-700">{category}</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAISuggestedBudgets({ ...aiSuggestedBudgets, [category]: parseFloat(e.target.value) || 0 })}
                      className="w-40 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => { setShowAIBudgetModal(false); setAISuggestedBudgets({}); }} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                  Decline
                </button>
                <button onClick={handleApproveAIBudget} className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Approve & Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Alert */}
        {alert && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex flex-col items-center text-center mb-6">
                <div className={`mb-4 p-3 rounded-full ${
                  alert.type === 'success' ? 'bg-green-50 border-2 border-green-200' :
                  alert.type === 'error' ? 'bg-red-50 border-2 border-red-200' :
                  'bg-blue-50 border-2 border-blue-200'
                }`}>
                  {alert.type === 'success' ? <CheckCircle className="w-12 h-12 text-green-600" /> :
                   alert.type === 'error' ? <AlertTriangle className="w-12 h-12 text-red-600" /> :
                   <AlertTriangle className="w-12 h-12 text-blue-600" />}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{alert.title}</h3>
                <p className="text-slate-600">{alert.message}</p>
              </div>
              <button
                onClick={() => setAlert(null)}
                className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
