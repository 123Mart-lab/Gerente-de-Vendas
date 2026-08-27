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
    name: { pt: "NEW NAME 1" },
    seo_title: { pt: "NEW SEO TITLE 1" },
    seo_description: { pt: "NEW SEO DESC 1" },
  };
  
  try {
    let putRes = await axios.put(`${API_URL}/products/${productId}`, payload, { headers: { 'Authentication': `bearer ${accessToken}` } });
    console.log('seo_title:', putRes.data.seo_title);
    console.log('seo_description:', putRes.data.seo_description);
    console.log('name:', putRes.data.name);
  } catch (err: any) {
    console.log("Error:", err.response?.data);
  }
}
test();
