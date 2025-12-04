import { GoogleGenAI } from "@google/genai";
import { Project, TaskStatus } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize safely. If no key, we will handle it gracefully in the UI.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const analyzeProjectProgress = async (project: Project): Promise<string> => {
  if (!ai) {
    return "请配置 Gemini API Key 以使用智能分析功能。";
  }

  const completedCount = project.items.filter(i => i.status === TaskStatus.COMPLETED).length;
  const inProgressCount = project.items.filter(i => i.status === TaskStatus.IN_PROGRESS).length;
  
  const prompt = `
    你是一位资深的设计项目经理。请根据以下项目数据生成一份简短、专业且带有鼓励性质的进度分析报告（中文）。
    
    项目名称: ${project.name}
    总体进度: ${completedCount}/10 项已完成
    进行中: ${inProgressCount} 项
    
    详细任务状态:
    ${project.items.map(item => `- ${item.type}: ${item.status} (负责人: ${item.assignee || '未分配'})`).join('\n')}
    
    请包含：
    1. 总体进度评价。
    2. 风险提示（如果有任务长期未动或关键任务如视频未完成）。
    3. 下一步建议。
    4. 保持语气轻松但专业。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "无法生成分析报告。";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "智能分析服务暂时不可用，请稍后再试。";
  }
};