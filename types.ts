
export interface StudySession {
  id: string;
  durationMinutes: number;
  date: string; // YYYY-MM-DD
}

export interface DailyLog {
  id: string;
  date: string;
  content: string;
  gap: string;
}

export interface WeeklyReport {
  id: string;
  userName: string;
  weekStart: string;
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
  aiFeedback?: string;
  createdAt: string;
}

export interface MemberSummary {
  userName: string;
  totalHours: number;
  completionRate: number;
  lastUpdate: string;
  status: string;
}
