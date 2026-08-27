const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const modelsToTest = ['gemini-pro-latest', 'gemini-3.1-pro-preview', 'gemini-2.5-pro'];
  for(const m of modelsToTest) {
    try {
      await ai.models.generateContent({ model: m, contents: 'hello' });
      console.log(m + ' WORKS');
    } catch(e) {
      console.error(m + ' ERROR', e.message);
    }
  }
}
run();
