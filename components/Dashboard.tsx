
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { WeeklyReport, StudySession, MemberSummary } from '../types';
import { Sparkles, History, User, Users, Trophy, Zap } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface DashboardProps {
  reports: WeeklyReport[];
  sessions: StudySession[];
  userName: string;
  groupMembers: MemberSummary[];
}

const Dashboard: React.FC<DashboardProps> = ({ reports, sessions, userName, groupMembers }) => {
  const [viewMode, setViewMode] = useState<'personal' | 'group'>('personal');

  const dailyData = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return format(d, 'yyyy-MM-dd');
    });

    return last7Days.map(date => {
      const daySessions = sessions.filter(s => s.date === date);
      const totalMins = daySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
      return {
        date,
        displayDate: format(parseISO(date), 'MM/dd'),
        hours: parseFloat((totalMins / 60).toFixed(2))
      };
    });
  }, [sessions]);

  const latestReport = reports[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-0">
      {/* View Toggle */}
      <div className="flex p-1 bg-gray-100 rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setViewMode('personal')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            viewMode === 'personal' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          個人統計
        </button>
        <button
          onClick={() => setViewMode('group')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            viewMode === 'group' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          讀書會戰友榜
        </button>
      </div>

      {viewMode === 'personal' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                  <History className="text-blue-500" size={24} /> 最近 7 天努力紀錄
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                        {dailyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === dailyData.length - 1 ? '#3b82f6' : '#93c5fd'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <User className="text-indigo-500" size={24} /> 我的進度
                </h3>
                <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl">
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                    {userName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">{userName}</h4>
                    <p className="text-sm text-indigo-600 font-medium">消防設備士備考中</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-80 space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-3xl shadow-lg border border-purple-100 relative overflow-hidden">
                <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2 relative z-10">
                  <Sparkles className="text-purple-500" size={24} /> AI 導師分析
                </h3>
                {latestReport?.aiFeedback ? (
                  <p className="text-gray-700 leading-relaxed text-sm italic relative z-10">「{latestReport.aiFeedback}」</p>
                ) : (
                  <div className="text-gray-500 text-sm italic py-10 text-center relative z-10">完成週報後將出現分析。</div>
                )}
              </div>

              {latestReport && (
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                  <h3 className="text-lg font-bold mb-4 text-gray-800 text-center">本週完成率</h3>
                  <div className="flex justify-center">
                    <div className="relative w-32 h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Done', value: latestReport.completionRate },
                              { name: 'To Do', value: 100 - latestReport.completionRate }
                            ]}
                            cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value"
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#f1f5f9" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-800">{latestReport.completionRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Group View */
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top 3 Summary Cards */}
            {groupMembers.slice(0, 3).map((member, idx) => (
              <div key={member.userName} className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 relative overflow-hidden">
                <div className={`absolute top-0 right-0 p-4 text-4xl opacity-10 font-black`}>
                  #{idx + 1}
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${
                    idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-300' : 'bg-amber-600'
                  }`}>
                    {idx === 0 ? <Trophy size={20} /> : member.userName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{member.userName} {member.userName === userName && '(你)'}</h4>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">
                      達成率 {member.completionRate}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400">本週累積</p>
                    <p className="text-2xl font-black text-gray-800">{member.totalHours.toFixed(1)} <span className="text-sm font-normal text-gray-500">hrs</span></p>
                  </div>
                  {member.status === 'focusing' && (
                    <div className="flex items-center gap-1 text-blue-500 text-xs font-bold animate-pulse">
                      <Zap size={14} fill="currentColor" /> 學習中
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Users size={20} className="text-blue-500" /> 所有成員列表
              </h3>
              <span className="text-xs text-gray-400">最後更新：剛才</span>
            </div>
            <div className="divide-y divide-gray-50">
              {groupMembers.map((member) => (
                <div key={member.userName} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                      {member.userName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{member.userName}</span>
                        {member.userName === userName && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-md font-bold">ME</span>}
                      </div>
                      <div className="w-full max-w-xs bg-gray-100 h-1.5 rounded-full mt-1.5">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${member.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-gray-800">{member.totalHours.toFixed(1)} hr</p>
                    <p className="text-[10px] text-gray-400">達成率 {member.completionRate}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
