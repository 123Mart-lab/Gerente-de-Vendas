const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    await ai.models.generateContent({ model: 'gemini-pro-latest', contents: 'hello' });
  } catch (err) {
    console.log("type of err.message:", typeof err.message);
    console.log("err.message includes 429?", err.message?.includes('429'));
    console.log("err.message includes Quota?", err.message?.includes('Quota'));
  }
}
run();
