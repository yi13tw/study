
import { ref, computed, onMounted, watch } from 'vue';
import { 
  Timer as IconTimer, 
  FileText as IconFile, 
  LayoutDashboard as IconBoard, 
  Zap, Play, Square, RotateCcw, Target, Send, Sparkles, Trophy, Plus, CheckCircle, AlertCircle, Quote, Users, Clock
} from 'lucide-vue-next';
import { format, startOfWeek } from 'date-fns';
import { getWeeklyAIAnalysis } from './services/geminiService';

export default {
  components: { 
    IconTimer, IconFile, IconBoard, Zap, Play, Square, RotateCcw, Target, Send, Sparkles, Trophy, Plus, CheckCircle, AlertCircle, Quote, Users, Clock
  },
  setup() {
    const activeTab = ref('dashboard');
    const userName = ref(localStorage.getItem('study_user_name') || '');
    const isNaming = ref(!userName.value);
    
    // GAS 連結 (讀書會共用)
    const sheetUrl = "https://script.google.com/macros/s/AKfycbx93tB14D6-W-Pft_As2w6zgQtMN6iTiGowkv99_q0LJsfHLMqbiH5OX5OvAKK2hlA4/exec";

    // --- 狀態定義 ---
    const sessions = ref(JSON.parse(localStorage.getItem('study_sessions') || '[]'));
    const dailyLogs = ref(JSON.parse(localStorage.getItem('study_daily_logs') || '[]'));
    const weeklyPlan = ref(localStorage.getItem('study_weekly_plan') || '例：讀完消防法規水系統篇、做111年考古題');
    const groupMembers = ref([]);
    const isSyncing = ref(false);
    const isAnalyzing = ref(false);

    // --- 計時器邏輯 ---
    const timeLeft = ref(25 * 60);
    const timerActive = ref(false);
    const isBreak = ref(false);
    let timerInterval = null;

    // --- 週報表單 ---
    const reportForm = ref({
      completionRate: 80,
      unfamiliarConcepts: '',
      attemptedSolutions: '',
      nextWeekStrategy: '',
      needsSupport: false,
      supportDetail: ''
    });

    // --- 計算屬性 ---
    const currentWeekStart = computed(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    
    const thisWeekSessions = computed(() => sessions.value.filter(s => s.date >= currentWeekStart.value));
    const thisWeekLogs = computed(() => dailyLogs.value.filter(l => l.date >= currentWeekStart.value));
    
    const currentWeekHours = computed(() => {
      return thisWeekSessions.value.reduce((acc, s) => acc + s.durationMinutes, 0) / 60;
    });

    const timerDisplay = computed(() => {
      const m = Math.floor(timeLeft.value / 60).toString().padStart(2, '0');
      const s = (timeLeft.value % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    });

    // --- 方法 ---
    const saveName = () => {
      if (userName.value.trim()) {
        localStorage.setItem('study_user_name', userName.value);
        isNaming.value = false;
        syncData();
      }
    };

    const toggleTimer = () => {
      if (timerActive.value) {
        clearInterval(timerInterval);
      } else {
        timerInterval = setInterval(() => {
          if (timeLeft.value > 0) timeLeft.value--;
          else completeSession();
        }, 1000);
      }
      timerActive.value = !timerActive.value;
      syncData(); // 同步當前狀態 (專注中)
    };

    const completeSession = () => {
      clearInterval(timerInterval);
      timerActive.value = false;
      if (!isBreak.value) {
        sessions.value.push({
          id: Date.now().toString(),
          durationMinutes: 25,
          date: format(new Date(), 'yyyy-MM-dd')
        });
        timeLeft.value = 5 * 60;
        isBreak.value = true;
        alert("🎉 專注完成！累積 25 分鐘。");
      } else {
        timeLeft.value = 25 * 60;
        isBreak.value = false;
        alert("☕ 休息結束，開始新的一節。");
      }
      syncData();
    };

    const addDailyLog = (e) => {
      const content = e.target.value.trim();
      if (!content) return;
      dailyLogs.value.push({
        id: Date.now().toString(),
        date: format(new Date(), 'yyyy-MM-dd'),
        content,
        gap: ''
      });
      e.target.value = '';
      syncData();
    };

    const syncData = async () => {
      if (!userName.value) return;
      isSyncing.value = true;
      try {
        const payload = {
          userName: userName.value,
          totalHours: currentWeekHours.value,
          completionRate: reportForm.value.completionRate,
          lastUpdate: new Date().toISOString(),
          status: timerActive.value ? '專注中' : (isBreak.value ? '休息中' : '待機')
        };
        
        await fetch(sheetUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
        const res = await fetch(sheetUrl);
        const data = await res.json();
        groupMembers.value = data.sort((a, b) => b.totalHours - a.totalHours);
      } catch (e) {
        console.error("同步失敗", e);
      } finally {
        isSyncing.value = false;
      }
    };

    const prepareReview = () => {
      activeTab.value = 'review';
      // 自動彙整本週進度
      const summary = thisWeekLogs.value.map(l => `• ${l.content}`).join('\n');
      // 將彙整內容放入提示或直接填入表單 (此處僅作範例說明)
    };

    const submitReview = async () => {
      isAnalyzing.value = true;
      const actualProgress = thisWeekLogs.value.map(l => `[${l.date}] ${l.content}`).join('\n');
      
      const report = {
        userName: userName.value,
        weekStart: currentWeekStart.value,
        totalHours: currentWeekHours.value,
        plannedProgress: weeklyPlan.value,
        actualProgress,
        ...reportForm.value,
        createdAt: new Date().toISOString()
      };

      const aiSuggestion = await getWeeklyAIAnalysis(report);
      alert("✅ 週報已上傳！AI 導師建議：\n\n" + aiSuggestion);
      isAnalyzing.value = false;
      activeTab.value = 'leaderboard';
      syncData();
    };

    watch([sessions, dailyLogs, weeklyPlan], () => {
      localStorage.setItem('study_sessions', JSON.stringify(sessions.value));
      localStorage.setItem('study_daily_logs', JSON.stringify(dailyLogs.value));
      localStorage.setItem('study_weekly_plan', weeklyPlan.value);
    }, { deep: true });

    onMounted(syncData);

    return {
      activeTab, userName, isNaming, isSyncing, isAnalyzing,
      timeLeft, timerActive, isBreak, timerDisplay, toggleSession: toggleTimer,
      sessions, dailyLogs, weeklyPlan, currentWeekHours, groupMembers,
      thisWeekLogs, reportForm, saveName, addDailyLog, syncData, submitReview, prepareReview
    };
  },
  template: `
    <div class="min-h-screen bg-[#FDFDFF] text-slate-900 pb-28">
      <!-- 登入介面 -->
      <div v-if="isNaming" class="fixed inset-0 z-[200] bg-blue-600 flex items-center justify-center p-8">
        <div class="bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-sm text-center">
          <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
             <zap size="40" fill="currentColor" />
          </div>
          <h1 class="text-3xl font-black text-slate-900 mb-2">消防戰友會</h1>
          <p class="text-slate-400 text-sm mb-8 font-medium italic">記錄努力，而非只看成績</p>
          <div class="space-y-4">
            <input v-model="userName" @keyup.enter="saveName" class="w-full bg-slate-50 p-5 rounded-2xl border-none ring-2 ring-transparent focus:ring-blue-500 outline-none text-center text-xl font-bold transition-all" placeholder="您的姓名" />
            <button @click="saveName" class="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all">進入備考空間</button>
          </div>
        </div>
      </div>

      <!-- Header -->
      <header class="px-6 py-6 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg italic">S</div>
          <div>
            <h1 class="text-base font-black tracking-tight leading-none italic uppercase">StudyBuddy</h1>
            <p class="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">消防設備士備考團</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
           <div v-if="isSyncing" class="w-4 h-4 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
           <div class="text-right">
              <p class="text-[10px] text-slate-400 font-bold uppercase">本週已投入</p>
              <p class="text-sm font-black text-blue-600">{{ currentWeekHours.toFixed(1) }} HR</p>
           </div>
        </div>
      </header>

      <main class="px-5 pt-6 max-w-lg mx-auto">
        
        <!-- 分頁 1: 備考儀表板 -->
        <div v-if="activeTab === 'dashboard'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <!-- 固定化規劃卡片 -->
          <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
             <div class="absolute -right-4 -top-4 opacity-[0.03] text-blue-600 rotate-12">
                <target size="120" />
             </div>
             <div class="flex items-center gap-2 mb-4">
                <div class="p-2 bg-blue-50 text-blue-600 rounded-xl"><target size="18" /></div>
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-400">本週預計進度 (鎖定中)</h3>
             </div>
             <textarea v-model="weeklyPlan" class="w-full bg-slate-50 p-5 rounded-2xl border-none outline-none text-sm font-bold text-slate-700 h-28 focus:ring-2 focus:ring-blue-100 transition-all"></textarea>
          </div>

          <!-- 番茄鐘區域 -->
          <div class="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center">
             <div class="mb-8 px-5 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-sm" :class="isBreak ? 'bg-green-100 text-green-600' : 'bg-blue-600 text-white'">
                {{ isBreak ? '休息中' : '高效專注中' }}
             </div>
             <div class="text-7xl font-black tracking-tighter text-slate-800 mb-10">{{ timerDisplay }}</div>
             <div class="flex gap-4">
                <button @click="toggleSession" class="w-20 h-20 rounded-[2.2rem] flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all" :class="timerActive ? 'bg-amber-500 shadow-amber-100' : 'bg-blue-600 shadow-blue-100'">
                   <component :is="timerActive ? 'Square' : 'Play'" size="32" fill="currentColor" />
                </button>
                <button @click="timeLeft = 25*60; timerActive=false" class="w-20 h-20 rounded-[2.2rem] bg-slate-100 text-slate-400 flex items-center justify-center active:scale-90 transition-all">
                   <rotate-ccw size="32" />
                </button>
             </div>
          </div>

          <!-- 每日隨手記 -->
          <div class="bg-slate-900 text-white p-7 rounded-[2.5rem] shadow-2xl">
             <div class="flex items-center justify-between mb-6">
                <h3 class="font-bold flex items-center gap-2 italic">
                   <plus size="18" class="text-blue-400" />
                   今日進度隨手記
                </h3>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">不限字數</span>
             </div>
             <input @keyup.enter="addDailyLog" class="w-full bg-white/10 p-5 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 mb-6 font-medium placeholder:text-slate-500" placeholder="今天讀了什麼？遇到什麼卡關？" />
             
             <div class="space-y-3">
                <div v-for="log in thisWeekLogs.slice().reverse()" :key="log.id" class="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3 animate-in slide-in-from-left">
                   <div class="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                   <div class="flex-1">
                      <p class="text-xs font-bold">{{ log.content }}</p>
                      <p class="text-[9px] text-slate-500 mt-1 uppercase font-black">{{ log.date }}</p>
                   </div>
                </div>
                <div v-if="thisWeekLogs.length === 0" class="text-center py-6 opacity-20 italic text-xs">本週尚未有紀錄，動動手指吧！</div>
             </div>
          </div>
        </div>

        <!-- 分頁 2: 週日結報 (Review) -->
        <div v-if="activeTab === 'review'" class="space-y-6 animate-in fade-in pb-12">
           <div class="bg-blue-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
              <h2 class="text-2xl font-black mb-1 italic">Weekly Review</h2>
              <p class="text-sm opacity-80 font-medium">系統已彙整本週 {{ thisWeekLogs.length }} 則日誌</p>
              <icon-file class="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
           </div>

           <div class="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-10">
              <div>
                 <div class="flex justify-between items-end mb-4">
                    <label class="text-xs font-black text-slate-400 uppercase tracking-widest">本週預估完成率</label>
                    <span class="text-2xl font-black text-blue-600">{{ reportForm.completionRate }}%</span>
                 </div>
                 <input type="range" v-model="reportForm.completionRate" class="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>

              <div class="space-y-8">
                 <div class="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <alert-circle size="12" class="text-amber-500" /> 實際完成進度 (自動彙整)
                    </h4>
                    <div class="text-xs font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">
                       {{ thisWeekLogs.map(l => l.content).join('\n') || '尚未填寫每日紀錄' }}
                    </div>
                 </div>

                 <div>
                    <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">最不熟的觀念 / 待解決困難</label>
                    <textarea v-model="reportForm.unfamiliarConcepts" class="w-full bg-slate-50 p-5 rounded-2xl border-none outline-none text-sm font-bold h-24" placeholder="例如：水系統揚程計算、法規第12條背不起來..."></textarea>
                 </div>

                 <div>
                    <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">下週調整策略</label>
                    <textarea v-model="reportForm.nextWeekStrategy" class="w-full bg-slate-50 p-5 rounded-2xl border-none outline-none text-sm font-bold h-24" placeholder="例如：提早起床讀書、多看兩次考古題..."></textarea>
                 </div>

                 <div class="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50 flex items-center gap-4">
                    <input type="checkbox" v-model="reportForm.needsSupport" class="w-6 h-6 rounded-lg accent-blue-600" />
                    <span class="text-sm font-bold text-slate-700">需要讀書會戰友支援？</span>
                 </div>
              </div>

              <button @click="submitReview" :disabled="isAnalyzing" class="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-bold text-lg shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 transition-all">
                 <span v-if="isAnalyzing" class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                 <send v-else size="20" /> 送出並取得 AI 建議
              </button>
           </div>
        </div>

        <!-- 分頁 3: 戰友排行榜 (Leaderboard) -->
        <div v-if="activeTab === 'leaderboard'" class="space-y-6 animate-in fade-in">
           <div class="bg-white p-7 rounded-[3rem] shadow-sm border border-slate-100">
              <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2">
                 <trophy size="16" class="text-amber-500" /> 本週備考戰友榜
              </h3>
              
              <div class="space-y-10">
                 <div v-for="(member, idx) in groupMembers" :key="idx" class="relative flex items-center gap-5">
                    <!-- 名次區 -->
                    <div class="w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-lg font-black shrink-0 shadow-inner" 
                         :class="idx === 0 ? 'bg-amber-50 text-amber-600' : (idx === 1 ? 'bg-slate-100 text-slate-500' : 'bg-orange-50 text-orange-600')">
                       <trophy v-if="idx === 0" size="20" />
                       <span v-else>{{ idx + 1 }}</span>
                    </div>

                    <!-- 資訊區 -->
                    <div class="flex-1">
                       <div class="flex justify-between items-end mb-2">
                          <div class="flex items-center gap-2">
                             <span class="text-sm font-black">{{ member.userName }}</span>
                             <span class="text-[8px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-md font-black uppercase" v-if="member.status === '專注中'">讀書中</span>
                          </div>
                          <span class="text-base font-black text-slate-800 italic">{{ member.totalHours.toFixed(1) }} <span class="text-[9px] text-slate-400 uppercase font-bold">HR</span></span>
                       </div>
                       <!-- 進度條 -->
                       <div class="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                          <div class="h-full bg-blue-600 transition-all duration-1000" :style="{ width: (member.totalHours / 40 * 100) + '%' }"></div>
                       </div>
                    </div>

                    <!-- 達成率徽章 -->
                    <div class="text-right">
                       <p class="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">達成率</p>
                       <p class="text-xs font-black text-blue-600">{{ member.completionRate }}%</p>
                    </div>
                 </div>

                 <div v-if="groupMembers.length === 0" class="text-center py-20 opacity-30 italic">尚無戰友數據，快邀請大家加入！</div>
              </div>
           </div>

           <!-- 激勵卡片 -->
           <div class="bg-gradient-to-br from-blue-700 to-indigo-800 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <sparkles size="48" class="absolute -right-4 -top-4 opacity-10 rotate-12" />
              <div class="relative z-10">
                 <h3 class="text-2xl font-black mb-4 flex items-center gap-2">戰友激勵</h3>
                 <p class="text-sm opacity-80 leading-relaxed font-medium">
                    目前的平均投入時數為 14.2 小時。最強戰友本週已突破 30 小時！別讓自己落後太多，再讀 25 分鐘吧。
                 </p>
              </div>
           </div>
        </div>
      </main>

      <!-- 導航欄 -->
      <nav class="fixed bottom-8 left-6 right-6 bg-white/70 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-[2.5rem] px-4 py-3 flex justify-around items-center z-[100]">
        <button @click="activeTab = 'dashboard'" class="flex flex-col items-center gap-1 transition-all py-3 px-6 rounded-3xl" :class="activeTab === 'dashboard' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400'">
           <icon-board size="22" :stroke-width="activeTab === 'dashboard' ? 3 : 2" />
           <span class="text-[10px] font-black uppercase tracking-tighter">儀表板</span>
        </button>
        <button @click="prepareReview" class="flex flex-col items-center gap-1 transition-all py-3 px-6 rounded-3xl" :class="activeTab === 'review' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400'">
           <icon-file size="22" :stroke-width="activeTab === 'review' ? 3 : 2" />
           <span class="text-[10px] font-black uppercase tracking-tighter">週結報</span>
        </button>
        <button @click="activeTab = 'leaderboard'" class="flex flex-col items-center gap-1 transition-all py-3 px-6 rounded-3xl" :class="activeTab === 'leaderboard' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400'">
           <icon-board size="22" :stroke-width="activeTab === 'leaderboard' ? 3 : 2" />
           <span class="text-[10px] font-black uppercase tracking-tighter">戰友榜</span>
        </button>
      </nav>
    </div>
  `
};
