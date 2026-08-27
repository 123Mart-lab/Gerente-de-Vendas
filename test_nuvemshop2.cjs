require('dotenv').config();
const axios = require('axios');
async function test() {
  const token = process.env.NUVEMSHOP_ACCESS_TOKEN;
  console.log("Token length:", token ? token.length : 0);
  console.log("Token bytes:", token ? Buffer.from(token).join(',') : '');
  try {
    const response = await axios.get('https://api.nuvemshop.com.br/v1/' + process.env.NUVEMSHOP_STORE_ID + '/products?per_page=1', {
      headers: { 'Authentication': 'bearer ' + token, 'User-Agent': '123Mart AI Assistant' }
    });
    console.log('SUCCESS', response.data.length);
  } catch (err) {
    console.error('ERROR', err.response ? err.response.data : err.message);
  }
}
test();
