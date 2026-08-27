import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI();
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: "Hello" }] }]
    });
    console.log("2.5-flash success:", response.text);
  } catch (err: any) {
    console.log("2.5-flash error:", err.status, err.message);
  }
}
test();
