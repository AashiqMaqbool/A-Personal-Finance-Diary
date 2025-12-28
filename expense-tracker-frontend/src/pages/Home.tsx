import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Wallet, Target, PieChart, 
  Lightbulb, Heart, Calendar, ArrowRight 
} from 'lucide-react';
import { getCurrentMonthYear, formatCurrency, formatPercentage, getMonthName } from '../utils/formatters';
import { insightService } from '../services/insightService';
import { analyticsService } from '../services/analyticsService';
import { goalService } from '../services/goalService';
import { investmentService } from '../services/investmentService';
import type { MonthlyStory, Analytics, Goal, FinancialHealthScore } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const { month, year } = getCurrentMonthYear();
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<MonthlyStory | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [month, year]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [storyData, analyticsData, goalsData, portfolioData] = await Promise.all([
        insightService.getMonthlyStory(month, year).catch(() => null),
        analyticsService.getAnalytics(month, year),
        goalService.getGoals().catch(() => []),
        investmentService.getPortfolioSummary().catch(() => ({ totalValue: 0 })),
      ]);

      setStory(storyData);
      setAnalytics(analyticsData);
      setGoals(goalsData.filter(g => g.status === 'active'));
      setPortfolioValue(portfolioData.totalValue || 0);

      // Calculate health score
      if (analyticsData) {
        const score: FinancialHealthScore = {
          overall: 75,
          budgetDiscipline: analyticsData.summary.totalBudget > 0 
            ? Math.min(100, (1 - analyticsData.summary.totalExpenses / analyticsData.summary.totalBudget) * 100)
            : 0,
          savingsRate: analyticsData.summary.savingsRate,
          goalProgress: goalsData.length > 0 
            ? goalsData.reduce((acc, g) => acc + g.progress, 0) / goalsData.length 
            : 0,
          portfolioDiversification: 70,
          debtManagement: 80,
          month,
          year,
        };
        score.overall = (score.budgetDiscipline + score.savingsRate + score.goalProgress + 
                        score.portfolioDiversification + score.debtManagement) / 5;
        setHealthScore(score);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
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
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Your Financial Diary</h1>
            <p className="text-slate-600 mt-2">
              {getMonthName(month)} {year} • A reflection of your financial journey
            </p>
          </div>
          <button
            onClick={() => navigate('/timeline')}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            View Timeline
          </button>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Monthly Story Widget */}
          <WidgetCard
            title="This Month's Financial Story"
            icon={<Calendar className="w-6 h-6" />}
            onClick={() => navigate('/timeline')}
            className="md:col-span-2 lg:col-span-3"
          >
            {story ? (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-slate-900">{story.title}</h3>
                <p className="text-slate-600 leading-relaxed">{story.narrative}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {story.highlights.slice(0, 3).map((highlight, i) => (
                    <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">Your financial story is being written...</p>
            )}
          </WidgetCard>

          {/* Expense Snapshot */}
          <WidgetCard
            title="Expense Snapshot"
            icon={<Wallet className="w-6 h-6" />}
            onClick={() => navigate('/expenses')}
          >
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(analytics?.summary.totalExpenses || 0)}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {analytics?.summary.expenseCount || 0} transactions
                </p>
              </div>
              {analytics && analytics.topCategories.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Top Category</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {analytics.topCategories[0].category}
                    </span>
                    <span className="text-sm text-slate-900 font-semibold">
                      {formatCurrency(analytics.topCategories[0].amount)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </WidgetCard>

          {/* Budget Pulse */}
          <WidgetCard
            title="Budget Pulse"
            icon={<PieChart className="w-6 h-6" />}
            onClick={() => navigate('/budget')}
          >
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {analytics?.summary.totalBudget 
                    ? formatPercentage((analytics.summary.totalExpenses / analytics.summary.totalBudget) * 100)
                    : '0%'}
                </p>
                <p className="text-sm text-slate-600 mt-1">Budget utilized</p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    analytics && analytics.summary.totalBudget > 0 &&
                    (analytics.summary.totalExpenses / analytics.summary.totalBudget) > 0.9
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      analytics && analytics.summary.totalBudget > 0
                        ? (analytics.summary.totalExpenses / analytics.summary.totalBudget) * 100
                        : 0
                    )}%`,
                  }}
                />
              </div>
              <p className="text-sm text-slate-600">
                {formatCurrency(
                  Math.max(0, (analytics?.summary.totalBudget || 0) - (analytics?.summary.totalExpenses || 0))
                )} remaining
              </p>
            </div>
          </WidgetCard>

          {/* Goal Momentum */}
          <WidgetCard
            title="Goal Momentum"
            icon={<Target className="w-6 h-6" />}
            onClick={() => navigate('/goals')}
          >
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-slate-900">{goals.length}</p>
                <p className="text-sm text-slate-600 mt-1">Active goals</p>
              </div>
              {goals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Next Milestone</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {goals[0].name}
                    </span>
                    <span className="text-sm text-slate-900 font-semibold">
                      {formatPercentage(goals[0].progress)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all"
                      style={{ width: `${goals[0].progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </WidgetCard>

          {/* Portfolio Snapshot */}
          <WidgetCard
            title="Portfolio Snapshot"
            icon={<TrendingUp className="w-6 h-6" />}
            onClick={() => navigate('/portfolio')}
          >
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(portfolioValue)}
                </p>
                <p className="text-sm text-slate-600 mt-1">Total portfolio value</p>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+5.2% this month</span>
              </div>
            </div>
          </WidgetCard>

          {/* Behavior Insight */}
          <WidgetCard
            title="Behavior Insight"
            icon={<Lightbulb className="w-6 h-6" />}
            onClick={() => navigate('/insights')}
          >
            <div className="space-y-3">
              <p className="text-sm text-slate-700 leading-relaxed">
                Your spending pattern shows consistency in essential categories. Weekend expenses are 30% higher than weekdays.
              </p>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                View all insights
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </WidgetCard>

          {/* Financial Health Score */}
          <WidgetCard
            title="Financial Health Score"
            icon={<Heart className="w-6 h-6" />}
            onClick={() => navigate('/analytics')}
            className="md:col-span-2"
          >
            {healthScore && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24">
                    <svg className="transform -rotate-90 w-24 h-24">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-slate-200"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthScore.overall / 100)}`}
                        className={`${
                          healthScore.overall >= 70
                            ? 'text-green-500'
                            : healthScore.overall >= 50
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        } transition-all duration-1000`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-900">
                        {Math.round(healthScore.overall)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <HealthMetric label="Budget Discipline" value={healthScore.budgetDiscipline} />
                    <HealthMetric label="Savings Rate" value={healthScore.savingsRate} />
                    <HealthMetric label="Goal Progress" value={healthScore.goalProgress} />
                  </div>
                </div>
              </div>
            )}
          </WidgetCard>
        </div>
      </div>
    </div>
  );
}

// Widget Card Component
function WidgetCard({
  title,
  icon,
  children,
  onClick,
  className = '',
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all cursor-pointer group ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h3>
        <div className="text-slate-400 group-hover:text-slate-600 transition-colors">{icon}</div>
      </div>
      {children}
    </div>
  );
}

// Health Metric Component
function HealthMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-20 bg-slate-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${
              value >= 70 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, value)}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-700 w-8 text-right">
          {Math.round(value)}
        </span>
      </div>
    </div>
  );
}
