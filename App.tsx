
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Timer as TimerIcon, FileText, LayoutDashboard, UserCircle, Settings } from 'lucide-react';
import { format, isSameWeek, parseISO } from 'date-fns';
import { StudySession, WeeklyReport, TabType, DailyLog, MemberSummary } from './types';
import Timer from './components/Timer';
import ReportForm from './components/ReportForm';
import Dashboard from './components/Dashboard';
import DailyTracker from './components/DailyTracker';
import { getMondayOfCurrentWeek } from './constants';
import { getWeeklyAIAnalysis } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('timer');
  const [userName, setUserName] = useState<string>(localStorage.getItem('study_user_name') || '');
  const [isNaming, setIsNaming] = useState(!userName);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New states for tracking progress
  const [weeklyPlan, setWeeklyPlan] = useState<string>(localStorage.getItem('study_weekly_plan') || '');
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);

  // Load data from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('study_sessions');
    const savedReports = localStorage.getItem('study_reports');
    const savedDailyLogs = localStorage.getItem('study_daily_logs');
    
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    if (savedReports) setReports(JSON.parse(savedReports));
    
    if (savedDailyLogs) {
      const logs: DailyLog[] = JSON.parse(savedDailyLogs);
      const currentMonday = parseISO(getMondayOfCurrentWeek());
      const filteredLogs = logs.filter(log => isSameWeek(parseISO(log.date), currentMonday, { weekStartsOn: 1 }));
      setDailyLogs(filteredLogs);
    }
  }, []);

  // Persist data
  useEffect(() => localStorage.setItem('study_sessions', JSON.stringify(sessions)), [sessions]);
  useEffect(() => localStorage.setItem('study_reports', JSON.stringify(reports)), [reports]);
  useEffect(() => localStorage.setItem('study_weekly_plan', weeklyPlan), [weeklyPlan]);
  useEffect(() => localStorage.setItem('study_daily_logs', JSON.stringify(dailyLogs)), [dailyLogs]);

  const calculateWeeklyHours = useCallback(() => {
    const currentMonday = parseISO(getMondayOfCurrentWeek());
    const weekSessions = sessions.filter(s => isSameWeek(parseISO(s.date), currentMonday, { weekStartsOn: 1 }));
    const totalMinutes = weekSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    return totalMinutes / 60;
  }, [sessions]);

  // Mock Group Data for visual demonstration
  const groupMembers = useMemo(() => {
    const myHours = calculateWeeklyHours();
    const myCompletion = reports[0]?.completionRate || (dailyLogs.length * 15); // Rough estimation if no report
    
    const mockPeers: MemberSummary[] = [
      { userName: '阿強 (隊長)', totalHours: 28.5, completionRate: 95, status: 'idle', lastActive: '10 mins ago' },
      { userName: '小美', totalHours: 22.1, completionRate: 88, status: 'focusing', lastActive: 'now' },
      { userName: '消防大師', totalHours: 35.0, completionRate: 100, status: 'idle', lastActive: '1 hour ago' },
      { userName: '凱文', totalHours: 12.4, completionRate: 45, status: 'break', lastActive: '2 hours ago' },
    ];

    const me: MemberSummary = {
      userName: userName || '我',
      totalHours: myHours,
      completionRate: Math.min(100, myCompletion),
      status: 'focusing', // In actual app, this would be dynamic
      lastActive: 'now'
    };

    return [me, ...mockPeers].sort((a, b) => b.totalHours - a.totalHours);
  }, [calculateWeeklyHours, reports, dailyLogs, userName]);

  const handleSessionComplete = (minutes: number) => {
    const newSession: StudySession = {
      id: crypto.randomUUID(),
      startTime: Date.now() - minutes * 60000,
      endTime: Date.now(),
      durationMinutes: minutes,
      date: format(new Date(), 'yyyy-MM-dd')
    };
    setSessions(prev => [...prev, newSession]);
  };

  const handleAddDailyLog = (content: string, gap: string) => {
    const newLog: DailyLog = {
      id: crypto.randomUUID(),
      date: format(new Date(), 'yyyy-MM-dd'),
      content,
      gap
    };
    setDailyLogs(prev => [...prev, newLog]);
  };

  const handleReportSubmit = async (report: WeeklyReport) => {
    setIsSubmitting(true);
    try {
      const aiFeedback = await getWeeklyAIAnalysis(report);
      const reportWithAI = { ...report, aiFeedback };
      setReports(prev => [reportWithAI, ...prev]);
      
      setWeeklyPlan('');
      setDailyLogs([]);
      localStorage.removeItem('study_weekly_plan');
      localStorage.removeItem('study_daily_logs');
      
      setActiveTab('dashboard');
      alert("回報成功！數據已同步至讀書會看板。");
    } catch (err) {
      console.error(err);
      setReports(prev => [report, ...prev]);
      setActiveTab('dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveUserName = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem('study_user_name', userName);
      setIsNaming(false);
    }
  };

  if (isNaming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center p-6 text-white text-center">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full">
           <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserCircle size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">消防戰友您好</h1>
          <p className="text-gray-500 mb-8">請輸入您的姓名，進入讀書會看板。</p>
          <form onSubmit={saveUserName} className="space-y-4">
            <input
              autoFocus required
              className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all text-center text-xl font-medium text-gray-800"
              placeholder="您的姓名"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg">進入書房</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">S</div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-none">StudyBuddy</h1>
            <p className="text-xs text-gray-400 mt-1">消防設備士讀書會看板</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-xs text-gray-400">本週累積努力</p>
            <p className="text-sm font-bold text-blue-600">{calculateWeeklyHours().toFixed(1)} hrs</p>
          </div>
          <button onClick={() => setIsNaming(true)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 md:px-6">
        {activeTab === 'timer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="flex flex-col items-center">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">專注模式</h2>
                <p className="text-gray-500">當你在努力時，戰友們也在同步衝刺！</p>
              </div>
              <Timer onSessionComplete={handleSessionComplete} />
            </div>
            <div>
              <DailyTracker 
                weeklyPlan={weeklyPlan} 
                onUpdatePlan={setWeeklyPlan} 
                dailyLogs={dailyLogs} 
                onAddLog={handleAddDailyLog} 
              />
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <ReportForm 
            currentWeekHours={calculateWeeklyHours()} 
            userName={userName} 
            weeklyPlan={weeklyPlan}
            dailyLogs={dailyLogs}
            onSubmit={handleReportSubmit} 
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard 
            reports={reports} 
            sessions={sessions} 
            userName={userName} 
            groupMembers={groupMembers}
          />
        )}
      </main>

      {isSubmitting && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800">正在同步讀書會數據...</h2>
        </div>
      )}

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-full px-4 py-3 flex gap-2 z-40">
        <button onClick={() => setActiveTab('timer')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${activeTab === 'timer' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}>
          <TimerIcon size={20} /><span className="hidden md:inline">進度追蹤</span>
        </button>
        <button onClick={() => setActiveTab('report')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${activeTab === 'report' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}>
          <FileText size={20} /><span className="hidden md:inline">週日結報</span>
        </button>
        <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}>
          <LayoutDashboard size={20} /><span className="hidden md:inline">讀書會看板</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
