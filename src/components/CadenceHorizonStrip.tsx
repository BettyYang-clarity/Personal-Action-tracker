import React from 'react';
import { ActionItem } from '../types';
import { getTodayDateString } from '../lib/dateUtils';
import { Calendar, ChevronRight } from 'lucide-react';

interface CadenceHorizonStripProps {
  actions: ActionItem[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onClearDateFilter: () => void;
}

export const CadenceHorizonStrip: React.FC<CadenceHorizonStripProps> = ({
  actions,
  selectedDate,
  onSelectDate,
  onClearDateFilter,
}) => {
  const todayStr = getTodayDateString();

  // Generate 7 consecutive days starting today
  const days: Array<{
    dateStr: string;
    dayName: string;
    monthDay: string;
    isToday: boolean;
    dueCount: number;
    chaseCount: number;
  }> = [];

  const dueMap = new Map<string, number>();
  const chaseMap = new Map<string, number>();

  for (const a of actions) {
    if (a.status === 'Done') continue;
    if (a.due_date) {
      dueMap.set(a.due_date, (dueMap.get(a.due_date) || 0) + 1);
    }
    if (a.next_follow_up) {
      chaseMap.set(a.next_follow_up, (chaseMap.get(a.next_follow_up) || 0) + 1);
    }
  }

  const base = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dStr = `${year}-${month}-${day}`;

    const dayName = i === 0 ? 'TODAY' : d.toLocaleDateString(undefined, { weekday: 'short' });
    const monthDay = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    days.push({
      dateStr: dStr,
      dayName,
      monthDay,
      isToday: i === 0,
      dueCount: dueMap.get(dStr) || 0,
      chaseCount: chaseMap.get(dStr) || 0,
    });
  }

  const isFilteringByDate = selectedDate !== '';

  return (
    <div className="bg-white border border-stone-200/90 rounded-xl p-3 shadow-xs space-y-2">
      {/* Ribbon Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-bold text-stone-800 tracking-tight">7-Day Cadence Horizon</span>
          <span className="text-[11px] text-stone-500 hidden sm:inline">
            (Click any day to filter your chase list)
          </span>
        </div>

        {isFilteringByDate && selectedDate !== todayStr && (
          <button
            onClick={onClearDateFilter}
            className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold underline"
          >
            Clear Date Filter
          </button>
        )}
      </div>

      {/* Horizontal 7-Day Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
        {days.map((day) => {
          const isSelected = selectedDate === day.dateStr;
          const hasActivity = day.dueCount > 0 || day.chaseCount > 0;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => onSelectDate(isSelected ? '' : day.dateStr)}
              className={`p-2 rounded-lg text-left transition-all border flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : day.isToday
                  ? 'bg-amber-50/60 border-amber-300 hover:bg-amber-100/60'
                  : 'bg-stone-50/80 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
              }`}
            >
              {/* Day Name & Date */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold tracking-wider ${
                    isSelected
                      ? 'text-white'
                      : day.isToday
                      ? 'text-amber-700'
                      : 'text-stone-600'
                  }`}
                >
                  {day.dayName}
                </span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-amber-100' : 'text-stone-400'}`}>
                  {day.monthDay}
                </span>
              </div>

              {/* Badges for Due & Chase */}
              <div className="mt-2 flex flex-wrap items-center gap-1 min-h-[20px]">
                {day.chaseCount > 0 && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded flex items-center gap-1 ${
                      isSelected
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-sky-50 text-sky-800 border border-sky-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-sky-500'}`} />
                    <span>{day.chaseCount} Chase</span>
                  </span>
                )}

                {day.dueCount > 0 && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded flex items-center gap-1 ${
                      isSelected
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`} />
                    <span>{day.dueCount} Due</span>
                  </span>
                )}

                {!hasActivity && (
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-amber-100' : 'text-stone-400'}`}>
                    Clear
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
