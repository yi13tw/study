
import { format, startOfWeek, addDays } from 'date-fns';

export const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  bg: '#f8fafc'
};

export const getMondayOfCurrentWeek = () => {
  const today = new Date();
  // startOfWeek normally defaults to Sunday, so we use { weekStartsOn: 1 } for Monday
  return format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
};

export const POMODORO_WORK_TIME = 25 * 60; // 25 minutes
export const POMODORO_BREAK_TIME = 5 * 60; // 5 minutes
