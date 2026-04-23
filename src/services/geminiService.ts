import { GoogleGenAI } from "@google/genai";
import { EditorProfile, Word } from "../types";

export async function processCommand(command: string, history: { role: string; content: string }[], apiKey: string) {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: `You are an AI Video Editor assistant named Lumina. 
        You help users edit videos via a text-based interface.
        Current profiles available: YOUTUBER, REELS, CLASSROOM.
        
        Rules:
        - If the user asks to "cut silence", "remove errors", or similar, confirm you've identified them.
        - Suggest specific formatting based on profiles (e.g., 9:16 for REELS).
        - Be concise, like a technical tool.
        
        Chat History:
        ${history.map(h => `${h.role}: ${h.content}`).join('\n')}
        
        New Command: ${command}` }]
      }
    ]
  });

  return response.text;
}

export async function analyzeTranscript(text: string): Promise<Word[]> {
  // Simulating AI analysis of transcription with timestamps
  const words = text.split(' ');
  return words.map((w, i) => ({
    id: `word-${i}`,
    text: w,
    start: i * 0.5,
    end: (i + 1) * 0.5,
    isRemoved: false,
    type: i % 10 === 0 ? 'silence' : 'normal' // Mocking some silences
  }));
}
