import { GoogleGenAI } from "@google/genai";

export const generateMissionBrief = async (score: number) => {
  if (!process.env.API_KEY) {
    console.warn("No API KEY provided");
    return "Mission: Clean up this mess. Use Arrow keys to move.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are Kana, a cute but tough cyberpunk rabbit cleaner. 
      The player has currently cleaned ${score}% of the room.
      Give a very short (max 15 words), witty, tough one-liner encouraging the player to clean more or congratulating them.
      If score is 0, introduce the mission.
      Tone: Cyberpunk, Cute, Aggressive.`,
    });
    
    const text = response.text;
    return text ? text.trim() : "System Offline.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "System Offline. Manual Override: CLEAN EVERYTHING.";
  }
};