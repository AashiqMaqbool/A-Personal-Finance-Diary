import { useEffect, useState } from 'react';
import { Target, Plus, TrendingUp, Calendar, DollarSign, CheckCircle, Circle } from 'lucide-react';
import { goalService } from '../services/goalService';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters';
import type { Goal } from '../types';

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('active');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await goalService.getGoals();
      setGoals(data);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGoals = goals.filter(g => filter === 'all' || g.status === filter);

  const stats = {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    totalTarget: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    totalSaved: goals.reduce((sum, g) => sum + g.currentAmount, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Financial Goals</h1>
            <p className="text-slate-600 mt-2">Track your progress and stay motivated</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
            <Plus className="w-5 h-5" />
            New Goal
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Goals"
            value={stats.total.toString()}
            icon={<Target className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Active"
            value={stats.active.toString()}
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Target Amount"
            value={formatCurrency(stats.totalTarget)}
            icon={<DollarSign className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            label="Saved So Far"
            value={formatCurrency(stats.totalSaved)}
            icon={<CheckCircle className="w-5 h-5" />}
            color="emerald"
          />
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex gap-2">
          {(['all', 'active', 'completed', 'paused'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Goals Grid */}
        {filteredGoals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No {filter !== 'all' && filter} goals found</p>
            <p className="text-slate-500 text-sm mt-2">Create your first financial goal to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal) => (
              <GoalCard key={goal.goalId} goal={goal} onUpdate={loadGoals} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }[color];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className={`w-10 h-10 rounded-lg ${colorClasses} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-600 mt-1">{label}</p>
    </div>
  );
}

function GoalCard({ goal, onUpdate }: { goal: Goal; onUpdate: () => void }) {
  const priorityColors = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    paused: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[goal.status]}`}>
              {goal.status}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[goal.priority]}`}>
              {goal.priority} priority
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
            {goal.name}
          </h3>
          <p className="text-sm text-slate-600 mt-1">{goal.type}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Progress</span>
          <span className="text-sm font-semibold text-slate-900">{formatPercentage(goal.progress)}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
            style={{ width: `${Math.min(100, goal.progress)}%` }}
          />
        </div>
      </div>

      {/* Amounts */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Current</span>
          <span className="text-sm font-semibold text-slate-900">{formatCurrency(goal.currentAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Target</span>
          <span className="text-sm font-semibold text-slate-900">{formatCurrency(goal.targetAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Remaining</span>
          <span className="text-sm font-semibold text-blue-600">
            {formatCurrency(goal.targetAmount - goal.currentAmount)}
          </span>
        </div>
      </div>

      {/* Target Date */}
      <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
        <Calendar className="w-4 h-4" />
        <span>Target: {formatDate(goal.targetDate)}</span>
      </div>

      {/* Milestones */}
      {goal.milestones && goal.milestones.length > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Milestones</p>
          <div className="space-y-2">
            {goal.milestones.slice(0, 3).map((milestone) => (
              <div key={milestone.milestoneId} className="flex items-center gap-2">
                {milestone.isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300" />
                )}
                <span className={`text-sm ${milestone.isCompleted ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                  {milestone.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Contribution */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Monthly Contribution</span>
          <span className="text-sm font-semibold text-green-600">{formatCurrency(goal.monthlyContribution)}</span>
        </div>
      </div>
    </div>
  );
}
