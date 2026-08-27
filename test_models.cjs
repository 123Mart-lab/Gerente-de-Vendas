const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const models = ['gemini-1.5-pro', 'gemini-1.5-pro-latest', 'gemini-2.0-pro-exp-02-05', 'gemini-pro'];
  for (const model of models) {
    try {
      await ai.models.generateContent({ model, contents: 'hello' });
      console.log(`${model} WORKS`);
    } catch(e) {
      console.error(`${model} ERROR:`, e.message);
    }
  }
}
test();
