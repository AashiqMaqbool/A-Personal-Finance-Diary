import { useEffect, useState } from 'react';
import { Calendar, Search, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { timelineService } from '../services/timelineService';
import { getCurrentMonthYear, formatCurrency, formatDate } from '../utils/formatters';
import type { DayGroup, TimelineFilter, MonthChapter } from '../types';

export default function Timeline() {
  const { month, year } = getCurrentMonthYear();
  const [timeline, setTimeline] = useState<DayGroup[]>([]);
  const [chapter, setChapter] = useState<MonthChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimelineFilter>({ month, year });
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', description: '', tags: '' });
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'note'>('all');

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

  const handleAddNote = async () => {
    if (!noteForm.title.trim()) return;
    try {
      await timelineService.addNote({
        date: new Date().toISOString(),
        title: noteForm.title,
        description: noteForm.description,
        tags: noteForm.tags ? noteForm.tags.split(',').map(t => t.trim()) : [],
      });
      setNoteForm({ title: '', description: '', tags: '' });
      setShowAddNote(false);
      loadTimeline();
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredTimeline = timeline
    .map(dayGroup => ({
      ...dayGroup,
      entries: filterType === 'all' ? dayGroup.entries : dayGroup.entries.filter(e => e.type === filterType)
    }))
    .filter(dayGroup => dayGroup.entries.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Financial Timeline</h1>
            <p className="text-slate-600 text-sm mt-1">Your chronological financial diary</p>
          </div>
          <button onClick={() => setShowAddNote(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
            <Plus className="w-4 h-4" />
            Add Note
          </button>
        </div>

        {/* Month Summary */}
        {chapter && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <h2 className="text-xl font-bold">{chapter.monthName} {chapter.year}</h2>
              </div>
              <p className="text-xs text-blue-100">{timeline.reduce((sum, d) => sum + d.entries.length, 0)} entries</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-blue-100 text-xs mb-1">Income</p>
                <p className="text-lg font-bold">{formatCurrency(chapter.summary.totalIncome)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-blue-100 text-xs mb-1">Expenses</p>
                <p className="text-lg font-bold">{formatCurrency(chapter.summary.totalExpenses)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-blue-100 text-xs mb-1">Savings</p>
                <p className="text-lg font-bold">{formatCurrency(chapter.summary.totalSavings)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-blue-100 text-xs mb-1">Savings Rate</p>
                <p className="text-lg font-bold">{chapter.summary.totalIncome > 0 ? ((chapter.summary.totalSavings / chapter.summary.totalIncome) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="note">Notes</option>
            </select>
            <select
              value={filter.month || month}
              onChange={(e) => setFilter({ ...filter, month: Number(e.target.value) })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleString('default', { month: 'short' })}
                </option>
              ))}
            </select>
            <select
              value={filter.year || year}
              onChange={(e) => setFilter({ ...filter, year: Number(e.target.value) })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={2024 + i} value={2024 + i}>{2024 + i}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {filteredTimeline.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">No entries found</p>
              <p className="text-slate-500 text-sm mt-2">Start logging your financial activities</p>
            </div>
          ) : (
            filteredTimeline.map((dayGroup) => (
              <DayGroupCard key={dayGroup.date} dayGroup={dayGroup} />
            ))
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Add Note</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Note title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={noteForm.description}
                  onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Note description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={noteForm.tags}
                  onChange={(e) => setNoteForm({ ...noteForm, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="personal, important"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowAddNote(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DayGroupCard({ dayGroup }: { dayGroup: DayGroup }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{formatDate(dayGroup.date)}</h3>
          <p className="text-xs text-slate-500">{dayGroup.entries.length} entries</p>
        </div>
        <div className="flex items-center gap-3">
          {dayGroup.totalIncome > 0 && (
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">{formatCurrency(dayGroup.totalIncome)}</span>
            </div>
          )}
          {dayGroup.totalExpense > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-semibold">{formatCurrency(dayGroup.totalExpense)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-1/6" />
            <col className="w-1/6" />
            <col className="w-1/2" />
            <col className="w-1/6" />
          </colgroup>
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left py-2 px-4 text-xs font-semibold text-slate-600 uppercase">Type</th>
              <th className="text-left py-2 px-4 text-xs font-semibold text-slate-600 uppercase">Category</th>
              <th className="text-left py-2 px-4 text-xs font-semibold text-slate-600 uppercase">Description</th>
              <th className="text-right py-2 px-4 text-xs font-semibold text-slate-600 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {dayGroup.entries.map((entry) => (
              <tr key={entry.entryId} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-2 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap inline-block ${
                    entry.type === 'income' ? 'bg-green-100 text-green-700' :
                    entry.type === 'expense' ? 'bg-red-100 text-red-700' :
                    entry.type === 'investment' ? 'bg-blue-100 text-blue-700' :
                    entry.type === 'goal' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {entry.type}
                  </span>
                </td>
                <td className="py-2 px-4 text-sm text-slate-600 truncate">{entry.category || '-'}</td>
                <td className="py-2 px-4">
                  <p className="text-sm font-semibold text-slate-900 truncate">{entry.title}</p>
                  <p className="text-xs text-slate-500 truncate">{entry.description}</p>
                </td>
                <td className="py-2 px-4 text-right">
                  {entry.amount && (
                    <span className={`text-sm font-bold whitespace-nowrap ${entry.type === 'income' ? 'text-green-600' : 'text-slate-900'}`}>
                      {formatCurrency(entry.amount)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
