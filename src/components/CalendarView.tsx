import React, { useState } from 'react';
import { ActionItem } from '../types';
import { getTodayDateString } from '../lib/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar as CalendarIcon,
  Flame,
  User,
  MapPin,
  Clock,
  Mail,
  Zap,
} from 'lucide-react';

interface CalendarViewProps {
  actions: ActionItem[];
  onDraftNudge: (action: ActionItem) => void;
  onQuickUpdate: (action: ActionItem) => void;
  onExportIcs: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  actions,
  onDraftNudge,
  onQuickUpdate,
  onExportIcs,
}) => {
  const todayStr = getTodayDateString();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar math
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(todayStr);
  };

  // Group actions by due_date and next_follow_up
  const dueMap = new Map<string, ActionItem[]>();
  const followMap = new Map<string, ActionItem[]>();

  for (const action of actions) {
    if (action.status === 'Done') continue;

    if (action.due_date) {
      const arr = dueMap.get(action.due_date) || [];
      arr.push(action);
      dueMap.set(action.due_date, arr);
    }

    if (action.next_follow_up) {
      const arr = followMap.get(action.next_follow_up) || [];
      arr.push(action);
      followMap.set(action.next_follow_up, arr);
    }
  }

  // Generate grid days (42 cells: 6 rows of 7)
  const calendarCells: Array<{
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    dueItems: ActionItem[];
    followItems: ActionItem[];
  }> = [];

  // 1. Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, day);
    const m = String(prevDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dStr = `${prevDate.getFullYear()}-${m}-${d}`;
    calendarCells.push({
      dateStr: dStr,
      dayNum: day,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
      dueItems: dueMap.get(dStr) || [],
      followItems: followMap.get(dStr) || [],
    });
  }

  // 2. Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dStr = `${year}-${m}-${d}`;
    calendarCells.push({
      dateStr: dStr,
      dayNum: day,
      isCurrentMonth: true,
      isToday: dStr === todayStr,
      dueItems: dueMap.get(dStr) || [],
      followItems: followMap.get(dStr) || [],
    });
  }

  // 3. Next month leading days
  const remaining = 42 - calendarCells.length;
  for (let day = 1; day <= remaining; day++) {
    const nextDate = new Date(year, month + 1, day);
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dStr = `${nextDate.getFullYear()}-${m}-${d}`;
    calendarCells.push({
      dateStr: dStr,
      dayNum: day,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
      dueItems: dueMap.get(dStr) || [],
      followItems: followMap.get(dStr) || [],
    });
  }

  const selectedDueItems = dueMap.get(selectedDateStr) || [];
  const selectedFollowItems = followMap.get(selectedDateStr) || [];
  const hasSelectedItems = selectedDueItems.length > 0 || selectedFollowItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Calendar Header Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-white tracking-tight">
            {monthNames[month]} {year}
          </h2>

          <button
            onClick={goToToday}
            className="text-xs px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-md transition-colors font-medium ml-2"
          >
            Today
          </button>
        </div>

        {/* Legend & Export Button */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-4 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
              <span className="text-slate-300 font-medium">🔴 Due Date (Deadline)</span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />
              <span className="text-slate-300 font-medium">🔵 Follow-Up (Chase)</span>
            </div>
          </div>

          <button
            onClick={onExportIcs}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm border border-sky-400/30 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .ics Feed</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Grid + Day Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Grid (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Weekday Names */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/80 text-center py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* 42 Day Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/60 bg-slate-900/40">
            {calendarCells.map((cell) => {
              const isSelected = cell.dateStr === selectedDateStr;
              const hasDue = cell.dueItems.length > 0;
              const hasFollow = cell.followItems.length > 0;

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[72px] sm:min-h-[88px] p-1.5 sm:p-2 text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 ring-2 ring-rose-500/50 z-10'
                      : cell.isToday
                      ? 'bg-slate-950/90'
                      : cell.isCurrentMonth
                      ? 'hover:bg-slate-800/50'
                      : 'bg-slate-950/40 opacity-40 hover:opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-medium rounded-full w-5 h-5 flex items-center justify-center ${
                        cell.isToday
                          ? 'bg-rose-600 text-white font-bold'
                          : isSelected
                          ? 'text-white font-bold'
                          : cell.isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Small dot summary for mobile */}
                    <div className="flex items-center gap-1 sm:hidden">
                      {hasDue && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                      {hasFollow && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                    </div>
                  </div>

                  {/* Desktop Item Indicators */}
                  <div className="hidden sm:flex flex-col gap-1 mt-1 w-full overflow-hidden">
                    {cell.dueItems.slice(0, 2).map((item) => (
                      <div
                        key={`due-${item.id}`}
                        className="truncate text-[10px] font-mono px-1 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/50 flex items-center gap-1"
                        title={`[DUE] ${item.title}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                    {cell.dueItems.length > 2 && (
                      <span className="text-[9px] text-rose-400 font-mono font-semibold pl-1">
                        +{cell.dueItems.length - 2} more due
                      </span>
                    )}

                    {cell.followItems.slice(0, 2).map((item) => (
                      <div
                        key={`follow-${item.id}`}
                        className="truncate text-[10px] font-mono px-1 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/50 flex items-center gap-1"
                        title={`[CHASE] ${item.owner}: ${item.title}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <span className="truncate">{item.owner}</span>
                      </div>
                    ))}
                    {cell.followItems.length > 2 && (
                      <span className="text-[9px] text-sky-400 font-mono font-semibold pl-1">
                        +{cell.followItems.length - 2} more chase
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Day Inspector Drawer (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono text-slate-500 tracking-wider">Day Schedule</span>
              {selectedDateStr === todayStr && (
                <span className="text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                  TODAY
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {new Date(selectedDateStr + 'T12:00:00Z').toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
          </div>

          {!hasSelectedItems ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs">
              <CalendarIcon className="w-8 h-8 text-slate-700 mb-2 stroke-[1.5]" />
              <p className="font-medium text-slate-400">No deadlines or follow-ups scheduled for this date.</p>
              <p className="mt-1 text-[11px]">Select another calendar day to view scheduled audit deadlines or site chase items.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Compliance Deadlines Due */}
              {selectedDueItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
                    <span>Hard Due Dates ({selectedDueItems.length})</span>
                  </div>
                  {selectedDueItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-slate-950/80 border border-rose-900/40 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-slate-200 leading-snug">{item.title}</h4>
                        {item.priority === 'P1' && (
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700/60 flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5 text-rose-500" />
                            P1
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{item.site}</span>
                        <span>·</span>
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{item.owner}</span>
                      </div>
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => onDraftNudge(item)}
                          className="px-2.5 py-1 text-[11px] font-medium text-rose-200 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 rounded flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Draft Nudge</span>
                        </button>
                        <button
                          onClick={() => onQuickUpdate(item)}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Update</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Personal Follow-Up / Chase Items */}
              {selectedFollowItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                    <span className="w-2 h-2 rounded-full bg-sky-400 shadow-sm" />
                    <span>Follow-Up Check-ins ({selectedFollowItems.length})</span>
                  </div>
                  {selectedFollowItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-slate-950/80 border border-sky-900/40 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-slate-200 leading-snug">{item.title}</h4>
                        <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700/60">
                          Due: {item.due_date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <User className="w-3 h-3 text-sky-400" />
                        <span className="text-slate-300 font-medium">Chase {item.owner}</span>
                        <span>·</span>
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{item.site}</span>
                      </div>
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => onDraftNudge(item)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-sky-200 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 rounded flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3 text-sky-400" />
                          <span>Send Nudge</span>
                        </button>
                        <button
                          onClick={() => onQuickUpdate(item)}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Log Call/Note</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
