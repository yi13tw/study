
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Timer as TimerIcon, FileText, LayoutDashboard, UserCircle, Settings, CloudSync } from 'lucide-react';
import { format, isSameWeek, parseISO } from 'date-fns';
import { StudySession, WeeklyReport, TabType, DailyLog, MemberSummary } from './types';
import Timer from './components/Timer';
import ReportForm from './components/ReportForm';
import Dashboard from './components/Dashboard';
import DailyTracker from './components/DailyTracker';
import { getMondayOfCurrentWeek } from './constants';
import { getWeeklyAIAnalysis } from './services/geminiService';
import { syncToSheets, fetchGroupData } from './services/sheetService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('timer');
  const [userName, setUserName] = useState<string>(localStorage.getItem('study_user_name') || '');
  const [isNaming, setIsNaming] = useState(!userName);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Google Sheets Config
  const [sheetUrl, setSheetUrl] = useState<string>(localStorage.getItem('study_sheet_url') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [groupData, setGroupData] = useState<MemberSummary[]>([]);

  const [weeklyPlan, setWeeklyPlan] = useState<string>(localStorage.getItem('study_weekly_plan') || '');
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);

  // 初始載入與定時更新群組數據
  useEffect(() => {
    const loadInitialData = async () => {
      const savedSessions = localStorage.getItem('study_sessions');
      const savedReports = localStorage.getItem('study_reports');
      const savedDailyLogs = localStorage.getItem('study_daily_logs');
      
      if (savedSessions) setSessions(JSON.parse(savedSessions));
      if (savedReports) setReports(JSON.parse(savedReports));
      if (savedDailyLogs) {
        const logs = JSON.parse(savedDailyLogs);
        const currentMonday = parseISO(getMondayOfCurrentWeek());
        setDailyLogs(logs.filter((log: any) => isSameWeek(parseISO(log.date), currentMonday, { weekStartsOn: 1 })));
      }

      if (sheetUrl) {
        const data = await fetchGroupData(sheetUrl);
        if (data.length > 0) {
          setGroupData(data.map(d => ({ ...d, lastActive: '剛剛' } as MemberSummary)));
        }
      }
    };
    loadInitialData();
  }, [sheetUrl]);

  // 每當 sessions 或 logs 變化，同步到雲端
  useEffect(() => {
    localStorage.setItem('study_sessions', JSON.stringify(sessions));
    localStorage.setItem('study_reports', JSON.stringify(reports));
    localStorage.setItem('study_weekly_plan', weeklyPlan);
    localStorage.setItem('study_daily_logs', JSON.stringify(dailyLogs));
    localStorage.setItem('study_sheet_url', sheetUrl);

    if (sheetUrl && userName) {
      const myHours = sessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60;
      syncToSheets(sheetUrl, {
        userName,
        totalHours: myHours,
        completionRate: reports[0]?.completionRate || (dailyLogs.length * 15),
        lastUpdate: new Date().toISOString(),
        status: '學習中'
      });
    }
  }, [sessions, reports, weeklyPlan, dailyLogs, sheetUrl, userName]);

  const calculateWeeklyHours = useCallback(() => {
    const currentMonday = parseISO(getMondayOfCurrentWeek());
    const weekSessions = sessions.filter(s => isSameWeek(parseISO(s.date), currentMonday, { weekStartsOn: 1 }));
    return weekSessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60;
  }, [sessions]);

  // 合併雲端數據與本地模擬數據 (若雲端沒資料則顯示模擬)
  const finalGroupMembers = useMemo(() => {
    if (groupData.length > 0) return groupData.sort((a, b) => b.totalHours - a.totalHours);
    
    // 預設模擬數據
    const mock: MemberSummary[] = [
      { userName: '阿強 (隊長)', totalHours: 28.5, completionRate: 95, status: 'idle', lastActive: '10 min' },
      { userName: '小美', totalHours: 22.1, completionRate: 88, status: 'focusing', lastActive: 'now' },
    ];
    const me = { userName: userName || '我', totalHours: calculateWeeklyHours(), completionRate: reports[0]?.completionRate || (dailyLogs.length * 15), status: 'focusing' as any, lastActive: 'now' };
    return [me, ...mock].sort((a, b) => b.totalHours - a.totalHours);
  }, [groupData, calculateWeeklyHours, reports, dailyLogs, userName]);

  if (isNaming) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600">
            <UserCircle size={48} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">歡迎戰友</h1>
          <p className="text-gray-400 text-sm mb-8">輸入姓名開啟你的備考儀表板</p>
          <form onSubmit={(e) => { e.preventDefault(); if(userName) setIsNaming(false); }} className="space-y-4">
            <input 
              required className="w-full bg-gray-50 p-4 rounded-2xl border-none ring-2 ring-transparent focus:ring-blue-500 transition-all text-center text-lg font-bold"
              placeholder="您的姓名" value={userName} onChange={e => setUserName(e.target.value)}
            />
            <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200">
              開始讀書
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-gray-900 pb-28">
      {/* Top Header */}
      <header className="px-6 py-6 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100">S</div>
          <div>
            <h1 className="text-base font-black tracking-tight">STUDYBUDDY</h1>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">FIRE SAFETY APP</p>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-blue-600 transition-all">
          <Settings size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="px-5 pt-4">
        {activeTab === 'timer' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <Timer onSessionComplete={(m) => setSessions(prev => [...prev, { id: crypto.randomUUID(), startTime: Date.now(), endTime: Date.now(), durationMinutes: m, date: format(new Date(), 'yyyy-MM-dd') }])} />
            <DailyTracker weeklyPlan={weeklyPlan} onUpdatePlan={setWeeklyPlan} dailyLogs={dailyLogs} onAddLog={(c, g) => setDailyLogs(prev => [...prev, { id: crypto.randomUUID(), date: format(new Date(), 'yyyy-MM-dd'), content: c, gap: g }])} />
          </div>
        )}

        {activeTab === 'report' && (
          <ReportForm currentWeekHours={calculateWeeklyHours()} userName={userName} weeklyPlan={weeklyPlan} dailyLogs={dailyLogs} onSubmit={async (r) => {
            setIsSubmitting(true);
            const aiFeedback = await getWeeklyAIAnalysis(r);
            setReports(prev => [{ ...r, aiFeedback }, ...prev]);
            setDailyLogs([]);
            setWeeklyPlan('');
            setIsSubmitting(false);
            setActiveTab('dashboard');
          }} />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard reports={reports} sessions={sessions} userName={userName} groupMembers={finalGroupMembers} />
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end">
          <div className="bg-white w-full rounded-t-[2.5rem] p-8 animate-in slide-in-from-bottom-full duration-300">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-8" />
            <h3 className="text-xl font-black mb-6">同步設定</h3>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Google Sheets API URL</label>
                <input 
                  className="w-full bg-gray-50 p-4 rounded-2xl border-none ring-2 ring-gray-100 focus:ring-blue-500 outline-none"
                  placeholder="輸入 GAS 部署網址..." value={sheetUrl} onChange={e => setSheetUrl(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-2">整合此網址後，您的進度將與讀書會成員即時同步。</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold">儲存並關閉</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-2xl border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] px-4 py-3 flex gap-3 z-50">
        {[
          { id: 'timer', icon: TimerIcon, label: '專注' },
          { id: 'report', icon: FileText, label: '結報' },
          { id: 'dashboard', icon: LayoutDashboard, label: '看板' }
        ].map(tab => (
          <button 
            key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <tab.icon size={20} />
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </nav>

      {isSubmitting && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-lg z-[200] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-bold text-gray-800">正在生成 AI 戰略與同步雲端...</p>
        </div>
      )}
    </div>
  );
};

export default App;
