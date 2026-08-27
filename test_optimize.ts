import axios from 'axios';

async function test() {
  const payload = {
    name: { pt: "Base Amaciante Tuff" },
    price: 50,
    brand: { pt: "Tuff" },
    tags: "amaciante",
    description: { pt: "Base amaciante..." }
  };
  
  try {
    const res = await axios.post('http://localhost:3000/api/marketing/optimize', payload);
    console.log("AI result:", Object.keys(res.data.otimizado));
    console.log("metaDescription present:", !!res.data.otimizado.metaDescription);
    console.log("novoTitulo present:", !!res.data.otimizado.novoTitulo);
  } catch (err: any) {
    console.log("Error:", err.message);
  }
}
test();
