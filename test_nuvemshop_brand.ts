import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const storeId = process.env.NUVEMSHOP_STORE_ID;
const accessToken = process.env.NUVEMSHOP_ACCESS_TOKEN;
const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;

async function test() {
  const res = await axios.get(`${API_URL}/products`, { headers: { 'Authentication': `bearer ${accessToken}` } });
  const productId = res.data[0].id;
  
  try {
    let putRes = await axios.put(`${API_URL}/products/${productId}`, { brand: "Tuff" }, { headers: { 'Authentication': `bearer ${accessToken}` } });
    console.log('Brand updated:', putRes.data.brand);
  } catch (err: any) {
    console.log("Error:", err.response?.data);
  }
}
test();
