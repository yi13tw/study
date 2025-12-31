
import React, { useState, useEffect } from 'react';
import { Send, AlertCircle, CheckCircle2, Heart } from 'lucide-react';
import { WeeklyReport, DailyLog } from '../types';
import { getMondayOfCurrentWeek } from '../constants';

interface ReportFormProps {
  currentWeekHours: number;
  userName: string;
  weeklyPlan: string;
  dailyLogs: DailyLog[];
  onSubmit: (report: WeeklyReport) => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ currentWeekHours, userName, weeklyPlan, dailyLogs, onSubmit }) => {
  const [formData, setFormData] = useState({
    plannedProgress: weeklyPlan,
    actualProgress: '',
    completionRate: 70,
    gapReason: '',
    unfamiliarConcepts: '',
    attemptedSolutions: '',
    nextWeekStrategy: '',
    needsSupport: false,
    supportDetail: ''
  });

  // Auto-populate actual progress and gaps from daily logs
  useEffect(() => {
    if (dailyLogs.length > 0) {
      const summary = dailyLogs.map(log => `[${log.date}] ${log.content}`).join('\n');
      const gaps = dailyLogs.filter(log => log.gap).map(log => `[${log.date}] ${log.gap}`).join('\n');
      
      setFormData(prev => ({
        ...prev,
        actualProgress: summary,
        gapReason: gaps,
        plannedProgress: weeklyPlan
      }));
    }
  }, [dailyLogs, weeklyPlan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, completionRate: parseInt(e.target.value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const report: WeeklyReport = {
      ...formData,
      id: crypto.randomUUID(),
      userName,
      weekStart: getMondayOfCurrentWeek(),
      totalHours: currentWeekHours,
      createdAt: new Date().toISOString()
    };
    onSubmit(report);
  };

  return (
    <div className="max-w-3xl mx-auto mb-10">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">週日結算：總結本週努力</h2>
          <p className="opacity-90">系統已根據你的每日紀錄自動填寫進度。請進行最後的檢討與下週調整。</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Section 1: Basic Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">累積時間</label>
              <div className="text-2xl font-bold text-blue-600">{currentWeekHours.toFixed(1)} hrs</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">完成率</label>
              <div className="text-2xl font-bold text-green-600">{formData.completionRate}%</div>
            </div>
          </div>

          {/* Section 2: Progress Review */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <CheckCircle2 className="text-green-500" size={20} /> 進度檢視
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">本週預計規劃 (系統載入)</label>
              <textarea
                disabled
                value={formData.plannedProgress}
                className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 italic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">實際完成進度 (已自動彙整每日紀錄)</label>
              <textarea
                required
                name="actualProgress"
                value={formData.actualProgress}
                onChange={handleChange}
                rows={5}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">手動微調完成率：{formData.completionRate}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.completionRate}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">彙整落差原因</label>
              <textarea
                name="gapReason"
                value={formData.gapReason}
                onChange={handleChange}
                rows={3}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Section 3: Reflection */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <AlertCircle className="text-amber-500" size={20} /> 深度吸收紀錄
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">本週最不熟的觀念</label>
                <textarea
                  required
                  name="unfamiliarConcepts"
                  value={formData.unfamiliarConcepts}
                  onChange={handleChange}
                  rows={2}
                  placeholder="例：水系統揚程計算公式..."
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">已嘗試的解法</label>
                <textarea
                  required
                  name="attemptedSolutions"
                  value={formData.attemptedSolutions}
                  onChange={handleChange}
                  rows={2}
                  placeholder="例：看 Youtube 範例、問老師..."
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Next Week */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <Heart className="text-rose-500" size={20} /> 下週策略
            </h3>
            <textarea
              required
              name="nextWeekStrategy"
              value={formData.nextWeekStrategy}
              onChange={handleChange}
              rows={2}
              placeholder="下週想如何優化讀書狀態？"
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <div className="p-4 bg-rose-50 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="needsSupport"
                  checked={formData.needsSupport}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="font-medium text-rose-700">需要讀書會戰友的支援</span>
              </label>
              {formData.needsSupport && (
                <textarea
                  name="supportDetail"
                  value={formData.supportDetail}
                  onChange={handleChange}
                  rows={2}
                  placeholder="需要什麼幫忙？"
                  className="w-full mt-3 p-3 rounded-xl border border-rose-200 focus:ring-2 focus:ring-rose-500 outline-none transition-all bg-white"
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
          >
            <Send size={20} /> 完成結報並取得 AI 建議
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;
