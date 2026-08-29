import axios from 'axios';
async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/marketing/orchestrate-optimization', {
      productId: 'mock-123',
      query: 'faca'
    });
    console.log(res.data);
  } catch (err: any) {
    console.error(err?.response?.data || err.message);
  }
}
test();
