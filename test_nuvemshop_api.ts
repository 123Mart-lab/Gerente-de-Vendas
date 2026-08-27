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
    const putRes = await axios.put(`${API_URL}/products/${productId}`, {
      tags: "tag a, tag b, tag c"
    }, { headers: { 'Authentication': `bearer ${accessToken}` } });
    console.log('PUT tags as string -> result tags:', JSON.stringify(putRes.data.tags));
  } catch(e: any) { console.log(e.response?.data) }
}
test();
