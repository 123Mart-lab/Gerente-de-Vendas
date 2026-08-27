const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    await ai.models.generateContent({ model: 'gemini-pro-latest', contents: 'hello' });
  } catch (err) {
    console.error('Erro na geração de SEO:', err);
  }
}
run();
