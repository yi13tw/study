
import { ref, computed, onMounted, watch } from 'vue';
import { 
  Timer as IconTimer, 
  FileText as IconFile, 
  LayoutDashboard as IconBoard, 
  Zap, Play, Square, RotateCcw, Target, Send, Sparkles, Trophy, Plus, CheckCircle
} from 'lucide-vue-next';
import { format, startOfWeek, isSameWeek, parseISO } from 'date-fns';
import { getWeeklyAIAnalysis } from './services/geminiService';

export default {
  components: { 
    IconTimer, IconFile, IconBoard, Zap, Play, Square, RotateCcw, Target, Send, Sparkles, Trophy, Plus, CheckCircle
  },
  setup() {
    const activeTab = ref('timer');
    const userName = ref(localStorage.getItem('study_user_name') || '');
    const isNaming = ref(!userName.value);
    const sheetUrl = "https://script.google.com/macros/s/AKfycbx93tB14D6-W-Pft_As2w6zgQtMN6iTiGowkv99_q0LJsfHLMqbiH5OX5OvAKK2hlA4/exec";

    // --- 數據狀態 ---
    const sessions = ref(JSON.parse(localStorage.getItem('study_sessions') || '[]'));
    const dailyLogs = ref(JSON.parse(localStorage.getItem('study_daily_logs') || '[]'));
    const reports = ref(JSON.parse(localStorage.getItem('study_reports') || '[]'));
    const weeklyPlan = ref(localStorage.getItem('study_weekly_plan') || '例：讀完水系統消防安全設備、做100題考古題');
    const groupMembers = ref([]);
    const isSyncing = ref(false);
    const isAnalyzing = ref(false);

    // --- 計時器狀態 ---
    const timeLeft = ref(25 * 60);
    const timerActive = ref(false);
    const isBreak = ref(false);
    let timerInterval = null;

    // --- 週報填寫狀態 ---
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
    
    const currentWeekHours = computed(() => {
      const weekSessions = sessions.value.filter(s => s.date >= currentWeekStart.value);
      return weekSessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60;
    });

    const timerDisplay = computed(() => {
      const m = Math.floor(timeLeft.value / 60).toString().padStart(2, '0');
      const s = (timeLeft.value % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    });

    const timerProgress = computed(() => {
      const total = isBreak.value ? 5 * 60 : 25 * 60;
      return ((total - timeLeft.value) / total) * 100;
    });

    // --- 方法 ---
    const startApp = () => {
      if(userName.value.trim()) {
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
          if (timeLeft.value > 0) {
            timeLeft.value--;
          } else {
            finishTimer();
          }
        }, 1000);
      }
      timerActive.value = !timerActive.value;
    };

    const finishTimer = () => {
      clearInterval(timerInterval);
      timerActive.value = false;
      if (!isBreak.value) {
        sessions.value.push({ id: Date.now().toString(), durationMinutes: 25, date: format(new Date(), 'yyyy-MM-dd') });
        alert("🎉 專注完成！累積 25 分鐘時數。");
        timeLeft.value = 5 * 60;
        isBreak.value = true;
      } else {
        alert("💪 休息結束，準備下一場戰鬥！");
        timeLeft.value = 25 * 60;
        isBreak.value = false;
      }
      syncData();
    };

    const addDailyLog = (e) => {
      const content = e.target.value.trim();
      if(!content) return;
      dailyLogs.value.push({ id: Date.now().toString(), date: format(new Date(), 'yyyy-MM-dd'), content, gap: '' });
      e.target.value = '';
      syncData();
    };

    const submitWeeklyReport = async () => {
      isAnalyzing.value = true;
      const actualProgress = dailyLogs.value
        .filter(l => l.date >= currentWeekStart.value)
        .map(l => `[${l.date}] ${l.content}`)
        .join('\n');

      const fullReport = {
        id: Date.now().toString(),
        userName: userName.value,
        weekStart: currentWeekStart.value,
        totalHours: currentWeekHours.value,
        plannedProgress: weeklyPlan.value,
        actualProgress,
        gapReason: reportForm.value.completionRate < 100 ? "進度稍有落後" : "準時完成",
        ...reportForm.value,
        createdAt: new Date().toISOString()
      };

      const feedback = await getWeeklyAIAnalysis(fullReport);
      fullReport.aiFeedback = feedback;
      
      reports.value = [fullReport, ...reports.value];
      alert("✅ 週報已送出並同步至讀書會試算表！");
      isAnalyzing.value = false;
      activeTab.value = 'dashboard';
      syncData();
    };

    const syncData = async () => {
      if (!userName.value) return;
      isSyncing.value = true;
      try {
        // 同步自己的狀態
        await fetch(sheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({
            userName: userName.value,
            totalHours: currentWeekHours.value,
            completionRate: reportForm.value.completionRate,
            lastUpdate: new Date().toISOString(),
            status: timerActive.value ? '專注中' : '休息中'
          })
        });
        
        // 獲取戰友榜
        const res = await fetch(sheetUrl);
        const data = await res.json();
        groupMembers.value = data.sort((a, b) => b.totalHours - a.totalHours);
      } catch (e) {
        console.error("同步失敗", e);
      } finally {
        isSyncing.value = false;
      }
    };

    watch([sessions, dailyLogs, reports, weeklyPlan], () => {
      localStorage.setItem('study_sessions', JSON.stringify(sessions.value));
      localStorage.setItem('study_daily_logs', JSON.stringify(dailyLogs.value));
      localStorage.setItem('study_reports', JSON.stringify(reports.value));
      localStorage.setItem('study_weekly_plan', weeklyPlan.value);
    }, { deep: true });

    onMounted(syncData);

    return {
      activeTab, userName, isNaming, isSyncing, isAnalyzing,
      timeLeft, timerActive, isBreak, timerDisplay, timerProgress, toggleTimer,
      sessions, dailyLogs, reports, weeklyPlan, currentWeekHours, groupMembers,
      reportForm, addDailyLog, submitWeeklyReport, startApp
    };
  },
  template: `
    <div class="min-h-screen bg-[#FDFDFF] text-slate-900 pb-32">
      <!-- 歡迎頁面 -->
      <div v-if="isNaming" class="fixed inset-0 z-[200] bg-blue-600 flex items-center justify-center p-8">
        <div class="bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-sm text-center transform animate-in zoom-in duration-500">
          <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
             <icon-timer size="40" stroke-width="3" />
          </div>
          <h1 class="text-3xl font-black mb-2 tracking-tight">消防備考戰友榜</h1>
          <p class="text-slate-400 text-sm mb-8 font-medium">輸入姓名，開始累積本週投入時數</p>
          <div class="space-y-4">
            <input v-model="userName" @keyup.enter="startApp" class="w-full bg-slate-50 p-5 rounded-2xl border-none ring-2 ring-transparent focus:ring-blue-500 outline-none text-center text-xl font-bold transition-all" placeholder="您的姓名" />
            <button @click="startApp" class="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all">進入讀書會</button>
          </div>
        </div>
      </div>

      <!-- Header -->
      <header class="px-6 py-6 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100 italic">S</div>
          <div>
            <h1 class="text-base font-black tracking-tight leading-none uppercase italic">StudyBuddy</h1>
            <p class="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">消防設備士備考團</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
           <div v-if="isSyncing" class="w-5 h-5 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
           <div class="text-right">
              <p class="text-[10px] text-slate-400 font-bold uppercase">本週累積努力</p>
              <p class="text-sm font-black text-blue-600">{{ currentWeekHours.toFixed(1) }} HR</p>
           </div>
        </div>
      </header>

      <main class="px-5 pt-6 max-w-lg mx-auto">
        <!-- Tab 1: 專注計時 -->
        <div v-if="activeTab === 'timer'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <!-- 規劃卡片 -->
          <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
             <div class="flex items-center gap-2 mb-3 text-blue-600">
                <target size="18" />
                <span class="text-xs font-black uppercase tracking-wider">本週預計規劃</span>
             </div>
             <textarea v-model="weeklyPlan" class="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none text-sm font-medium text-slate-600 focus:ring-2 focus:ring-blue-100 h-24" placeholder="例：讀完水系統消防法規、做考古題..."></textarea>
          </div>

          <!-- 番茄鐘 -->
          <div class="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center relative overflow-hidden">
             <div class="mb-6 px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-sm" :class="isBreak ? 'bg-green-100 text-green-600' : 'bg-blue-600 text-white'">
                {{ isBreak ? '休息中' : '高效專注中' }}
             </div>
             
             <div class="relative w-64 h-64 flex items-center justify-center">
                <svg class="w-full h-full transform -rotate-90">
                  <circle cx="128" cy="128" r="110" stroke="currentColor" stroke-width="12" fill="transparent" class="text-slate-50" />
                  <circle cx="128" cy="128" r="110" stroke="currentColor" stroke-width="12" fill="transparent" 
                    :stroke-dasharray="690" :stroke-dashoffset="690 - (690 * timerProgress) / 100"
                    class="transition-all duration-1000 ease-linear" :class="isBreak ? 'text-green-500' : 'text-blue-600'" stroke-linecap="round" />
                </svg>
                <div class="absolute text-6xl font-black tracking-tighter text-slate-800">{{ timerDisplay }}</div>
             </div>

             <div class="mt-10 flex gap-4">
                <button @click="toggleTimer" class="w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all" :class="timerActive ? 'bg-amber-500 shadow-amber-100' : 'bg-blue-600 shadow-blue-100'">
                   <component :is="timerActive ? 'Square' : 'Play'" size="32" fill="currentColor" />
                </button>
                <button @click="timeLeft = 25*60; timerActive=false" class="w-20 h-20 rounded-[2rem] bg-slate-100 text-slate-400 flex items-center justify-center active:scale-90 transition-all">
                   <rotate-ccw size="32" />
                </button>
             </div>
          </div>

          <!-- 每日回報 -->
          <div class="bg-slate-900 text-white p-7 rounded-[2.5rem] shadow-2xl">
             <h3 class="font-bold mb-4 flex items-center gap-2">
                <plus size="18" class="text-blue-400" />
                今日進度隨手記
             </h3>
             <input @keyup.enter="addDailyLog" class="w-full bg-white/10 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 mb-2 font-medium" placeholder="今天讀了什麼？（Enter 儲存）" />
             <div class="mt-4 space-y-2">
                <div v-for="log in dailyLogs.slice(-2).reverse()" :key="log.id" class="text-xs bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between">
                   <span class="opacity-60">{{ log.date }}</span>
                   <span class="font-bold">{{ log.content }}</span>
                </div>
             </div>
          </div>
        </div>

        <!-- Tab 2: 週日結報 -->
        <div v-if="activeTab === 'report'" class="space-y-6 animate-in fade-in pb-10">
           <div class="bg-blue-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
              <div class="relative z-10">
                <h2 class="text-2xl font-black mb-1">週日結算</h2>
                <p class="text-sm opacity-80 font-medium">總結本週努力，獲取 AI 備考建議</p>
              </div>
              <icon-file class="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
           </div>

           <div class="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
              <!-- 完成率 -->
              <div>
                 <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">本週完成率：{{ reportForm.completionRate }}%</label>
                 <input type="range" v-model="reportForm.completionRate" class="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>

              <!-- 不熟觀念 -->
              <div>
                 <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">本週最不熟的觀念</label>
                 <textarea v-model="reportForm.unfamiliarConcepts" class="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none text-sm font-medium h-24" placeholder="例：水系統消防幫浦配線、火警自動警報設備之電路迴路..."></textarea>
              </div>

              <!-- 嘗試解法 -->
              <div>
                 <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">已嘗試的解法</label>
                 <textarea v-model="reportForm.attemptedSolutions" class="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none text-sm font-medium h-24" placeholder="例：翻看聖經、上 Youtube 找工程影片、在群組問學長..."></textarea>
              </div>

              <!-- 下週策略 -->
              <div>
                 <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">下週調整策略</label>
                 <textarea v-model="reportForm.nextWeekStrategy" class="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none text-sm font-medium h-24" placeholder="例：提早一小時起床讀法規、減少週末休閒..."></textarea>
              </div>

              <!-- 需要支援 -->
              <div class="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                 <input type="checkbox" v-model="reportForm.needsSupport" class="w-6 h-6 rounded-lg accent-blue-600" />
                 <span class="text-sm font-bold text-slate-600">需要讀書會戰友的支援？</span>
              </div>

              <button @click="submitWeeklyReport" :disabled="isAnalyzing" class="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-2">
                 <span v-if="isAnalyzing" class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                 <send v-else size="20" />
                 {{ isAnalyzing ? 'AI 正在分析進度...' : '送出週報並同步雲端' }}
              </button>
           </div>
        </div>

        <!-- Tab 3: 戰友榜 -->
        <div v-if="activeTab === 'dashboard'" class="space-y-6 animate-in fade-in">
           <!-- AI 分析卡片 (如果有) -->
           <div v-if="reports[0]?.aiFeedback" class="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <sparkles size="32" class="mb-4 text-indigo-200" />
              <h3 class="text-xl font-black mb-2">AI 導師回饋</h3>
              <p class="text-sm opacity-90 leading-relaxed font-medium whitespace-pre-wrap">{{ reports[0].aiFeedback }}</p>
           </div>

           <!-- 戰友列表 -->
           <div class="bg-white p-6 rounded-[3rem] shadow-sm border border-slate-100">
              <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <trophy size="14" class="text-amber-500" /> 讀書會投入榜 (本週)
              </h3>
              <div class="space-y-6">
                 <div v-for="(member, idx) in groupMembers" :key="idx" class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xs font-black" :class="idx === 0 ? 'bg-amber-50 text-amber-600' : 'text-slate-400'">
                       {{ idx + 1 }}
                    </div>
                    <div class="flex-1">
                       <div class="flex justify-between mb-1">
                          <span class="text-sm font-black">{{ member.userName }}</span>
                          <span class="text-sm font-black text-blue-600">{{ member.totalHours.toFixed(1) }}h</span>
                       </div>
                       <div class="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                          <div class="bg-blue-600 h-full rounded-full transition-all duration-1000" :style="{ width: (member.totalHours / 40 * 100) + '%' }"></div>
                       </div>
                    </div>
                    <div class="text-[10px] font-black uppercase text-slate-300">{{ member.status }}</div>
                 </div>
              </div>
           </div>
        </div>
      </main>

      <!-- 導航欄 -->
      <nav class="fixed bottom-8 left-6 right-6 bg-white/70 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-[2.5rem] px-4 py-3 flex justify-around items-center z-[100]">
        <button @click="activeTab = 'timer'" class="flex flex-col items-center gap-1 transition-all py-2 px-6 rounded-2xl" :class="activeTab === 'timer' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400'">
           <icon-timer size="22" :stroke-width="activeTab === 'timer' ? 3 : 2" />
           <span class="text-[10px] font-black uppercase">專注</span>
        </button>
        <button @click="activeTab = 'report'" class="flex flex-col items-center gap-1 transition-all py-2 px-6 rounded-2xl" :class="activeTab === 'report' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400'">
           <icon-file size="22" :stroke-width="activeTab === 'report' ? 3 : 2" />
           <span class="text-[10px] font-black uppercase">週報</span>
        </button>
        <button @click="activeTab = 'dashboard'" class="flex flex-col items-center gap-1 transition-all py-2 px-6 rounded-2xl" :class="activeTab === 'dashboard' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400'">
           <icon-board size="22" :stroke-width="activeTab === 'dashboard' ? 3 : 2" />
           <span class="text-[10px] font-black uppercase">戰友</span>
        </button>
      </nav>
    </div>
  `
};
