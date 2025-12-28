import { useEffect, useState } from 'react';
import { Plus, Filter, Search, AlertCircle, TrendingDown, X, Edit2, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Calendar, Copy } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { expenseService } from '../services/expenseService';
import { budgetService } from '../services/budgetService';
import { formatCurrency, formatDate, getCurrentMonthYear, getMonthName } from '../utils/formatters';
import { EXPENSE_CATEGORIES } from '../types';
import type { Expense, Budget, ExpenseCategory } from '../types';

export default function EnhancedExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<{ amount: string; category: ExpenseCategory; description: string; date: string; paymentMode: 'Cash' | 'Credit Card' | 'Debit Card' | 'UPI' | 'Net Banking' | 'Wallet' | 'Other' }>({ amount: '', category: EXPENSE_CATEGORIES[0], description: '', date: new Date().toISOString().split('T')[0], paymentMode: 'UPI' });
  const [bulkExpenses, setBulkExpenses] = useState<Array<{ amount: string; category: ExpenseCategory; description: string; date: string; paymentMode: 'Cash' | 'Credit Card' | 'Debit Card' | 'UPI' | 'Net Banking' | 'Wallet' | 'Other' }>>([{ amount: '', category: EXPENSE_CATEGORIES[0], description: '', date: new Date().toISOString().split('T')[0], paymentMode: 'UPI' }]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalData, setCategoryModalData] = useState<{ category: ExpenseCategory; expenses: Expense[]; stats: any } | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, budgetsData] = await Promise.all([
        expenseService.getByMonth(selectedMonth, selectedYear),
        budgetService.getByMonth(selectedMonth, selectedYear),
      ]);
      setExpenses(expensesData);
      setBudgets(budgetsData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await expenseService.update(editingExpense.expenseId, editingExpense.year, editingExpense.month, { amount: parseFloat(formData.amount), category: formData.category, description: formData.description, date: new Date(formData.date).toISOString(), paymentMode: formData.paymentMode });
      } else {
        await expenseService.create({ amount: parseFloat(formData.amount), category: formData.category, description: formData.description, date: new Date(formData.date).toISOString(), paymentMode: formData.paymentMode });
      }
      setShowModal(false);
      setEditingExpense(null);
      setFormData({ amount: '', category: EXPENSE_CATEGORIES[0], description: '', date: new Date().toISOString().split('T')[0], paymentMode: 'UPI' });
      loadData();
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validExpenses = bulkExpenses.filter(exp => exp.amount && exp.description);
      await Promise.all(validExpenses.map(exp => 
        expenseService.create({ amount: parseFloat(exp.amount), category: exp.category, description: exp.description, date: new Date(exp.date).toISOString(), paymentMode: exp.paymentMode })
      ));
      setShowBulkModal(false);
      setBulkExpenses([{ amount: '', category: EXPENSE_CATEGORIES[0], description: '', date: new Date().toISOString().split('T')[0], paymentMode: 'UPI' }]);
      loadData();
    } catch (error) {
      console.error('Failed to save bulk expenses:', error);
    }
  };

  const addBulkRow = () => {
    setBulkExpenses([...bulkExpenses, { amount: '', category: EXPENSE_CATEGORIES[0], description: '', date: new Date().toISOString().split('T')[0], paymentMode: 'UPI' }]);
  };

  const removeBulkRow = (index: number) => {
    if (bulkExpenses.length > 1) {
      setBulkExpenses(bulkExpenses.filter((_, i) => i !== index));
    }
  };

  const updateBulkRow = (index: number, field: string, value: any) => {
    const updated = [...bulkExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setBulkExpenses(updated);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({ amount: expense.amount.toString(), category: expense.category, description: expense.description, date: new Date(expense.date).toISOString().split('T')[0], paymentMode: expense.paymentMode });
    setShowModal(true);
  };

  const handleDelete = async (expense: Expense) => {
    setExpenseToDelete(expense);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (expenseToDelete) {
      try {
        await expenseService.delete(expenseToDelete.expenseId, expenseToDelete.year, expenseToDelete.month);
        loadData();
      } catch (error) {
        console.error('Failed to delete expense:', error);
      }
    }
    setShowDeleteConfirm(false);
    setExpenseToDelete(null);
  };

  const categoryStats = budgets.map(budget => {
    const categoryExpenses = expenses.filter(e => e.category === budget.category);
    const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget.monthlyLimit - spent;
    const percentage = (spent / budget.monthlyLimit) * 100;
    
    return {
      category: budget.category,
      budget: budget.monthlyLimit,
      spent,
      remaining,
      percentage,
      isOverBudget: spent > budget.monthlyLimit,
      expenseCount: categoryExpenses.length,
    };
  });

  const filteredExpenses = expenses.filter(e => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    return e.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f97316'];
  const categoryExpenseData = categoryStats.filter(c => c.spent > 0).map(c => ({ name: c.category, value: c.spent }));

  // Daily expense data
  const dailyExpenseData = expenses.reduce((acc, expense) => {
    const day = new Date(expense.date).getDate();
    const existing = acc.find(d => d.day === day);
    if (existing) {
      existing.amount += expense.amount;
    } else {
      acc.push({ day, amount: expense.amount });
    }
    return acc;
  }, [] as { day: number; amount: number }[]).sort((a, b) => a.day - b.day);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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
              <h1 className="text-4xl font-bold text-slate-900">Expenses</h1>
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
            <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              <Copy className="w-5 h-5" />
              Bulk Add
            </button>
            <button onClick={() => { setEditingExpense(null); setFormData({ amount: '', category: EXPENSE_CATEGORIES[0], description: '', date: new Date().toISOString().split('T')[0], paymentMode: 'UPI' }); setShowModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
              <Plus className="w-5 h-5" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Total Spent</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalSpent)}</p>
            <p className="text-sm text-slate-600 mt-2">{expenses.length} transactions</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Total Budget</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalBudget)}</p>
            <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${totalSpent > totalBudget ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Remaining</p>
            <p className={`text-3xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(totalBudget - totalSpent))}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              {totalBudget - totalSpent >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </div>
        </div>

        {/* Category Budget Tracker & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget Tracker */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Budget by Category</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {categoryStats.map(stat => (
                <div key={stat.category} className="space-y-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors" onClick={() => { const catExpenses = expenses.filter(e => e.category === stat.category); setCategoryModalData({ category: stat.category, expenses: catExpenses, stats: stat }); setShowCategoryModal(true); }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory(stat.category); }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedCategory === stat.category
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {stat.category}
                      </button>
                      <span className="text-sm text-slate-600">{stat.expenseCount} expenses</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(stat.spent)} / {formatCurrency(stat.budget)}
                      </p>
                      <p className={`text-xs ${stat.isOverBudget ? 'text-red-600' : 'text-slate-600'}`}>
                        {stat.isOverBudget ? 'Over by ' : 'Remaining '}{formatCurrency(Math.abs(stat.remaining))}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        stat.isOverBudget ? 'bg-red-500' : stat.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, stat.percentage)}%` }}
                    />
                  </div>
                  {stat.isOverBudget && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Budget exceeded by {Math.round(stat.percentage - 100)}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Expense Distribution</h2>
            {categoryExpenseData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={Math.max(300, categoryExpenseData.length * 35)}>
                  <BarChart data={categoryExpenseData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                      {categoryExpenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Total Spent</p>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(totalSpent)}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Total Budget</p>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(totalBudget)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400">
                <p>No expense data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Expense Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Daily Expense Trend</h2>
          {dailyExpenseData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyExpenseData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(day) => `Day ${day}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Avg Daily</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(totalSpent / dailyExpenseData.length)}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Highest Day</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(Math.max(...dailyExpenseData.map(d => d.amount)))}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Active Days</p>
                  <p className="text-lg font-bold text-slate-900">{dailyExpenseData.length}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <p>No daily expense data available</p>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Categories
            </button>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {selectedCategory === 'all' ? 'All Expenses' : `${selectedCategory} Expenses`}
            </h2>
          </div>
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <TrendingDown className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg">No expenses found</p>
              <p className="text-sm mt-2">Add your first expense to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Date</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Category</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Description</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Payment Mode</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Amount</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(expense => {
                    const categoryBudget = categoryStats.find(s => s.category === expense.category);
                    return (
                      <tr key={expense.expenseId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                        <td className="text-center py-3 px-4 text-sm text-slate-600">{formatDate(expense.date)}</td>
                        <td className="text-center py-3 px-4">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {expense.category}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <p className="font-medium text-slate-900 text-sm">{expense.description}</p>
                        </td>
                        <td className="text-center py-3 px-4 text-sm text-slate-600">{expense.paymentMode}</td>
                        <td className="text-center py-3 px-4">
                          <p className="font-semibold text-slate-900 text-sm">{formatCurrency(expense.amount)}</p>
                          {categoryBudget && (
                            <p className="text-xs text-slate-500 mt-1">
                              {Math.round((expense.amount / categoryBudget.budget) * 100)}% of budget
                            </p>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleEdit(expense)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(expense)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showBulkModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-5xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Add Multiple Expenses</h2>
                  <p className="text-sm text-slate-500 mt-1">Fill in the details below and add multiple expenses at once</p>
                </div>
                <button onClick={() => { setShowBulkModal(false); setBulkExpenses([{ amount: '', category: EXPENSE_CATEGORIES[0], description: '', date: new Date().toISOString().split('T')[0], paymentMode: 'UPI' }]); }} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleBulkSubmit} className="space-y-6">
                <div className="space-y-3">
                  {bulkExpenses.map((expense, index) => (
                    <div key={index} className="flex gap-3 items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="w-8 text-center">
                        <span className="text-sm font-medium text-slate-500">{index + 1}</span>
                      </div>
                      <input type="number" step="0.01" required value={expense.amount} onChange={(e) => updateBulkRow(index, 'amount', e.target.value)} className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Amount" />
                      <select required value={expense.category} onChange={(e) => updateBulkRow(index, 'category', e.target.value as ExpenseCategory)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">{EXPENSE_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}</select>
                      <input type="text" required value={expense.description} onChange={(e) => updateBulkRow(index, 'description', e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Description" />
                      <input type="date" required value={expense.date} onChange={(e) => updateBulkRow(index, 'date', e.target.value)} className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      <select required value={expense.paymentMode} onChange={(e) => updateBulkRow(index, 'paymentMode', e.target.value)} className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option value="Cash">Cash</option><option value="Credit Card">Card</option><option value="UPI">UPI</option><option value="Wallet">Wallet</option></select>
                      {bulkExpenses.length > 1 && (
                        <button type="button" onClick={() => removeBulkRow(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove row">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addBulkRow} className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors text-sm font-medium">
                  + Add Another Row
                </button>
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button type="button" onClick={() => { setShowBulkModal(false); setBulkExpenses([{ amount: '', category: EXPENSE_CATEGORIES[0], description: '', date: new Date().toISOString().split('T')[0], paymentMode: 'UPI' }]); }} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save {bulkExpenses.filter(e => e.amount && e.description).length} Expenses</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
                <button onClick={() => { setShowModal(false); setEditingExpense(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-2">Amount</label><input type="number" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-2">Category</label><select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">{EXPENSE_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-2">Description</label><input type="text" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="What did you spend on?" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-2">Date</label><input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-2">Payment Mode</label><select required value={formData.paymentMode} onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="Cash">Cash</option><option value="Credit Card">Credit Card</option><option value="Debit Card">Debit Card</option><option value="UPI">UPI</option><option value="Net Banking">Net Banking</option><option value="Wallet">Wallet</option></select></div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={() => { setShowModal(false); setEditingExpense(null); }} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button><button type="submit" className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800">{editingExpense ? 'Update' : 'Add'}</button></div>
              </form>
            </div>
          </div>
        )}

        {showCategoryModal && categoryModalData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{categoryModalData.category} Expenses</h2>
                  <p className="text-sm text-slate-500 mt-1">{categoryModalData.expenses.length} transactions • {formatCurrency(categoryModalData.stats.spent)} spent</p>
                </div>
                <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(categoryModalData.stats.spent)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs text-slate-600 font-medium mb-1">Budget</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(categoryModalData.stats.budget)}</p>
                </div>
                <div className={`rounded-lg p-4 border ${categoryModalData.stats.isOverBudget ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <p className={`text-xs font-medium mb-1 ${categoryModalData.stats.isOverBudget ? 'text-red-600' : 'text-green-600'}`}>{categoryModalData.stats.isOverBudget ? 'Over Budget' : 'Remaining'}</p>
                  <p className={`text-2xl font-bold ${categoryModalData.stats.isOverBudget ? 'text-red-900' : 'text-green-900'}`}>{formatCurrency(Math.abs(categoryModalData.stats.remaining))}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div className={`h-3 rounded-full ${categoryModalData.stats.isOverBudget ? 'bg-red-500' : categoryModalData.stats.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, categoryModalData.stats.percentage)}%` }} />
                </div>
                <p className="text-xs text-slate-600 mt-2 text-center">{Math.round(categoryModalData.stats.percentage)}% of budget used</p>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Description</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Payment</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Amount</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryModalData.expenses.map(expense => (
                      <tr key={expense.expenseId} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-slate-600">{formatDate(expense.date)}</td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">{expense.description}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{expense.paymentMode}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">{formatCurrency(expense.amount)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => { handleEdit(expense); setShowCategoryModal(false); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => { handleDelete(expense); setShowCategoryModal(false); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Delete Expense</h2>
                  <p className="text-sm text-slate-600">This action cannot be undone</p>
                </div>
              </div>
              {expenseToDelete && (
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-600 mb-1">You are about to delete:</p>
                  <p className="font-semibold text-slate-900">{expenseToDelete.description}</p>
                  <p className="text-lg font-bold text-red-600 mt-2">{formatCurrency(expenseToDelete.amount)}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteConfirm(false); setExpenseToDelete(null); }} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
