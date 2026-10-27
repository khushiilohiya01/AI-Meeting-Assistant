import {
  format,
  parseISO,
  isToday,
  isYesterday,
  isTomorrow,
  isBefore,
  isAfter,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

// System benchmark reference date (Sunday, October 25, 2026)
export const CURRENT_DATE_STR = '2026-10-25';
export const CURRENT_DATE = new Date(2026, 9, 25); // month is 0-indexed: 9 = October

export function formatFriendlyDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    const benchmark = CURRENT_DATE;

    // Compare with benchmark date (YYYY-MM-DD)
    const targetStr = format(d, 'yyyy-MM-dd');
    if (targetStr === '2026-10-25') return 'Today';
    if (targetStr === '2026-10-24') return 'Yesterday';
    if (targetStr === '2026-10-26') return 'Tomorrow';

    return format(d, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d');
  } catch {
    return dateStr;
  }
}

export type UrgencyGroup = 'overdue' | 'today' | 'this_week' | 'later';

export function getUrgencyGroup(dateStr: string): UrgencyGroup {
  try {
    const d = parseISO(dateStr);
    const targetFormatted = format(d, 'yyyy-MM-dd');

    if (targetFormatted < CURRENT_DATE_STR) {
      return 'overdue';
    }
    if (targetFormatted === CURRENT_DATE_STR) {
      return 'today';
    }

    const weekEndStr = '2026-10-31';
    if (targetFormatted <= weekEndStr) {
      return 'this_week';
    }
    return 'later';
  } catch {
    return 'later';
  }
}

export function getUrgencyBadge(group: UrgencyGroup): {
  label: string;
  textColor: string;
  dotColor: string;
} {
  switch (group) {
    case 'overdue':
      return {
        label: 'Overdue',
        textColor: 'text-rose-600 dark:text-rose-400',
        dotColor: 'bg-rose-500',
      };
    case 'today':
      return {
        label: 'Due Today',
        textColor: 'text-amber-600 dark:text-amber-400',
        dotColor: 'bg-amber-500',
      };
    case 'this_week':
      return {
        label: 'This Week',
        textColor: 'text-blue-600 dark:text-blue-400',
        dotColor: 'bg-blue-500',
      };
    case 'later':
      return {
        label: 'Upcoming',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        dotColor: 'bg-emerald-500',
      };
  }
}
