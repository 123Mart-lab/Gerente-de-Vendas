import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI();
async function test() {
  const models = await ai.models.list();
  for await (const m of models) {
    if (m.name.includes('flash') || m.name.includes('pro')) {
      console.log(m.name);
    }
  }
}
test();
