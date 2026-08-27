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
    seo_title: { pt: "NEW TITLE 123" },
    seo_description: { pt: "NEW DESC 123" },
    tags: "string tags 1, string tags 2" // This is a string, which we know gets ignored
  };
  
  try {
    let putRes = await axios.put(`${API_URL}/products/${productId}`, payload, { headers: { 'Authentication': `bearer ${accessToken}` } });
    console.log('seo_title:', putRes.data.seo_title);
    console.log('seo_description:', putRes.data.seo_description);
    console.log('tags:', putRes.data.tags);
  } catch (err: any) {
    console.log("Error:", err.response?.data);
  }
}
test();
