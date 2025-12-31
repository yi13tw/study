
import React, { useState } from 'react';
import { ClipboardList, Plus, Calendar, Target, CheckCircle } from 'lucide-react';
import { DailyLog } from '../types';
import { format } from 'date-fns';

interface DailyTrackerProps {
  weeklyPlan: string;
  onUpdatePlan: (plan: string) => void;
  dailyLogs: DailyLog[];
  onAddLog: (content: string, gap: string) => void;
}

const DailyTracker: React.FC<DailyTrackerProps> = ({ weeklyPlan, onUpdatePlan, dailyLogs, onAddLog }) => {
  const [isEditingPlan, setIsEditingPlan] = useState(!weeklyPlan);
  const [tempPlan, setTempPlan] = useState(weeklyPlan);
  const [newContent, setNewContent] = useState('');
  const [newGap, setNewGap] = useState('');

  const handleSavePlan = () => {
    onUpdatePlan(tempPlan);
    setIsEditingPlan(false);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContent.trim()) {
      onAddLog(newContent, newGap);
      setNewContent('');
      setNewGap('');
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const hasLogToday = dailyLogs.some(log => log.date === todayStr);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Weekly Plan Section */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Target size={20} /> 本週預計規劃 (消防設備士)
          </h3>
          {!isEditingPlan && (
            <button onClick={() => setIsEditingPlan(true)} className="text-blue-100 text-sm hover:underline">
              修改規劃
            </button>
          )}
        </div>
        <div className="p-6">
          {isEditingPlan ? (
            <div className="space-y-3">
              <textarea
                value={tempPlan}
                onChange={(e) => setTempPlan(e.target.value)}
                placeholder="例如：讀完消防法第 1-20 條、完成 111 年警報系統考古題..."
                className="w-full p-4 rounded-xl border border-blue-100 focus:ring-2 focus:ring-blue-500 outline-none h-24"
              />
              <button
                onClick={handleSavePlan}
                className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                儲存本週規劃
              </button>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-line leading-relaxed italic">
              「{weeklyPlan || '尚未設定本週規劃...'}」
            </p>
          )}
        </div>
      </div>

      {/* Daily Input Section */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-blue-500" /> 每日進度回報
        </h3>
        
        {hasLogToday ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 mb-4">
            <CheckCircle size={20} />
            <span className="font-medium">今日已完成進度填寫！</span>
          </div>
        ) : (
          <form onSubmit={handleAddLog} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">今日實際進度</label>
              <input
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="今天讀了什麼？（例：完成警報系統配線圖練習）"
                className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">遇到困難或落差 (選填)</label>
              <input
                value={newGap}
                onChange={(e) => setNewGap(e.target.value)}
                placeholder="有卡關嗎？（例：揚程公式還不夠熟練）"
                className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!newContent.trim()}
              className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus size={18} /> 紀錄今日進度
            </button>
          </form>
        )}

        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">本週紀錄明細</p>
          {dailyLogs.length === 0 ? (
            <p className="text-sm text-gray-300 italic py-4 text-center">本週尚未有每日紀錄</p>
          ) : (
            <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
              {dailyLogs.map((log) => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-blue-600">{log.date}</span>
                  </div>
                  <p className="text-sm text-gray-700">{log.content}</p>
                  {log.gap && <p className="text-xs text-rose-500 mt-1">落差：{log.gap}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyTracker;
