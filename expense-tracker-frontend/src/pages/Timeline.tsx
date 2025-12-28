import { useEffect, useState } from 'react';
import { Calendar, Search, Filter, Plus, Tag, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { timelineService } from '../services/timelineService';
import { getCurrentMonthYear, formatCurrency, formatDate, getMonthName } from '../utils/formatters';
import type { DayGroup, TimelineFilter, MonthChapter } from '../types';

export default function Timeline() {
  const { month, year } = getCurrentMonthYear();
  const [timeline, setTimeline] = useState<DayGroup[]>([]);
  const [chapter, setChapter] = useState<MonthChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimelineFilter>({ month, year });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTimeline();
  }, [filter]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const [timelineData, chapterData] = await Promise.all([
        timelineService.getTimeline(filter),
        timelineService.getMonthChapter(filter.month || month, filter.year || year),
      ]);
      setTimeline(timelineData);
      setChapter(chapterData);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadTimeline();
      return;
    }
    try {
      const results = await timelineService.searchTimeline(searchQuery, filter);
      // Group results by date
      const grouped = results.reduce((acc, entry) => {
        const dateKey = entry.date.split('T')[0];
        const existing = acc.find(g => g.date === dateKey);
        if (existing) {
          existing.entries.push(entry);
        } else {
          acc.push({
            date: dateKey,
            entries: [entry],
            totalExpense: entry.type === 'expense' ? entry.amount || 0 : 0,
            totalIncome: entry.type === 'income' ? entry.amount || 0 : 0,
            netFlow: (entry.type === 'income' ? entry.amount || 0 : 0) - (entry.type === 'expense' ? entry.amount || 0 : 0),
          });
        }
        return acc;
      }, [] as DayGroup[]);
      setTimeline(grouped);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Financial Timeline</h1>
            <p className="text-slate-600 mt-2">Your chronological financial diary</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
            <Plus className="w-5 h-5" />
            Add Note
          </button>
        </div>

        {/* Month Chapter Summary */}
        {chapter && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-8 h-8" />
              <h2 className="text-3xl font-bold">{chapter.monthName} {chapter.year}</h2>
            </div>
            <p className="text-blue-50 text-lg leading-relaxed mb-6">
              {chapter.insights[0] || 'Your financial journey continues...'}
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-blue-100 text-sm mb-1">Total Income</p>
                <p className="text-2xl font-bold">{formatCurrency(chapter.summary.totalIncome)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-blue-100 text-sm mb-1">Total Expenses</p>
                <p className="text-2xl font-bold">{formatCurrency(chapter.summary.totalExpenses)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-blue-100 text-sm mb-1">Savings</p>
                <p className="text-2xl font-bold">{formatCurrency(chapter.summary.totalSavings)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search transactions, notes, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {timeline.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">No entries found for this period</p>
              <p className="text-slate-500 text-sm mt-2">Start logging your financial activities</p>
            </div>
          ) : (
            timeline.map((dayGroup) => (
              <DayGroupCard key={dayGroup.date} dayGroup={dayGroup} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DayGroupCard({ dayGroup }: { dayGroup: DayGroup }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Day Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{formatDate(dayGroup.date)}</h3>
            <p className="text-sm text-slate-600">{dayGroup.entries.length} entries</p>
          </div>
          <div className="flex items-center gap-4">
            {dayGroup.totalIncome > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold">{formatCurrency(dayGroup.totalIncome)}</span>
              </div>
            )}
            {dayGroup.totalExpense > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <TrendingDown className="w-4 h-4" />
                <span className="font-semibold">{formatCurrency(dayGroup.totalExpense)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-slate-100">
        {dayGroup.entries.map((entry) => (
          <div key={entry.entryId} className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    entry.type === 'income' ? 'bg-green-100 text-green-700' :
                    entry.type === 'expense' ? 'bg-red-100 text-red-700' :
                    entry.type === 'investment' ? 'bg-blue-100 text-blue-700' :
                    entry.type === 'goal' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {entry.type}
                  </span>
                  {entry.category && (
                    <span className="text-sm text-slate-600">{entry.category}</span>
                  )}
                </div>
                <h4 className="text-base font-semibold text-slate-900 mb-1">{entry.title}</h4>
                <p className="text-sm text-slate-600">{entry.description}</p>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <div className="flex gap-2">
                      {entry.tags.map((tag, i) => (
                        <span key={i} className="text-xs text-slate-500">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {entry.amount && (
                <div className={`text-right ml-4 ${
                  entry.type === 'income' ? 'text-green-600' : 'text-slate-900'
                }`}>
                  <p className="text-xl font-bold">{formatCurrency(entry.amount)}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
