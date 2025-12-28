import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Target, Sparkles, Edit2, Trash2, Eye, AlertCircle, X, Receipt, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface Contribution {
  amount: number;
  date: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  capitalInHand: number;
  targetDate: string;
  category: string;
  priority: string;
  contributions: Contribution[];
  createdAt: string;
  description?: string;
  isCompleted?: boolean;
  completedDate?: string;
  budget?: number;
  expenses?: Expense[];
}

const STORAGE_KEY = 'goals_data';

export default function GoalAchievements() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [showExpenseTracker, setShowExpenseTracker] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setGoals(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
      setGoals([]);
    }
  };

  const saveData = (data: Goal[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setGoals(data);
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteGoalId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteGoalId) {
      saveData(goals.filter(g => g.id !== deleteGoalId));
      setDeleteGoalId(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleMoveToActive = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const updatedGoal: Goal = {
      ...goal,
      isCompleted: false,
      completedDate: undefined,
    };
    saveData(goals.map(g => g.id === goalId ? updatedGoal : g));
  };

  const handleAddExpense = () => {
    if (!selectedGoal || !newExpense.description || !newExpense.amount) return;
    const amount = parseFloat(newExpense.amount);
    if (amount <= 0) return;
    
    const expense: Expense = {
      id: `exp-${Date.now()}`,
      description: newExpense.description,
      amount,
      date: new Date().toISOString(),
    };
    
    const updatedGoal: Goal = {
      ...selectedGoal,
      expenses: [...(selectedGoal.expenses || []), expense],
    };
    saveData(goals.map(g => g.id === selectedGoal.id ? updatedGoal : g));
    setSelectedGoal(updatedGoal);
    setNewExpense({ description: '', amount: '' });
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!selectedGoal) return;
    const updatedGoal: Goal = {
      ...selectedGoal,
      expenses: (selectedGoal.expenses || []).filter(e => e.id !== expenseId),
    };
    saveData(goals.map(g => g.id === selectedGoal.id ? updatedGoal : g));
    setSelectedGoal(updatedGoal);
  };

  const generateCompletionInsight = (goal: Goal): string => {
    const completionDate = new Date(goal.contributions[goal.contributions.length - 1]?.date || goal.createdAt);
    const daysTaken = Math.ceil((completionDate.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const avgContribution = goal.contributions.length > 0 ? goal.contributions.reduce((sum, c) => sum + c.amount, 0) / goal.contributions.length : 0;
    const totalContributions = goal.contributions.length;
    
    const patterns = [];
    if (avgContribution > goal.targetAmount / 20) patterns.push('💰 large contributions');
    if (totalContributions > 20) patterns.push('🔄 frequent savings');
    if (daysTaken < 180) patterns.push('⚡ quick achievement');
    
    return `Achieved in ${daysTaken} days with ${totalContributions} contributions! Pattern: ${patterns.join(', ') || '💪 consistent effort'}. Avg ${formatCurrency(avgContribution)}/contribution.`;
  };

  const completedGoals = goals.filter(g => g.isCompleted);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/goals')} className="p-2 hover:bg-white rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">🏆 Achievements</h1>
              <p className="text-slate-600 mt-2">Your completed financial goals</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">Total Achievements</p>
            <p className="text-4xl font-bold text-green-600">{completedGoals.length}</p>
          </div>
        </div>

        {completedGoals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg text-slate-500">No completed goals yet</p>
            <p className="text-sm text-slate-400 mt-2">Keep working towards your active goals!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedGoals.map(goal => {
              const isTargetAchieved = goal.currentAmount >= goal.targetAmount;
              return (
                <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <h3 className="text-lg font-bold text-slate-900">{goal.name}</h3>
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">{goal.category}</span>
                        <span className={`px-2 py-1 text-white text-xs rounded-full ${
                          goal.priority === 'High' ? 'bg-red-600' : 
                          goal.priority === 'Medium' ? 'bg-yellow-600' : 'bg-green-600'
                        }`}>{goal.priority}</span>
                        {isTargetAchieved && <span className="px-2 py-1 bg-green-200 text-black text-xs rounded-full font-semibold">✔️ Target Achieved!</span>}
                      </div>
                      <div className="grid grid-cols-4 gap-4 mb-2">
                        <div>
                          <p className="text-xs text-slate-500">Amount Saved</p>
                          <p className="text-lg font-bold text-green-700">{formatCurrency(goal.currentAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Target Amount</p>
                          <p className="text-lg font-bold text-slate-900">{formatCurrency(goal.targetAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Contributions</p>
                          <p className="text-lg font-bold text-blue-700">{goal.contributions.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Completed On</p>
                          <p className="text-sm font-semibold text-slate-700">{new Date(goal.contributions[goal.contributions.length - 1]?.date || goal.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-slate-700">{generateCompletionInsight(goal)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => { setSelectedGoal(goal); setShowExpenseTracker(true); }} className="p-2 text-blue-500 hover:bg-blue-50/50 rounded-lg transition-colors" title="Log Expenses">
                        <Receipt className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleMoveToActive(goal.id)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg" title="Move to Active">
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(goal.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg" title="Delete Goal">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Goal?</h3>
              <p className="text-sm text-slate-600 text-center mb-6">Are you sure you want to delete this goal? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteGoalId(null); }} className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExpenseTracker && selectedGoal && (() => {
        const totalExpenses = (selectedGoal.expenses || []).reduce((sum, e) => sum + e.amount, 0);
        const budgetRemaining = selectedGoal.budget ? selectedGoal.budget - totalExpenses : null;
        
        return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Expense Tracker</h2>
                  <p className="text-sm text-slate-200">{selectedGoal.name}</p>
                </div>
              </div>
              <button onClick={() => { setShowExpenseTracker(false); setSelectedGoal(null); setNewExpense({ description: '', amount: '' }); }} className="p-2 hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedGoal.budget && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">Budget</p>
                    <p className="text-lg font-bold text-blue-900">{formatCurrency(selectedGoal.budget)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <p className="text-xs text-orange-600 mb-1">Total Expenses</p>
                    <p className="text-lg font-bold text-orange-900">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className={`rounded-lg p-3 border ${budgetRemaining !== null && budgetRemaining < 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <p className={`text-xs mb-1 ${budgetRemaining !== null && budgetRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>Remaining</p>
                    <p className={`text-lg font-bold ${budgetRemaining !== null && budgetRemaining < 0 ? 'text-red-900' : 'text-green-900'}`}>{budgetRemaining !== null ? formatCurrency(budgetRemaining) : 'N/A'}</p>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Add New Expense</h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newExpense.description} 
                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} 
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 text-sm" 
                    placeholder="Description (e.g., Groceries, Transport)" 
                  />
                  <input 
                    type="number" 
                    step="0.01"
                    value={newExpense.amount} 
                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} 
                    className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 text-sm" 
                    placeholder="Amount" 
                  />
                  <button onClick={handleAddExpense} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-200">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold text-slate-700">
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">Description</div>
                    <div className="col-span-3">Amount</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-1">Action</div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {(selectedGoal.expenses || []).length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm text-slate-500">No expenses tracked yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {(selectedGoal.expenses || []).map((expense, index) => (
                        <div key={expense.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-slate-50">
                          <div className="col-span-1 text-slate-600">{index + 1}</div>
                          <div className="col-span-5 text-slate-900 font-medium">{expense.description}</div>
                          <div className="col-span-3 text-orange-700 font-bold">{formatCurrency(expense.amount)}</div>
                          <div className="col-span-2 text-slate-600 text-xs">{new Date(expense.date).toLocaleDateString()}</div>
                          <div className="col-span-1">
                            <button onClick={() => handleDeleteExpense(expense.id)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {(selectedGoal.expenses || []).length > 0 && (
                <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">Total Expenses:</span>
                    <span className="text-xl font-bold text-orange-700">{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )})()}
    </div>
  );
}
