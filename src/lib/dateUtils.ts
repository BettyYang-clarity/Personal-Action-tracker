import { ActionItem } from '../types';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0);
}

export function getDaysInactive(updatedAt: string): number {
  if (!updatedAt) return 0;
  // updatedAt can be ISO string or SQLite timestamp "YYYY-MM-DD HH:MM:SS"
  const normalized = updatedAt.includes('T') ? updatedAt : updatedAt.replace(' ', 'T') + 'Z';
  const updated = new Date(normalized);
  const now = new Date();
  const diffMs = now.getTime() - updated.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

export function isGhosted(action: ActionItem): boolean {
  if (action.status !== 'Waiting on Site') return false;
  return getDaysInactive(action.updated_at) >= 10;
}

export function getDueDateStatus(dueDateStr: string): {
  isOverdue: boolean;
  isToday: boolean;
  daysDiff: number;
  label: string;
} {
  const todayStr = getTodayDateString();
  const target = parseDate(dueDateStr);
  const today = parseDate(todayStr);

  const diffMs = target.getTime() - today.getTime();
  const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) {
    const overdueDays = Math.abs(daysDiff);
    return {
      isOverdue: true,
      isToday: false,
      daysDiff,
      label: overdueDays === 1 ? 'Overdue 1 day' : `Overdue ${overdueDays} days`,
    };
  } else if (daysDiff === 0) {
    return {
      isOverdue: false,
      isToday: true,
      daysDiff: 0,
      label: 'Due Today',
    };
  } else if (daysDiff === 1) {
    return {
      isOverdue: false,
      isToday: false,
      daysDiff: 1,
      label: 'Due Tomorrow',
    };
  } else {
    return {
      isOverdue: false,
      isToday: false,
      daysDiff,
      label: `Due in ${daysDiff} days`,
    };
  }
}

export function getFollowUpStatus(followUpDateStr: string): {
  isChaseToday: boolean;
  isOverdue: boolean;
  daysDiff: number;
  label: string;
} {
  const todayStr = getTodayDateString();
  const target = parseDate(followUpDateStr);
  const today = parseDate(todayStr);

  const diffMs = target.getTime() - today.getTime();
  const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) {
    const pastDays = Math.abs(daysDiff);
    return {
      isChaseToday: true,
      isOverdue: true,
      daysDiff,
      label: pastDays === 1 ? 'Chase (1d overdue)' : `Chase (${pastDays}d overdue)`,
    };
  } else if (daysDiff === 0) {
    return {
      isChaseToday: true,
      isOverdue: false,
      daysDiff: 0,
      label: 'Chase Today',
    };
  } else if (daysDiff === 1) {
    return {
      isChaseToday: false,
      isOverdue: false,
      daysDiff: 1,
      label: 'Chase Tomorrow',
    };
  } else {
    return {
      isChaseToday: false,
      isOverdue: false,
      daysDiff,
      label: `Chase in ${daysDiff} days`,
    };
  }
}

export function matchesFocusMode(action: ActionItem): boolean {
  if (action.status === 'Done') return false;
  // Focus Mode condition: priority == 'P1' OR next_follow_up <= CURRENT_DATE
  if (action.priority === 'P1') return true;

  const todayStr = getTodayDateString();
  return action.next_follow_up <= todayStr;
}
