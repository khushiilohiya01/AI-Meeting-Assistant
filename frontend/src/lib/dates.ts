import { format, parseISO } from 'date-fns';

export function formatFriendlyDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

    const targetStr = format(d, 'yyyy-MM-dd');
    if (targetStr === todayStr) return 'Today';
    if (targetStr === yesterdayStr) return 'Yesterday';
    if (targetStr === tomorrowStr) return 'Tomorrow';

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

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    if (targetFormatted < todayStr) {
      return 'overdue';
    }
    if (targetFormatted === todayStr) {
      return 'today';
    }

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    const weekEndStr = format(endOfWeek, 'yyyy-MM-dd');

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
