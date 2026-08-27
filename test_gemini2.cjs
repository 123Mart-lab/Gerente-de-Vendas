const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-pro',
      contents: 'hello'
    });
    console.log('3.6-pro WORKS');
  } catch(e) { console.error('3.6-pro ERROR:', e.message); }
  
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: 'hello'
    });
    console.log('3.1-pro-preview WORKS');
  } catch(e) { console.error('3.1-pro-preview ERROR:', e.message); }
}
test();
