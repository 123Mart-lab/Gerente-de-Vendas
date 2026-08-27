import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const storeId = process.env.NUVEMSHOP_STORE_ID;
const accessToken = process.env.NUVEMSHOP_ACCESS_TOKEN;
const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;

async function test() {
  const res = await axios.get(`${API_URL}/products`, { headers: { 'Authentication': `bearer ${accessToken}` } });
  const productId = res.data[0].id;
  
  const payload = {
    seo_title: { pt: "Base Amaciante Concentrada Tuff 900g Fragrância Baby Rende 1" },
    seo_description: { pt: "Compre Base para Amaciante Concentrada Tuff 900g Cheirinho Baby. Rende até 15 litros com processo 100% a frio. Alta fixação e maciez extrema." },
    tags: "base para amaciante, amaciante concentrado tuff, amaciante baby 15 litros, insumos para"
  };
  
  try {
    // Try array
    let putRes2 = await axios.put(`${API_URL}/products/${productId}`, { ...payload, tags: payload.tags.split(',').map(t => t.trim()) }, { headers: { 'Authentication': `bearer ${accessToken}` } });
    console.log('Array tags:', putRes2.data.tags);
  } catch (err: any) {
    console.log("Error:", err.response?.data);
  }
}
test();
