const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    // The @google/genai package uses a different method for listing models
    // Let's just try to call the REST API directly or use the new SDK method if possible.
    const fetch = require('node-fetch');
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await res.json();
    console.log(data.models.map(m => m.name).join('\n'));
  } catch(e) { console.error(e); }
}
run();
