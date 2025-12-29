import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthName } from '../../utils/formatters';

interface PeriodNavigatorProps {
  month: number;
  year: number;
  onPeriodChange: (month: number, year: number) => void;
}

export function PeriodNavigator({ month, year, onPeriodChange }: PeriodNavigatorProps) {
  const handlePrevious = () => {
    if (month === 1) {
      onPeriodChange(12, year - 1);
    } else {
      onPeriodChange(month - 1, year);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onPeriodChange(1, year + 1);
    } else {
      onPeriodChange(month + 1, year);
    }
  };

  const handleToday = () => {
    const now = new Date();
    onPeriodChange(now.getMonth() + 1, now.getFullYear());
  };

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-2">
      <button
        onClick={handlePrevious}
        className="p-1 hover:bg-slate-100 rounded transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-5 h-5 text-slate-600" />
      </button>
      
      <div className="flex items-center gap-2 min-w-[180px] justify-center">
        <span className="text-lg font-semibold text-slate-900">
          {getMonthName(month)} {year}
        </span>
      </div>

      <button
        onClick={handleNext}
        className="p-1 hover:bg-slate-100 rounded transition-colors"
        aria-label="Next month"
      >
        <ChevronRight className="w-5 h-5 text-slate-600" />
      </button>

      <button
        onClick={handleToday}
        className="ml-2 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
      >
        Today
      </button>
    </div>
  );
}
