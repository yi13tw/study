
export interface StudySession {
  id: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  date: string; // YYYY-MM-DD
}

export interface DailyLog {
  id: string;
  date: string;
  content: string;
  gap?: string;
}

export interface MemberSummary {
  userName: string;
  totalHours: number;
  completionRate: number;
  status: 'focusing' | 'idle' | 'break';
  lastActive: string;
}

export interface WeeklyReport {
  id: string;
  userName: string;
  weekStart: string; // Monday's date
  totalHours: number;
  plannedProgress: string;
  actualProgress: string;
  completionRate: number;
  gapReason: string;
  unfamiliarConcepts: string;
  attemptedSolutions: string;
  nextWeekStrategy: string;
  needsSupport: boolean;
  supportDetail: string;
  createdAt: string;
  aiFeedback?: string;
}

export type TabType = 'timer' | 'report' | 'dashboard';
