const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: 'hello'
    });
    console.log('2.5-pro WORKS');
  } catch(e) { console.error('2.5-pro ERROR:', e.message); }
  
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'hello'
    });
    console.log('3.6-flash WORKS');
  } catch(e) { console.error('3.6-flash ERROR:', e.message); }
}
test();
