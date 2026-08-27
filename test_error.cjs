const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    await ai.models.generateContent({ model: 'gemini-pro-latest', contents: 'hello' });
  } catch (err) {
    console.log("MESSAGE:", err.message);
    console.log("KEYS:", Object.keys(err));
    console.log("STATUS:", err.status);
  }
}
run();
