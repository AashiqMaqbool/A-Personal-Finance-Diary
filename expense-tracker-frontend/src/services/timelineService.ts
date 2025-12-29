import { TimelineEntry, DayGroup, MonthChapter, TimelineFilter, Expense } from '../types';
import { getUserData, setUserData } from '../utils/userStorage';

const STORAGE_KEY = 'timeline_data';

const loadFromStorage = (): TimelineEntry[] => {
  return getUserData<TimelineEntry[]>(STORAGE_KEY, []);
};

const saveToStorage = (entries: TimelineEntry[]) => {
  setUserData(STORAGE_KEY, entries);
};

const aggregateAllData = (): TimelineEntry[] => {
  const notes = loadFromStorage();
  const expenses = getUserData<Expense[]>('expense_tracker_expenses', []);
  const salaries = getUserData<any[]>('salary_tracker_data', []);
  const incomes = getUserData<any[]>('income_tracker_data', []);
  
  const expenseEntries: TimelineEntry[] = expenses.map(e => ({
    entryId: e.expenseId,
    type: 'expense' as const,
    date: e.date,
    title: e.category,
    description: e.description,
    amount: e.amount,
    category: e.category,
    year: e.year,
    month: e.month,
    day: e.day,
  }));
  
  const salaryEntries: TimelineEntry[] = salaries.map(s => ({
    entryId: s.id,
    type: 'income' as const,
    date: `${s.year}-${String(s.month).padStart(2, '0')}-01T00:00:00Z`,
    title: 'Salary',
    description: `${s.company} - ${s.month}/${s.year}`,
    amount: s.netSalary,
    category: 'Salary',
    year: s.year,
    month: s.month,
    day: 1,
  }));
  
  const incomeEntries: TimelineEntry[] = incomes.map(i => ({
    entryId: i.incomeId,
    type: 'income' as const,
    date: i.date,
    title: i.category,
    description: `${i.source} - ${i.description}`,
    amount: i.amount,
    category: i.category,
    year: i.year,
    month: i.month,
    day: i.day,
  }));
  
  return [...notes, ...expenseEntries, ...salaryEntries, ...incomeEntries];
};

const groupByDay = (entries: TimelineEntry[]): DayGroup[] => {
  const grouped = entries.reduce((acc, entry) => {
    const date = new Date(entry.date).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimelineEntry[]>);

  return Object.entries(grouped)
    .map(([date, entries]) => {
      const totalIncome = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalExpense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + (e.amount || 0), 0);
      return {
        date,
        entries: entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        totalExpense,
        totalIncome,
        netFlow: totalIncome - totalExpense,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const timelineService = {
  async getTimeline(filter: TimelineFilter): Promise<DayGroup[]> {
    const entries = aggregateAllData();
    let filtered = entries;

    if (filter.month && filter.year) {
      filtered = filtered.filter(e => {
        const date = new Date(e.date);
        return date.getMonth() + 1 === filter.month && date.getFullYear() === filter.year;
      });
    }

    if (filter.type) {
      filtered = filtered.filter(e => e.type === filter.type);
    }

    if (filter.category) {
      filtered = filtered.filter(e => e.category === filter.category);
    }

    return groupByDay(filtered);
  },

  async getMonthChapter(month: number, year: number): Promise<MonthChapter> {
    const entries = aggregateAllData().filter(e => {
      const date = new Date(e.date);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });

    const totalIncome = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalExpense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalSavings = totalIncome - totalExpense;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return {
      month,
      year,
      monthName: monthNames[month - 1],
      summary: {
        totalIncome,
        totalExpenses: totalExpense,
        totalSavings,
        savingsRate: totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0,
        budgetAdherence: 0,
        topCategory: 'General',
        expenseCount: entries.filter(e => e.type === 'expense').length,
        incomeCount: entries.filter(e => e.type === 'income').length,
      },
      insights: [
        entries.length === 0 ? 'No financial activity recorded this month.' : `You had ${entries.length} financial activities this month.`,
      ],
      topExpenses: [],
      topCategories: [],
    };
  },

  async addNote(note: { date: string; title: string; description: string; tags?: string[] }): Promise<TimelineEntry> {
    const entries = loadFromStorage();
    const noteDate = new Date(note.date);
    const newEntry: TimelineEntry = {
      entryId: `note-${Date.now()}`,
      type: 'note',
      date: note.date,
      title: note.title,
      description: note.description,
      tags: note.tags,
      year: noteDate.getFullYear(),
      month: noteDate.getMonth() + 1,
      day: noteDate.getDate(),
    };
    entries.push(newEntry);
    saveToStorage(entries);
    return newEntry;
  },

  async searchTimeline(query: string, filter?: TimelineFilter): Promise<TimelineEntry[]> {
    const entries = aggregateAllData();
    return entries.filter(e => {
      const matchesQuery = e.title?.toLowerCase().includes(query.toLowerCase()) ||
                          e.description?.toLowerCase().includes(query.toLowerCase());
      if (!matchesQuery) return false;

      if (filter?.type && e.type !== filter.type) return false;
      if (filter?.category && e.category !== filter.category) return false;
      if (filter?.month && filter?.year) {
        const date = new Date(e.date);
        if (date.getMonth() + 1 !== filter.month || date.getFullYear() !== filter.year) return false;
      }

      return true;
    });
  },
};
