const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    await ai.models.generateContent({ model: 'gemini-pro-latest', contents: 'hello' });
  } catch (err) {
    if (err.message?.includes('429') || err.message?.includes('Quota')) {
      console.log('CAUGHT 429');
    } else {
      console.log('DID NOT CATCH 429. Message is:', err.message);
    }
  }
}
run();
