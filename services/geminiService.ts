
import { GoogleGenAI } from "@google/genai";
import { WeeklyReport } from "../types";

export const getWeeklyAIAnalysis = async (report: WeeklyReport) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `
      你是一位專門輔導「消防設備士」考試的導師。
      請針對以下考生的週報提供 200 字內的溫暖回饋與專業建議：

      姓名：${report.userName}
      本週總時數：${report.totalHours} 小時
      完成率：${report.completionRate}%
      最卡關的觀念：${report.unfamiliarConcepts}
      已嘗試解法：${report.attemptedSolutions}
      落差原因：${report.gapReason}

      請包含：
      1. 具體鼓勵（針對時數與努力程度）。
      2. 專業點撥（針對「最卡關觀念」，如水系統計算、火警分區、法規背誦技巧等）。
      3. 策略調整建議（針對「落差原因」）。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    return "分析進度時發生小錯誤，但你的努力我們都看到了！繼續保持！";
  }
};
