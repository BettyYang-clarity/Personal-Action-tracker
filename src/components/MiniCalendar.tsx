import React, { useState } from 'react';
import { ActionItem } from '../types';
import { getTodayDateString } from '../lib/dateUtils';
import { downloadCalendarIcs } from '../lib/api';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar as CalendarIcon,
  Flame,
  Mail,
  Clock,
  User,
  MapPin,
} from 'lucide-react';

interface MiniCalendarProps {
  actions: ActionItem[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onDraftNudge: (action: ActionItem) => void;
  onQuickUpdate: (action: ActionItem) => void;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  actions,
  selectedDate,
  onSelectDate,
  onDraftNudge,
  onQuickUpdate,
}) => {
  const todayStr = getTodayDateString();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    onSelectDate(todayStr);
  };

  // Maps for quick lookup
  const dueMap = new Map<string, ActionItem[]>();
  const followMap = new Map<string, ActionItem[]>();

  for (const a of actions) {
    if (a.status === 'Done') continue;
    if (a.due_date) {
      const arr = dueMap.get(a.due_date) || [];
      arr.push(a);
      dueMap.set(a.due_date, arr);
    }
    if (a.next_follow_up) {
      const arr = followMap.get(a.next_follow_up) || [];
      arr.push(a);
      followMap.set(a.next_follow_up, arr);
    }
  }

  // Generate 42 calendar cells
  const cells: Array<{
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    hasDue: boolean;
    hasFollow: boolean;
  }> = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, day);
    const m = String(prevDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dStr = `${prevDate.getFullYear()}-${m}-${d}`;
    cells.push({
      dateStr: dStr,
      dayNum: day,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
      hasDue: (dueMap.get(dStr) || []).length > 0,
      hasFollow: (followMap.get(dStr) || []).length > 0,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dStr = `${year}-${m}-${d}`;
    cells.push({
      dateStr: dStr,
      dayNum: day,
      isCurrentMonth: true,
      isToday: dStr === todayStr,
      hasDue: (dueMap.get(dStr) || []).length > 0,
      hasFollow: (followMap.get(dStr) || []).length > 0,
    });
  }

  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day++) {
    const nextDate = new Date(year, month + 1, day);
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dStr = `${nextDate.getFullYear()}-${m}-${d}`;
    cells.push({
      dateStr: dStr,
      dayNum: day,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
      hasDue: (dueMap.get(dStr) || []).length > 0,
      hasFollow: (followMap.get(dStr) || []).length > 0,
    });
  }

  const dayDueItems = dueMap.get(selectedDate) || [];
  const dayFollowItems = followMap.get(selectedDate) || [];
  const hasAgenda = dayDueItems.length > 0 || dayFollowItems.length > 0;

  return (
    <div className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-xs space-y-4">
      {/* Month Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-bold text-stone-900 tracking-wider">
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={goToToday}
            className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold transition-colors border border-stone-200"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="p-1 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="p-1 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const isSelected = cell.dateStr === selectedDate;
          return (
            <button
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`h-7 rounded-md text-xs flex flex-col items-center justify-center relative transition-colors ${
                isSelected
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : cell.isToday
                  ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                  : cell.isCurrentMonth
                  ? 'text-stone-700 hover:bg-amber-50 hover:text-amber-900'
                  : 'text-stone-300 opacity-60 hover:opacity-100'
              }`}
            >
              <span>{cell.dayNum}</span>
              {/* Dual date marker dots */}
              <div className="flex items-center gap-0.5 mt-[-2px]">
                {cell.hasDue && <span className="w-1 h-1 rounded-full bg-rose-500" />}
                {cell.hasFollow && <span className="w-1 h-1 rounded-full bg-sky-500" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-stone-500 pt-1 border-t border-stone-100">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>🔴 Due Date</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span>🔵 Follow-up</span>
        </div>
      </div>

      {/* Selected Day Agenda */}
      <div className="pt-2 border-t border-stone-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-stone-800">
            {selectedDate === todayStr ? 'Today’s Schedule' : `Date: ${selectedDate}`}
          </span>
          <span className="text-[10px] font-mono text-stone-500">
            {dayDueItems.length + dayFollowItems.length} action{dayDueItems.length + dayFollowItems.length === 1 ? '' : 's'}
          </span>
        </div>

        {!hasAgenda ? (
          <div className="text-[11px] text-stone-400 py-3 text-center bg-stone-50 rounded-lg border border-stone-200/60">
            No deadlines or check-ins on this date.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {/* Due Items */}
            {dayDueItems.map((item) => (
              <div
                key={`due-${item.id}`}
                className="p-2.5 rounded-lg bg-stone-50 border border-rose-200 text-xs space-y-1 shadow-xs"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>[DUE] {item.title}</span>
                  </span>
                  {item.priority === 'P1' && (
                    <Flame className="w-3 h-3 text-rose-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-stone-500">
                  <span>{item.site} · {item.owner}</span>
                  <button
                    onClick={() => onDraftNudge(item)}
                    className="text-rose-700 hover:text-rose-900 font-semibold underline"
                  >
                    Nudge
                  </button>
                </div>
              </div>
            ))}

            {/* Follow-up Items */}
            {dayFollowItems.map((item) => (
              <div
                key={`chase-${item.id}`}
                className="p-2.5 rounded-lg bg-stone-50 border border-sky-200 text-xs space-y-1 shadow-xs"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-sky-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                    <span>[CHASE] {item.owner}</span>
                  </span>
                  <span className="text-[9px] font-mono text-stone-500">Due {item.due_date}</span>
                </div>
                <div className="text-[11px] text-stone-700 line-clamp-1">{item.title}</div>
                <div className="flex items-center justify-between text-[10px] text-stone-500 pt-0.5">
                  <span>{item.site}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDraftNudge(item)}
                      className="text-sky-700 hover:text-sky-900 font-semibold underline"
                    >
                      Draft Ping
                    </button>
                    <button
                      onClick={() => onQuickUpdate(item)}
                      className="text-stone-600 hover:text-stone-900 underline"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export .ics Button */}
      <button
        onClick={downloadCalendarIcs}
        className="w-full py-2 px-3 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Download className="w-3.5 h-3.5 text-stone-500" />
        <span>Download Calendar (.ics)</span>
      </button>
    </div>
  );
};
