import dotenv from 'dotenv';
dotenv.config();
import { aiService } from './src/services/ai.js';
async function run() {
  try {
    const res = await aiService.generateProductSEO({
      name: 'CONJ DE CHURRASCO EM ACO INOX CABO PLAST LINHA HOME C/2 PCS',
      price: '22.25',
      brand: '',
      tags: '',
      description: '',
      handle: '',
      seo_description: '',
      seo_title: ''
    });
    console.log("SUCCESS:", res);
  } catch(e: any) {
    console.error("ERROR:", e);
  }
}
run();
