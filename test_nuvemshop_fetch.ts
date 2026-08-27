import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const storeId = process.env.NUVEMSHOP_STORE_ID;
const accessToken = process.env.NUVEMSHOP_ACCESS_TOKEN;
const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;

async function test() {
  const res = await axios.get(`${API_URL}/products`, { headers: { 'Authentication': `bearer ${accessToken}` } });
  for (const p of res.data) {
    if (p.name && p.name.pt && p.name.pt.includes("Tuff")) {
      console.log("Found product:", p.id);
      console.log("Name:", p.name.pt);
      console.log("seo_title:", p.seo_title);
      console.log("seo_description:", p.seo_description);
      console.log("tags:", p.tags);
    }
  }
}
test();
