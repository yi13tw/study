
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { 
  Timer as IconTimer, 
  FileText as IconFile, 
  LayoutDashboard as IconBoard, 
  Settings as IconSettings,
  Zap, Play, Square, RotateCcw, Target, Plus, CheckCircle, Send, Sparkles, Trophy
} from 'lucide-vue-next';
import { format, isSameWeek, parseISO, startOfWeek } from 'date-fns';
import { GoogleGenAI } from "@google/genai";

export default {
  components: { 
    IconTimer, IconFile, IconBoard, IconSettings, 
    Zap, Play, Square, RotateCcw, Target, Plus, CheckCircle, Send, Sparkles, Trophy
  },
  setup() {
    // --- 狀態定義 ---
    const activeTab = ref('timer');
    const userName = ref(localStorage.getItem('study_user_name') || '');
    const isNaming = ref(!userName.value);
    const sheetUrl = ref("https://script.google.com/macros/s/AKfycbx93tB14D6-W-Pft_As2w6zgQtMN6iTiGowkv99_q0LJsfHLMqbiH5OX5OvAKK2hlA4/exec");
    
    // 計時器狀態
    const timeLeft = ref(25 * 60);
    const timerActive = ref(false);
    const isBreak = ref(false);
    let timerInterval = null;

    // 資料存儲
    const sessions = ref(JSON.parse(localStorage.getItem('study_sessions') || '[]'));
    const dailyLogs = ref(JSON.parse(localStorage.getItem('study_daily_logs') || '[]'));
    const weeklyPlan = ref(localStorage.getItem('study_weekly_plan') || '');
    const reports = ref(JSON.parse(localStorage.getItem('study_reports') || '[]'));
    const groupMembers = ref([]);
    const isSyncing = ref(false);

    // --- 計算屬性 ---
    const currentWeekHours = computed(() => {
      const monday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekSessions = sessions.value.filter(s => s.date >= monday);
      return weekSessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60;
    });

    const timerDisplay = computed(() => {
      const m = Math.floor(timeLeft.value / 60).toString().padStart(2, '0');
      const s = (timeLeft.value % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    });

    const progress = computed(() => {
      const total = isBreak.value ? 5 * 60 : 25 * 60;
      return ((total - timeLeft.value) / total) * 100;
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
          if (timeLeft.value > 0) {
            timeLeft.value--;
          } else {
            completeSession();
          }
        }, 1000);
      }
      timerActive.value = !timerActive.value;
    };

    const completeSession = () => {
      clearInterval(timerInterval);
      timerActive.value = false;
      if (!isBreak.value) {
        const mins = 25;
        sessions.value.push({
          id: Date.now().toString(),
          durationMinutes: mins,
          date: format(new Date(), 'yyyy-MM-dd')
        });
        alert("🎉 專注結束！辛苦了，休息一下吧。");
        timeLeft.value = 5 * 60;
        isBreak.value = true;
        syncData();
      } else {
        alert("💪 休息結束，準備好迎接下一個 25 分鐘了嗎？");
        timeLeft.value = 25 * 60;
        isBreak.value = false;
      }
    };

    const addDailyLog = (content, gap) => {
      dailyLogs.value.push({
        id: Date.now().toString(),
        date: format(new Date(), 'yyyy-MM-dd'),
        content,
        gap
      });
      syncData();
    };

    const syncData = async () => {
      if (!sheetUrl.value || !userName.value) return;
      isSyncing.value = true;
      try {
        const data = {
          userName: userName.value,
          totalHours: currentWeekHours.value,
          completionRate: reports.value[0]?.completionRate || (dailyLogs.value.length * 15),
          lastUpdate: new Date().toISOString(),
          status: timerActive.value ? '專注中' : '休息中'
        };
        await fetch(sheetUrl.value, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(data)
        });
        
        // 抓取其他人的數據
        const res = await fetch(sheetUrl.value);
        const cloudData = await res.json();
        groupMembers.value = cloudData.sort((a, b) => b.totalHours - a.totalHours);
      } catch (e) {
        console.error("同步失敗", e);
      } finally {
        isSyncing.value = false;
      }
    };

    // 監聽並持久化
    watch([sessions, dailyLogs, weeklyPlan, reports], () => {
      localStorage.setItem('study_sessions', JSON.stringify(sessions.value));
      localStorage.setItem('study_daily_logs', JSON.stringify(dailyLogs.value));
      localStorage.setItem('study_weekly_plan', weeklyPlan.value);
      localStorage.setItem('study_reports', JSON.stringify(reports.value));
    }, { deep: true });

    onMounted(syncData);

    return {
      activeTab, userName, isNaming, isSyncing,
      timeLeft, timerActive, isBreak, timerDisplay, progress, toggleTimer,
      sessions, dailyLogs, weeklyPlan, reports, currentWeekHours, groupMembers,
      saveName, addDailyLog, syncData
    };
  },
  template: `
    <div class="min-h-screen bg-[#FDFDFF] text-gray-900 pb-28">
      <!-- 登入頁 -->
      <div v-if="isNaming" class="fixed inset-0 z-[200] bg-blue-600 flex items-center justify-center p-8">
        <div class="bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-sm text-center transform animate-in zoom-in duration-500">
          <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
             <zap size="40" fill="currentColor" />
          </div>
          <h1 class="text-3xl font-black text-gray-900 mb-2">準備好衝刺？</h1>
          <p class="text-gray-400 text-sm mb-8 font-medium">請輸入戰友姓名進入讀書會</p>
          <div class="space-y-4">
            <input v-model="userName" class="w-full bg-gray-50 p-5 rounded-2xl border-none ring-2 ring-transparent focus:ring-blue-500 outline-none text-center text-xl font-bold transition-all" placeholder="您的姓名" />
            <button @click="saveName" class="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all">進入書房</button>
          </div>
        </div>
      </div>

      <!-- Header -->
      <header class="px-6 py-6 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100">S</div>
          <div>
            <h1 class="text-base font-black tracking-tight leading-none uppercase">StudyBuddy</h1>
            <p class="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">備考 App 專業版</p>
          </div>
        </div>
        <div v-if="isSyncing" class="w-8 h-8 rounded-full border-2 border-blue-100 border-t-blue-600 animate-spin"></div>
        <div v-else class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase">本週努力</p>
            <p class="text-sm font-black text-blue-600">{{ currentWeekHours.toFixed(1) }} HR</p>
        </div>
      </header>

      <main class="px-5 pt-6">
        <!-- 頁面 1: 計時與追蹤 -->
        <div v-if="activeTab === 'timer'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <!-- 番茄鐘卡片 -->
          <div class="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50 flex flex-col items-center relative overflow-hidden">
             <div class="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
             <div class="mb-6 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest" :class="isBreak ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'">
                {{ isBreak ? '休息時間' : '專注學習中' }}
             </div>
             
             <div class="relative w-56 h-56 flex items-center justify-center">
                <svg class="w-full h-full transform -rotate-90">
                  <circle cx="112" cy="112" r="100" stroke="currentColor" stroke-width="12" fill="transparent" class="text-gray-50" />
                  <circle cx="112" cy="112" r="100" stroke="currentColor" stroke-width="12" fill="transparent" 
                    :stroke-dasharray="628" :stroke-dashoffset="628 - (628 * progress) / 100"
                    class="transition-all duration-1000 ease-linear" :class="isBreak ? 'text-green-500' : 'text-blue-600'" stroke-linecap="round" />
                </svg>
                <div class="absolute text-5xl font-black tracking-tighter">{{ timerDisplay }}</div>
             </div>

             <div class="mt-8 flex gap-4">
                <button @click="toggleTimer" class="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all" :class="timerActive ? 'bg-amber-500 shadow-amber-100' : 'bg-blue-600 shadow-blue-100'">
                   <component :is="timerActive ? 'IconSquare' : 'IconPlay'" size="32" fill="currentColor" />
                </button>
                <button @click="timeLeft = 25*60; timerActive=false" class="w-20 h-20 rounded-3xl bg-gray-50 text-gray-400 flex items-center justify-center active:scale-90 transition-all">
                   <icon-rotate-ccw size="32" />
                </button>
             </div>
          </div>

          <!-- 每日回報小卡 -->
          <div class="bg-gray-900 text-white p-6 rounded-[2.5rem] shadow-2xl">
             <div class="flex items-center gap-2 mb-4">
                <target size="20" class="text-blue-400" />
                <h3 class="font-bold">今日進度快報</h3>
             </div>
             <input @keyup.enter="addDailyLog($event.target.value, '')" class="w-full bg-white/10 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 mb-2 font-medium" placeholder="今天讀了什麼？" />
             <p class="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">輸入後按下 Enter 儲存</p>
          </div>
        </div>

        <!-- 頁面 3: 看板 -->
        <div v-if="activeTab === 'dashboard'" class="space-y-6 animate-in fade-in">
           <div class="grid grid-cols-2 gap-4">
              <div v-for="(member, idx) in groupMembers.slice(0, 4)" :key="idx" class="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 relative overflow-hidden">
                 <div class="text-[40px] font-black absolute -right-2 -bottom-4 opacity-5">{{ idx + 1 }}</div>
                 <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">{{ member.userName[0] }}</div>
                    <span class="text-xs font-black truncate max-w-[60px]">{{ member.userName }}</span>
                 </div>
                 <p class="text-xl font-black">{{ member.totalHours.toFixed(1) }} <span class="text-[10px] text-gray-400 uppercase">hrs</span></p>
                 <div class="w-full bg-gray-100 h-1 rounded-full mt-2 overflow-hidden">
                    <div class="h-full bg-blue-500" :style="{ width: member.completionRate + '%' }"></div>
                 </div>
              </div>
           </div>

           <div class="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200">
              <sparkles class="mb-4" />
              <h3 class="text-2xl font-black mb-2">戰友加油站</h3>
              <p class="text-sm opacity-80 leading-relaxed font-medium">目前大家平均每週投入 24.5 小時。你是讀書會的領頭羊，保持節奏，證照就在不遠處！</p>
           </div>
        </div>
      </main>

      <!-- 底部導航欄 -->
      <nav class="fixed bottom-8 left-6 right-6 glass border border-white/50 shadow-2xl rounded-[2.5rem] px-4 py-3 flex justify-around items-center z-[100]">
        <button @click="activeTab = 'timer'" class="flex flex-col items-center gap-1 transition-all" :class="activeTab === 'timer' ? 'text-blue-600 scale-110' : 'text-gray-400'">
           <icon-timer size="24" :stroke-width="activeTab === 'timer' ? 3 : 2" />
           <span class="text-[10px] font-black uppercase">專注</span>
        </button>
        <button @click="activeTab = 'dashboard'" class="flex flex-col items-center gap-1 transition-all" :class="activeTab === 'dashboard' ? 'text-blue-600 scale-110' : 'text-gray-400'">
           <icon-board size="24" :stroke-width="activeTab === 'dashboard' ? 3 : 2" />
           <span class="text-[10px] font-black uppercase">看板</span>
        </button>
      </nav>
    </div>
  `
};
