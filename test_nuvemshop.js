const axios = require('axios');
async function test() {
  try {
    const response = await axios.get('https://api.nuvemshop.com.br/v1/4383282/products?per_page=1', {
      headers: { 'Authentication': 'bearer e48a6fe264977e2f014a55a721ade6198576280d', 'User-Agent': '123Mart AI Assistant' }
    });
    console.log('SUCCESS', response.data.length);
  } catch (err) {
    console.error('ERROR', err.response ? err.response.data : err.message);
  }
}
test();
