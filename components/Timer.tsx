
import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Coffee, BookOpen, RotateCcw } from 'lucide-react';
import { POMODORO_WORK_TIME, POMODORO_BREAK_TIME } from '../constants';

interface TimerProps {
  onSessionComplete: (minutes: number) => void;
}

const Timer: React.FC<TimerProps> = ({ onSessionComplete }) => {
  const [timeLeft, setTimeLeft] = useState(POMODORO_WORK_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  // Fix: Use ReturnType<typeof setInterval> to avoid NodeJS namespace issues in browser environment
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(POMODORO_WORK_TIME);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (!isBreak) {
        onSessionComplete(Math.floor(POMODORO_WORK_TIME / 60));
        setIsBreak(true);
        setTimeLeft(POMODORO_BREAK_TIME);
        alert("完成一節讀書！休息一下吧。");
      } else {
        setIsBreak(false);
        setTimeLeft(POMODORO_WORK_TIME);
        alert("休息結束，準備下一節學習！");
      }
      setIsActive(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, isBreak, onSessionComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? (1 - timeLeft / POMODORO_BREAK_TIME) * 100 
    : (1 - timeLeft / POMODORO_WORK_TIME) * 100;

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center max-w-md mx-auto">
      <div className="mb-6 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full font-medium">
        {isBreak ? <Coffee size={18} /> : <BookOpen size={18} />}
        <span>{isBreak ? '休息時間' : '專注學習中'}</span>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* SVG Progress Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-100"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={754}
            strokeDashoffset={754 - (754 * progress) / 100}
            className={`${isBreak ? 'text-green-500' : 'text-blue-600'} transition-all duration-1000 ease-linear`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-bold tracking-tighter text-gray-800">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="mt-10 flex gap-4">
        <button
          onClick={toggleTimer}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform active:scale-95 ${
            isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isActive ? <Square fill="white" size={24} /> : <Play fill="white" size={24} className="ml-1" />}
        </button>
        <button
          onClick={resetTimer}
          className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 shadow transition-all transform active:scale-95"
        >
          <RotateCcw size={24} />
        </button>
      </div>

      <p className="mt-8 text-sm text-gray-400 text-center leading-relaxed">
        每次專注 25 分鐘，休息 5 分鐘。<br/>
        系統會自動累計本週投入時間。
      </p>
    </div>
  );
};

export default Timer;
