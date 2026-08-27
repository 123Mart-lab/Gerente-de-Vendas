import axios from 'axios';

async function test() {
  const payload = {
    productId: 319008697,
    data: {
      novoTitulo: "Base Amaciante Tuff AI Test",
      metaDescription: "Test Meta Description via backend",
      novoTituloSeo: "Test SEO Title via backend",
      tags: "tag backend 1, tag backend 2"
    }
  };
  
  try {
    const res = await axios.post('http://localhost:3000/api/marketing/save', payload);
    console.log("Save Response:", res.data);
  } catch (err: any) {
    console.log("Error:", err.response?.data || err.message);
  }
}
test();
