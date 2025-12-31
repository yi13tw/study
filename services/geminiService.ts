
import { GoogleGenAI } from "@google/genai";
import { WeeklyReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getWeeklyAIAnalysis = async (report: WeeklyReport) => {
  try {
    const prompt = `
      作為一位資深學習導師，請分析以下讀書會成員的週報，並提供鼓勵與具體建議：
      
      成員：${report.userName}
      本週投入時間：${report.totalHours} 小時
      完成率：${report.completionRate}%
      預計進度：${report.plannedProgress}
      實際進度：${report.actualProgress}
      遇到的困難：${report.gapReason}
      最不熟的觀念：${report.unfamiliarConcepts}
      已嘗試解法：${report.attemptedSolutions}
      下週策略：${report.nextWeekStrategy}
      需要支援：${report.needsSupport ? '是 - ' + report.supportDetail : '否'}

      請以溫暖且具啟發性的語氣回答（約 200 字）：
      1. 對本週努力的肯定
      2. 針對「最不熟觀念」與「落差原因」提供學習建議
      3. 對「下週策略」的回饋
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "分析讀書進度時發生錯誤，請稍後再試。不過沒關係，持續學習就是最好的前進！";
  }
};
