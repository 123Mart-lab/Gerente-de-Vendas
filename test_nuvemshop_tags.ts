import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const storeId = process.env.NUVEMSHOP_STORE_ID;
const accessToken = process.env.NUVEMSHOP_ACCESS_TOKEN;
const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;

async function test() {
  const res = await axios.get(`${API_URL}/products`, { headers: { 'Authentication': `bearer ${accessToken}` } });
  const productId = res.data[0].id;
  
  await axios.put(`${API_URL}/products/${productId}`, { tags: "apple, banana" }, { headers: { 'Authentication': `bearer ${accessToken}` } });
  
  // fetch again
  const res2 = await axios.get(`${API_URL}/products/${productId}`, { headers: { 'Authentication': `bearer ${accessToken}` } });
  console.log("After string update:", res2.data.tags);
}
test();
