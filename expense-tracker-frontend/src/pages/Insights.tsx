import { useEffect, useState } from 'react';
import { Lightbulb, TrendingUp, Target, Wallet, PieChart, Brain, Sparkles } from 'lucide-react';
import { insightService } from '../services/insightService';
import { getCurrentMonthYear, getMonthName } from '../utils/formatters';
import type { AIInsight, MonthlyStory } from '../types';

export default function Insights() {
  const { month, year } = getCurrentMonthYear();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [story, setStory] = useState<MonthlyStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<AIInsight['type'] | 'all'>('all');

  useEffect(() => {
    loadInsights();
  }, [month, year]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const [insightsData, storyData] = await Promise.all([
        insightService.getMonthlyInsights(month, year),
        insightService.getMonthlyStory(month, year).catch(() => null),
      ]);
      setInsights(insightsData);
      setStory(storyData);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const newInsights = await insightService.generateInsights(month, year);
      setInsights(newInsights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInsights = selectedType === 'all' 
    ? insights 
    : insights.filter(i => i.type === selectedType);

  const insightTypes = [
    { value: 'all', label: 'All Insights', icon: <Brain className="w-4 h-4" /> },
    { value: 'spending_pattern', label: 'Spending Patterns', icon: <Wallet className="w-4 h-4" /> },
    { value: 'budget_discipline', label: 'Budget Discipline', icon: <PieChart className="w-4 h-4" /> },
    { value: 'savings_mindset', label: 'Savings Mindset', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'goal_alignment', label: 'Goal Alignment', icon: <Target className="w-4 h-4" /> },
    { value: 'behavioral_projection', label: 'Projections', icon: <Sparkles className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">AI Insights</h1>
            <p className="text-slate-600 mt-2">
              Understanding your financial behavior • {getMonthName(month)} {year}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Generate Insights
          </button>
        </div>

        {/* Monthly Story */}
        {story && (
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{story.title}</h2>
                <p className="text-indigo-100 text-sm">{getMonthName(story.month)} {story.year}</p>
              </div>
            </div>
            
            <p className="text-lg leading-relaxed mb-6 text-white/90">
              {story.narrative}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-indigo-100 text-sm mb-1">Total Spent</p>
                <p className="text-2xl font-bold">₹{story.keyMetrics.totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-indigo-100 text-sm mb-1">Total Earned</p>
                <p className="text-2xl font-bold">₹{story.keyMetrics.totalEarned.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-indigo-100 text-sm mb-1">Savings Rate</p>
                <p className="text-2xl font-bold">{story.keyMetrics.savingsRate.toFixed(1)}%</p>
              </div>
            </div>

            {story.highlights.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-indigo-100 uppercase tracking-wide">Highlights</p>
                <div className="flex flex-wrap gap-2">
                  {story.highlights.map((highlight, i) => (
                    <span key={i} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
          <div className="flex flex-wrap gap-2">
            {insightTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === type.value
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type.icon}
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Insights List */}
        {filteredInsights.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No insights available yet</p>
            <p className="text-slate-500 text-sm mt-2">
              Generate insights to understand your financial behavior
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInsights.map((insight) => (
              <InsightCard key={insight.insightId} insight={insight} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const severityConfig = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-500' },
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-500' },
    neutral: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: 'text-slate-500' },
  };

  const config = severityConfig[insight.severity];

  const typeIcons = {
    spending_pattern: <Wallet className="w-5 h-5" />,
    budget_discipline: <PieChart className="w-5 h-5" />,
    savings_mindset: <TrendingUp className="w-5 h-5" />,
    goal_alignment: <Target className="w-5 h-5" />,
    portfolio_risk: <PieChart className="w-5 h-5" />,
    behavioral_projection: <Sparkles className="w-5 h-5" />,
    monthly_story: <Lightbulb className="w-5 h-5" />,
  };

  return (
    <div className={`${config.bg} border ${config.border} rounded-xl p-6 hover:shadow-md transition-all`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 ${config.bg} border ${config.border} rounded-xl flex items-center justify-center flex-shrink-0 ${config.icon}`}>
          {typeIcons[insight.type]}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{insight.title}</h3>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {insight.type.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          <p className="text-slate-700 leading-relaxed mb-4">
            {insight.narrative}
          </p>

          {insight.suggestions && insight.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Suggestions:</p>
              <ul className="space-y-1">
                {insight.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insight.category && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <span className="text-xs text-slate-500">Related to: </span>
              <span className="text-xs font-medium text-slate-700">{insight.category}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
