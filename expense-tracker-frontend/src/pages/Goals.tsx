import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, TrendingUp, Calendar, DollarSign, AlertCircle, CheckCircle, Edit2, Trash2, X, Sparkles, CalendarDays, Eye, ArrowLeft, Brain, Receipt, Flag } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { getUserData, setUserData } from '../utils/userStorage';

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

interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
}

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  capitalInHand: number;
  targetDate: string;
  category: 'Emergency Fund' | 'Vacation' | 'Home' | 'Car' | 'Education' | 'Retirement' | 'Other';
  priority: 'High' | 'Medium' | 'Low';
  contributions: Contribution[];
  createdAt: string;
  description?: string;
  isCompleted?: boolean;
  completedDate?: string;
  budget?: number;
  expenses?: Expense[];
  milestones?: Milestone[];
}

interface AIInsight {
  goalId: string;
  achievableDate: string;
  monthlySavingsRequired: number;
  weeklySavingsRequired: number;
  status: 'On Track' | 'Behind' | 'Ahead';
  daysRemaining: number;
  progressPercentage: number;
}

const STORAGE_KEY = 'goals_data';

export default function Goals() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showContributionDetails, setShowContributionDetails] = useState(false);
  const [showAIAnalyzer, setShowAIAnalyzer] = useState(false);
  const [showExpenseTracker, setShowExpenseTracker] = useState(false);
  const [showMilestoneTracker, setShowMilestoneTracker] = useState(false);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [hoveredGoal, setHoveredGoal] = useState<string | null>(null);
  const [hoveredInsight, setHoveredInsight] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '' });
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '' });
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    capitalInHand: '',
    targetDate: '',
    category: 'Other' as Goal['category'],
    priority: 'Medium' as Goal['priority'],
    description: '',
    budget: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const data = getUserData<Goal[]>(STORAGE_KEY, []);
      setGoals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load goals:', error);
      setGoals([]);
    }
  };

  const saveData = (data: Goal[]) => {
    try {
      setUserData(STORAGE_KEY, data);
      setGoals(data);
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  };

  const generateAIRecommendation = (goal: Goal): string => {
    const insights = calculateAIInsights(goal);
    if (insights.status === 'Behind') {
      return `💪 Boost your savings! Try saving ${formatCurrency(insights.weeklySavingsRequired)}/week. Cut one dining expense weekly to catch up!`;
    } else if (insights.status === 'Ahead') {
      return `🎉 You're crushing it! Keep this momentum and achieve your goal ${Math.ceil((new Date(insights.achievableDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days early!`;
    }
    return `✨ Stay consistent! Small weekly contributions of ${formatCurrency(insights.weeklySavingsRequired)} will get you there. You've got this!`;
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
    
    return `🎯 Achieved in ${daysTaken} days with ${totalContributions} contributions! Success pattern: ${patterns.join(', ') || '💪 consistent effort'}. Avg ${formatCurrency(avgContribution)}/contribution.`;
  };

  const generateAIAnalysis = () => {
    const totalGoals = goals.length;
    const completed = completedGoals.length;
    const active = activeGoals.length;
    
    // Goal Type Analysis
    const categoryCount: Record<string, number> = {};
    goals.forEach(g => {
      categoryCount[g.category] = (categoryCount[g.category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
    
    // Achievement Frequency
    const completedWithDates = completedGoals.filter(g => g.completedDate);
    const avgCompletionTime = completedWithDates.length > 0 
      ? completedWithDates.reduce((sum, g) => {
          const days = Math.ceil((new Date(g.completedDate!).getTime() - new Date(g.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / completedWithDates.length
      : 0;
    
    // Priority Analysis
    const highPriority = goals.filter(g => g.priority === 'High').length;
    const mediumPriority = goals.filter(g => g.priority === 'Medium').length;
    const lowPriority = goals.filter(g => g.priority === 'Low').length;
    
    // Success Rate
    const successRate = totalGoals > 0 ? (completed / totalGoals) * 100 : 0;
    
    // Average Target Amount
    const avgTarget = totalGoals > 0 ? goals.reduce((sum, g) => sum + g.targetAmount, 0) / totalGoals : 0;
    
    // Fastest Achievement
    const fastestGoal = completedWithDates.length > 0
      ? completedWithDates.reduce((fastest, g) => {
          const days = Math.ceil((new Date(g.completedDate!).getTime() - new Date(g.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          const fastestDays = Math.ceil((new Date(fastest.completedDate!).getTime() - new Date(fastest.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          return days < fastestDays ? g : fastest;
        })
      : null;
    
    // Contribution Patterns
    const totalContributions = goals.reduce((sum, g) => sum + g.contributions.length, 0);
    const avgContributionsPerGoal = totalGoals > 0 ? totalContributions / totalGoals : 0;
    
    return {
      totalGoals,
      completed,
      active,
      topCategory,
      categoryCount,
      avgCompletionTime,
      highPriority,
      mediumPriority,
      lowPriority,
      successRate,
      avgTarget,
      fastestGoal,
      avgContributionsPerGoal,
    };
  };

  const calculateAIInsights = (goal: Goal): AIInsight => {
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const targetDate = new Date(goal.targetDate);
    const today = new Date();
    const createdDate = new Date(goal.createdAt);
    
    // Validate dates
    if (isNaN(targetDate.getTime()) || isNaN(createdDate.getTime())) {
      return {
        goalId: goal.id,
        achievableDate: new Date().toISOString().split('T')[0],
        monthlySavingsRequired: 0,
        weeklySavingsRequired: 0,
        status: 'On Track',
        daysRemaining: 0,
        progressPercentage: 0,
      };
    }
    
    const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const monthsRemaining = Math.max(1, daysRemaining / 30);
    const weeksRemaining = Math.max(1, daysRemaining / 7);
    
    const monthlySavingsRequired = remaining / monthsRemaining;
    const weeklySavingsRequired = remaining / weeksRemaining;
    const progressPercentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    
    const timeSinceCreation = today.getTime() - createdDate.getTime();
    const totalTimeToTarget = targetDate.getTime() - createdDate.getTime();
    const expectedProgress = totalTimeToTarget > 0 ? (timeSinceCreation / totalTimeToTarget) * 100 : 0;
    
    let status: 'On Track' | 'Behind' | 'Ahead' = 'On Track';
    if (progressPercentage > expectedProgress + 10) status = 'Ahead';
    else if (progressPercentage < expectedProgress - 10) status = 'Behind';
    
    // Calculate achievable date based on current savings rate
    const daysSinceCreation = Math.max(1, timeSinceCreation / (1000 * 60 * 60 * 24));
    const currentRate = goal.currentAmount / daysSinceCreation;
    const daysToComplete = currentRate > 0 ? remaining / currentRate : daysRemaining;
    const achievableDate = new Date(today.getTime() + Math.max(0, daysToComplete) * 24 * 60 * 60 * 1000);
    
    return {
      goalId: goal.id,
      achievableDate: achievableDate.toISOString().split('T')[0],
      monthlySavingsRequired: Math.max(0, monthlySavingsRequired),
      weeklySavingsRequired: Math.max(0, weeklySavingsRequired),
      status,
      daysRemaining,
      progressPercentage: Math.min(100, progressPercentage),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCapitalInHand = parseFloat(formData.capitalInHand) || 0;
    
    if (editingGoal) {
      const oldCapitalInHand = editingGoal.capitalInHand;
      const capitalDifference = newCapitalInHand - oldCapitalInHand;
      const nonCapitalContributions = editingGoal.contributions.slice(1);
      const totalNonCapitalAmount = nonCapitalContributions.reduce((sum, c) => sum + c.amount, 0);
      
      const goal: Goal = {
        ...editingGoal,
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: newCapitalInHand + totalNonCapitalAmount,
        capitalInHand: newCapitalInHand,
        targetDate: formData.targetDate,
        category: formData.category,
        priority: formData.priority,
        contributions: newCapitalInHand > 0 ? [{ amount: newCapitalInHand, date: editingGoal.contributions[0]?.date || new Date().toISOString() }, ...nonCapitalContributions] : nonCapitalContributions,
        description: formData.description || undefined,
        budget: parseFloat(formData.budget) || undefined,
        expenses: editingGoal.expenses || [],
      };
      saveData(goals.map(g => g.id === editingGoal.id ? goal : g));
    } else {
      const goal: Goal = {
        id: `goal-${Date.now()}`,
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: newCapitalInHand,
        capitalInHand: newCapitalInHand,
        targetDate: formData.targetDate,
        category: formData.category,
        priority: formData.priority,
        contributions: newCapitalInHand > 0 ? [{ amount: newCapitalInHand, date: new Date().toISOString() }] : [],
        createdAt: new Date().toISOString(),
        description: formData.description || undefined,
        isCompleted: false,
        budget: parseFloat(formData.budget) || undefined,
        expenses: [],
      };
      saveData([...goals, goal]);
    }
    resetForm();
  };

  const handleContribution = () => {
    if (!selectedGoal || !contributionAmount) return;
    const amount = parseFloat(contributionAmount);
    if (amount <= 0) return;
    
    const updatedGoal: Goal = {
      ...selectedGoal,
      currentAmount: selectedGoal.currentAmount + amount,
      contributions: [...selectedGoal.contributions, { amount, date: new Date().toISOString() }],
    };
    saveData(goals.map(g => g.id === selectedGoal.id ? updatedGoal : g));
    setContributionAmount('');
    setShowContributionModal(false);
    setSelectedGoal(null);
  };

  const handleMarkCompleted = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const updatedGoal: Goal = {
      ...goal,
      isCompleted: true,
      completedDate: new Date().toISOString(),
      currentAmount: goal.targetAmount,
    };
    saveData(goals.map(g => g.id === goalId ? updatedGoal : g));
  };

  const handleMoveToActive = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const updatedGoal: Goal = {
      ...goal,
      isCompleted: false,
      completedDate: undefined,
      currentAmount: goal.currentAmount < goal.targetAmount ? goal.currentAmount : goal.currentAmount,
    };
    saveData(goals.map(g => g.id === goalId ? updatedGoal : g));
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

  const handleAddMilestone = () => {
    if (!selectedGoal || !newMilestone.title) return;
    
    const milestone: Milestone = {
      id: `ms-${Date.now()}`,
      title: newMilestone.title,
      description: newMilestone.description,
      date: new Date().toISOString(),
    };
    
    const updatedGoal: Goal = {
      ...selectedGoal,
      milestones: [...(selectedGoal.milestones || []), milestone],
    };
    saveData(goals.map(g => g.id === selectedGoal.id ? updatedGoal : g));
    setSelectedGoal(updatedGoal);
    setNewMilestone({ title: '', description: '' });
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    if (!selectedGoal) return;
    const updatedGoal: Goal = {
      ...selectedGoal,
      milestones: (selectedGoal.milestones || []).filter(m => m.id !== milestoneId),
    };
    saveData(goals.map(g => g.id === selectedGoal.id ? updatedGoal : g));
    setSelectedGoal(updatedGoal);
  };

  const resetForm = () => {
    setFormData({ name: '', targetAmount: '', capitalInHand: '', targetDate: '', category: 'Other', priority: 'Medium', description: '', budget: '' });
    setEditingGoal(null);
    setShowModal(false);
  };

  const activeGoals = goals.filter(g => !g.isCompleted);
  const completedGoals = goals.filter(g => g.isCompleted);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Financial Goals</h1>
            <p className="text-slate-600 mt-2">Track and achieve your financial dreams</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAIAnalyzer(true)} className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700">
              <Brain className="w-5 h-5" />
              AI Analyzer
            </button>
            <button onClick={() => navigate('/goals/achievements')} className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600">
              <CheckCircle className="w-5 h-5" />
              Achievements
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800">
              <Plus className="w-5 h-5" />
              Add Goal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600">Active Goals</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{activeGoals.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-slate-600">Completed</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{completedGoals.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-slate-600">Total Saved</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalSaved)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm text-slate-600">Total Target</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalTarget)}</p>
          </div>
        </div>

        {activeGoals.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Active Goals</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeGoals.map(goal => {
                const insights = calculateAIInsights(goal);
                const isHovered = hoveredGoal === goal.id;
                return (
                  <div key={goal.id} className="relative bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-3 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 text-sm">{goal.name}</h3>
                          <span className="px-2 py-0.5 bg-slate-900 text-white text-xs rounded-full">{goal.category}</span>
                        </div>
                        <p className="text-xs text-slate-500">🎯 {new Date(goal.targetDate).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setSelectedGoal(goal); setShowMilestoneTracker(true); }} className="px-2 py-1 bg-purple-50/50 text-purple-600 text-xs rounded-lg hover:bg-purple-100/50 flex items-center gap-1 transition-colors">
                          <Flag className="w-3 h-3" />
                          Milestones
                        </button>
                        <button onClick={() => { setSelectedGoal(goal); setShowExpenseTracker(true); }} className="px-2 py-1 bg-blue-50/50 text-blue-600 text-xs rounded-lg hover:bg-blue-100/50 flex items-center gap-1 transition-colors">
                          <Receipt className="w-3 h-3" />
                          Log Expenses
                        </button>
                        <div className="relative">
                          <button 
                            onMouseEnter={() => setHoveredGoal(goal.id)} 
                            onMouseLeave={() => setHoveredGoal(null)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          {isHovered && (
                            <div className="absolute right-0 top-8 w-64 bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl z-10">
                              <p>{generateAIRecommendation(goal)}</p>
                            </div>
                          )}
                        </div>
                        <button onClick={() => { 
                          setEditingGoal(goal); 
                          setFormData({ 
                            name: goal.name, 
                            targetAmount: goal.targetAmount.toString(), 
                            capitalInHand: goal.capitalInHand.toString(), 
                            targetDate: goal.targetDate, 
                            category: goal.category, 
                            priority: goal.priority, 
                            description: goal.description ?? '',
                            budget: goal.budget?.toString() ?? ''
                          }); 
                          setShowModal(true); 
                        }} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(goal.id)} className="p-1.5 text-slate-600 hover:bg-red-100 hover:text-red-600 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="bg-white rounded-lg p-2 border border-slate-100">
                        <p className="text-xs text-slate-500">Target</p>
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(goal.targetAmount)}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                        <p className="text-xs text-green-600">Saved</p>
                        <p className="text-sm font-bold text-green-700">{formatCurrency(goal.currentAmount)}</p>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">{Math.round(insights.progressPercentage)}%</span>
                        <span className={`font-semibold ${insights.status === 'Ahead' ? 'text-green-600' : insights.status === 'Behind' ? 'text-red-600' : 'text-blue-600'}`}>
                          {insights.status}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all ${insights.status === 'Ahead' ? 'bg-green-500' : insights.status === 'Behind' ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${insights.progressPercentage}%` }} />
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="relative">
                          <button 
                            onMouseEnter={() => setHoveredInsight(`${goal.id}-monthly`)} 
                            onMouseLeave={() => setHoveredInsight(null)}
                            className="w-full text-left"
                          >
                            <p className="text-blue-600 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Monthly
                            </p>
                            <p className="font-bold text-blue-900">{formatCurrency(insights.monthlySavingsRequired)}</p>
                          </button>
                          {hoveredInsight === `${goal.id}-monthly` && (
                            <div className="absolute bottom-full left-0 mb-1 w-32 bg-slate-900 text-white text-xs p-2 rounded-lg shadow-xl z-10">
                              Save this amount every month to reach your goal
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <button 
                            onMouseEnter={() => setHoveredInsight(`${goal.id}-weekly`)} 
                            onMouseLeave={() => setHoveredInsight(null)}
                            className="w-full text-left"
                          >
                            <p className="text-blue-600 flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              Weekly
                            </p>
                            <p className="font-bold text-blue-900">{formatCurrency(insights.weeklySavingsRequired)}</p>
                          </button>
                          {hoveredInsight === `${goal.id}-weekly` && (
                            <div className="absolute bottom-full left-0 mb-1 w-32 bg-slate-900 text-white text-xs p-2 rounded-lg shadow-xl z-10">
                              Save this amount every week to reach your goal
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <button 
                            onMouseEnter={() => setHoveredInsight(`${goal.id}-daily`)} 
                            onMouseLeave={() => setHoveredInsight(null)}
                            className="w-full text-left"
                          >
                            <p className="text-blue-600 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Daily
                            </p>
                            <p className="font-bold text-blue-900">{formatCurrency(insights.weeklySavingsRequired / 7)}</p>
                          </button>
                          {hoveredInsight === `${goal.id}-daily` && (
                            <div className="absolute bottom-full left-0 mb-1 w-32 bg-slate-900 text-white text-xs p-2 rounded-lg shadow-xl z-10">
                              Save this amount every day to reach your goal
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedGoal(goal); setShowContributionModal(true); }} className="flex-1 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 flex items-center justify-center gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        Add Contribution
                      </button>
                      <button onClick={() => { setSelectedGoal(goal); setShowContributionDetails(true); }} className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                      </button>
                      <button onClick={() => handleMarkCompleted(goal.id)} className="flex-1 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Mark Complete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {completedGoals.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Completed Goals 🎉</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {completedGoals.map(goal => {
                const isTargetAchieved = goal.currentAmount >= goal.targetAmount;
                return (
                <div key={goal.id} className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-slate-900">{goal.name}</h3>
                      {isTargetAchieved && <span className="px-2 py-0.5 bg-green-200 text-black text-xs rounded-full font-semibold">✔️ Target Achieved!</span>}
                    </div>
                    <button onClick={() => { setSelectedGoal(goal); setShowExpenseTracker(true); }} className="px-2 py-1 bg-blue-50/50 text-blue-600 text-xs rounded-lg hover:bg-blue-100/50 flex items-center gap-1 transition-colors">
                      <Receipt className="w-3 h-3" />
                      Log Expenses
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{goal.category}</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(goal.currentAmount)}</p>
                  <p className="text-xs text-slate-500 mt-1">Completed on {new Date(goal.contributions[goal.contributions.length - 1]?.date || goal.createdAt).toLocaleDateString()}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { setSelectedGoal(goal); setShowContributionDetails(true); }} className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>
                    <button onClick={() => handleMoveToActive(goal.id)} className="flex-1 px-3 py-2 bg-slate-600 text-white text-xs font-medium rounded-lg hover:bg-slate-700 flex items-center justify-center gap-1">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Move to Active
                    </button>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}

        {goals.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg text-slate-500">No goals set yet</p>
            <p className="text-sm text-slate-400 mt-2">Start by adding your first financial goal</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">{editingGoal ? 'Edit Goal' : 'Add New Goal'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Goal Name *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="e.g., Emergency Fund" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Amount *</label>
                  <input type="number" required value={formData.targetAmount} onChange={e => setFormData({ ...formData, targetAmount: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="50000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capital in Hand</label>
                  <input type="number" value={formData.capitalInHand} onChange={e => setFormData({ ...formData, capitalInHand: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="10000" />
                </div>
              </div>
              {formData.targetAmount && formData.capitalInHand && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">Remaining Needed</p>
                  <p className="text-lg font-bold text-blue-900">{formatCurrency(parseFloat(formData.targetAmount) - parseFloat(formData.capitalInHand))}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Date *</label>
                <input type="date" required value={formData.targetDate} onChange={e => setFormData({ ...formData, targetDate: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as Goal['category'] })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900">
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Home">Home</option>
                  <option value="Car">Car</option>
                  <option value="Education">Education</option>
                  <option value="Retirement">Retirement</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority *</label>
                <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value as Goal['priority'] })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900">
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" rows={2} placeholder="Why is this goal important to you?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Budget (Optional)</label>
                <input type="number" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="Monthly budget for this goal" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">{editingGoal ? 'Update' : 'Add'} Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showContributionModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Add Contribution</h2>
              <button onClick={() => { setShowContributionModal(false); setSelectedGoal(null); setContributionAmount(''); }} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Contributing to</p>
                <p className="text-lg font-bold text-slate-900">{selectedGoal.name}</p>
                <p className="text-sm text-slate-600 mt-2">Current: {formatCurrency(selectedGoal.currentAmount)} / {formatCurrency(selectedGoal.targetAmount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contribution Amount *</label>
                <input type="number" step="0.01" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900" placeholder="1000" autoFocus />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowContributionModal(false); setSelectedGoal(null); setContributionAmount(''); }} className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">Cancel</button>
                <button onClick={handleContribution} className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">Add Contribution</button>
              </div>
            </div>
          </div>
        </div>
      )}



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

      {showContributionDetails && selectedGoal && (() => {
        const insights = calculateAIInsights(selectedGoal);
        const daysElapsed = Math.ceil((new Date().getTime() - new Date(selectedGoal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const totalDays = Math.ceil((new Date(selectedGoal.targetDate).getTime() - new Date(selectedGoal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const progressByTime = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
        const avgContribution = selectedGoal.contributions.length > 0 ? selectedGoal.contributions.reduce((sum, c) => sum + c.amount, 0) / selectedGoal.contributions.length : 0;
        const remainingAmount = Math.max(0, selectedGoal.targetAmount - selectedGoal.currentAmount);
        
        return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Goal Details</h2>
              </div>
              <button onClick={() => { setShowContributionDetails(false); setSelectedGoal(null); }} className="p-2 hover:bg-blue-800 rounded-lg">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{selectedGoal.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 bg-slate-900 text-white text-xs rounded-full">{selectedGoal.category}</span>
                      <span className={`px-3 py-1 text-white text-xs rounded-full ${
                        selectedGoal.priority === 'High' ? 'bg-red-600' : 
                        selectedGoal.priority === 'Medium' ? 'bg-yellow-600' : 'bg-green-600'
                      }`}>{selectedGoal.priority} Priority</span>
                      {selectedGoal.isCompleted && <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">✓ Completed</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Progress</p>
                    <p className="text-3xl font-bold text-blue-600">{Math.round(insights.progressPercentage)}%</p>
                  </div>
                </div>
                {selectedGoal.description && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">Description</p>
                    <p className="text-sm text-slate-700">{selectedGoal.description}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-green-600 mb-1">Current Amount</p>
                  <p className="text-lg font-bold text-green-700">{formatCurrency(selectedGoal.currentAmount)}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">Target Amount</p>
                  <p className="text-lg font-bold text-blue-700">{formatCurrency(selectedGoal.targetAmount)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
                  <p className="text-xs text-orange-600 mb-1">Remaining</p>
                  <p className="text-lg font-bold text-orange-700">{formatCurrency(remainingAmount)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-purple-600 mb-1">Days Remaining</p>
                  <p className="text-lg font-bold text-purple-700">{insights.daysRemaining}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Timeline & Progress</h4>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-slate-600">Created On</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(selectedGoal.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Target Date</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(selectedGoal.targetDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Days Elapsed</p>
                    <p className="text-sm font-bold text-slate-900">{daysElapsed} / {totalDays}</p>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">Time Progress</span>
                    <span className="font-semibold text-slate-900">{Math.round(progressByTime)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-slate-600 h-2 rounded-full" style={{ width: `${Math.min(100, progressByTime)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">Amount Progress</span>
                    <span className={`font-semibold ${
                      insights.status === 'Ahead' ? 'text-green-600' : 
                      insights.status === 'Behind' ? 'text-red-600' : 'text-blue-600'
                    }`}>{insights.status}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${
                      insights.status === 'Ahead' ? 'bg-green-500' : 
                      insights.status === 'Behind' ? 'bg-red-500' : 'bg-blue-500'
                    }`} style={{ width: `${insights.progressPercentage}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Savings Required</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">📅 Monthly</p>
                    <p className="text-lg font-bold text-blue-900">{formatCurrency(insights.monthlySavingsRequired)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">🗓️ Weekly</p>
                    <p className="text-lg font-bold text-blue-900">{formatCurrency(insights.weeklySavingsRequired)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">💵 Daily</p>
                    <p className="text-lg font-bold text-blue-900">{formatCurrency(insights.weeklySavingsRequired / 7)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Contribution Statistics</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-purple-600">Total Contributions</p>
                    <p className="text-xl font-bold text-purple-900">{selectedGoal.contributions.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600">Average Amount</p>
                    <p className="text-xl font-bold text-purple-900">{formatCurrency(avgContribution)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600">Initial Capital</p>
                    <p className="text-xl font-bold text-purple-900">{formatCurrency(selectedGoal.capitalInHand)}</p>
                  </div>
                </div>
              </div>

              {insights.status !== 'On Track' && (
                <div className={`rounded-xl p-4 border-2 ${
                  insights.status === 'Ahead' 
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300' 
                    : 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <Sparkles className={`w-5 h-5 mt-0.5 ${
                      insights.status === 'Ahead' ? 'text-green-600' : 'text-red-600'
                    }`} />
                    <div>
                      <p className={`text-sm font-semibold mb-1 ${
                        insights.status === 'Ahead' ? 'text-green-900' : 'text-red-900'
                      }`}>AI Insight</p>
                      <p className="text-sm text-slate-700">
                        {insights.status === 'Ahead' 
                          ? `🎉 You're ahead of schedule! At this pace, you'll reach your goal by ${new Date(insights.achievableDate).toLocaleDateString()}, which is ${Math.ceil((new Date(selectedGoal.targetDate).getTime() - new Date(insights.achievableDate).getTime()) / (1000 * 60 * 60 * 24))} days early!`
                          : `⚠️ You're behind schedule. To catch up, try increasing your contributions to ${formatCurrency(insights.weeklySavingsRequired)}/week or adjust your target date.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Contribution History ({selectedGoal.contributions.length})</h4>
                {selectedGoal.contributions.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500">No contributions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedGoal.contributions.map((contribution, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{formatCurrency(contribution.amount)}</p>
                            <p className="text-xs text-slate-500">{new Date(contribution.date).toLocaleDateString()} at {new Date(contribution.date).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {index === 0 && selectedGoal.capitalInHand > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">Initial Capital</span>
                          )}
                          <span className="text-xs text-slate-500">#{selectedGoal.contributions.length - index}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )})()}

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

      {showMilestoneTracker && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flag className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Milestones</h2>
                  <p className="text-sm text-purple-100">{selectedGoal.name}</p>
                </div>
              </div>
              <button onClick={() => { setShowMilestoneTracker(false); setSelectedGoal(null); setNewMilestone({ title: '', description: '' }); }} className="p-2 hover:bg-purple-800 rounded-lg">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Add New Milestone</h3>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={newMilestone.title} 
                    onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-sm" 
                    placeholder="Milestone title (e.g., Reached 50% of goal)" 
                  />
                  <textarea 
                    value={newMilestone.description} 
                    onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-sm" 
                    rows={2}
                    placeholder="Description (optional)" 
                  />
                  <button onClick={handleAddMilestone} className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-1">
                    <Plus className="w-4 h-4" />
                    Add Milestone
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Milestone History ({(selectedGoal.milestones || []).length})</h4>
                {(selectedGoal.milestones || []).length === 0 ? (
                  <div className="text-center py-8">
                    <Flag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500">No milestones logged yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(selectedGoal.milestones || []).map((milestone) => (
                      <div key={milestone.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Flag className="w-4 h-4 text-purple-600" />
                              <h5 className="font-semibold text-slate-900">{milestone.title}</h5>
                            </div>
                            {milestone.description && (
                              <p className="text-sm text-slate-600 mb-2">{milestone.description}</p>
                            )}
                            <p className="text-xs text-slate-500">{new Date(milestone.date).toLocaleDateString()} at {new Date(milestone.date).toLocaleTimeString()}</p>
                          </div>
                          <button onClick={() => handleDeleteMilestone(milestone.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAIAnalyzer && (() => {
        const analysis = generateAIAnalysis();
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">AI Goal Analyzer</h2>
                </div>
                <button onClick={() => setShowAIAnalyzer(false)} className="p-2 hover:bg-purple-800 rounded-lg">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {analysis.totalGoals === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg text-slate-500">No goals to analyze yet</p>
                    <p className="text-sm text-slate-400 mt-2">Start adding goals to get AI-powered insights!</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <p className="text-sm text-blue-600 mb-1">Total Goals</p>
                        <p className="text-3xl font-bold text-blue-900">{analysis.totalGoals}</p>
                        <p className="text-xs text-blue-600 mt-1">{analysis.active} active, {analysis.completed} completed</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <p className="text-sm text-green-600 mb-1">Success Rate</p>
                        <p className="text-3xl font-bold text-green-900">{Math.round(analysis.successRate)}%</p>
                        <p className="text-xs text-green-600 mt-1">{analysis.completed} goals achieved</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <p className="text-sm text-purple-600 mb-1">Avg Completion Time</p>
                        <p className="text-3xl font-bold text-purple-900">{Math.round(analysis.avgCompletionTime)}</p>
                        <p className="text-xs text-purple-600 mt-1">days to achieve goals</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-bold text-slate-900">Goal Type Analysis</h3>
                      </div>
                      <p className="text-sm text-slate-700 mb-3">
                        🎯 Your primary focus is <span className="font-bold text-purple-600">{analysis.topCategory?.[0] || 'N/A'}</span> with {analysis.topCategory?.[1] || 0} goal(s). 
                        {analysis.categoryCount['Emergency Fund'] > 0 && ' 🛡️ Great job prioritizing financial security!'}
                        {analysis.categoryCount['Retirement'] > 0 && ' 🌅 Planning for the future shows wisdom!'}
                        {analysis.categoryCount['Education'] > 0 && ' 📚 Investing in knowledge is investing in yourself!'}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(analysis.categoryCount).map(([cat, count]) => (
                          <div key={cat} className="bg-white rounded-lg p-2 border border-slate-200">
                            <p className="text-xs text-slate-600">{cat}</p>
                            <p className="text-lg font-bold text-slate-900">{count}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-bold text-slate-900">Priority Distribution</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-red-200">
                          <p className="text-xs text-red-600 mb-1">🔴 High Priority</p>
                          <p className="text-2xl font-bold text-red-700">{analysis.highPriority}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-yellow-200">
                          <p className="text-xs text-yellow-600 mb-1">🟡 Medium Priority</p>
                          <p className="text-2xl font-bold text-yellow-700">{analysis.mediumPriority}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-xs text-green-600 mb-1">🟢 Low Priority</p>
                          <p className="text-2xl font-bold text-green-700">{analysis.lowPriority}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 mt-3">
                        💡 <span className="font-semibold">AI Recommendation:</span> {analysis.highPriority > analysis.mediumPriority + analysis.lowPriority 
                          ? 'You have many high-priority goals. Focus on 2-3 at a time to avoid burnout!' 
                          : analysis.highPriority === 0 
                          ? 'Consider marking your most important goals as high priority to stay focused!' 
                          : 'Good balance! Keep focusing on high-priority goals first.'}
                      </p>
                    </div>

                    {analysis.fastestGoal && (
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h3 className="text-lg font-bold text-slate-900">Fastest Achievement</h3>
                        </div>
                        <p className="text-sm text-slate-700">
                          ⚡ You achieved <span className="font-bold text-green-600">{analysis.fastestGoal.name}</span> in just{' '}
                          <span className="font-bold">
                            {Math.ceil((new Date(analysis.fastestGoal.completedDate!).getTime() - new Date(analysis.fastestGoal.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                          </span>! 
                          That's your personal best. Try to replicate this momentum with other goals!
                        </p>
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-slate-900">Financial Insights</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-blue-600 mb-1">Average Goal Target</p>
                          <p className="text-xl font-bold text-blue-900">{formatCurrency(analysis.avgTarget)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 mb-1">Avg Contributions/Goal</p>
                          <p className="text-xl font-bold text-blue-900">{Math.round(analysis.avgContributionsPerGoal)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 mt-3">
                        💰 {analysis.avgContributionsPerGoal > 10 
                          ? 'You make frequent small contributions - excellent habit for consistent progress!' 
                          : analysis.avgContributionsPerGoal < 5 
                          ? 'You prefer larger, less frequent contributions. Consider adding smaller regular contributions for momentum!' 
                          : 'Good contribution frequency! Keep maintaining this rhythm.'}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-bold text-slate-900">AI Recommendations</h3>
                      </div>
                      <div className="space-y-2">
                        {analysis.active > 5 && (
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <p className="text-sm text-slate-700">⚠️ You have {analysis.active} active goals. Consider focusing on 3-5 goals at a time for better results.</p>
                          </div>
                        )}
                        {analysis.successRate < 30 && analysis.completed > 0 && (
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <p className="text-sm text-slate-700">📊 Your success rate is {Math.round(analysis.successRate)}%. Try setting smaller, more achievable milestones!</p>
                          </div>
                        )}
                        {analysis.successRate > 70 && (
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <p className="text-sm text-slate-700">🌟 Excellent {Math.round(analysis.successRate)}% success rate! You're crushing your goals. Consider setting more ambitious targets!</p>
                          </div>
                        )}
                        {analysis.avgCompletionTime > 365 && (
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <p className="text-sm text-slate-700">⏰ Your goals take an average of {Math.round(analysis.avgCompletionTime)} days. Try breaking them into smaller 3-6 month goals!</p>
                          </div>
                        )}
                        {!analysis.categoryCount['Emergency Fund'] && (
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <p className="text-sm text-slate-700">🛡️ Consider adding an Emergency Fund goal - it's the foundation of financial security!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
