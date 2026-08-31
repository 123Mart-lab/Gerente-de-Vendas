import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

async function checkNuvemshopSEO() {
  const storeId = process.env.NUVEMSHOP_STORE_ID;
  const token = process.env.NUVEMSHOP_ACCESS_TOKEN;
  
  if (!storeId || !token) {
    console.error("Missing NUVEMSHOP_STORE_ID or NUVEMSHOP_ACCESS_TOKEN");
    return;
  }

  const cleanStoreId = storeId.replace(/[^0-9]/g, '');
  const cleanToken = token.replace(/[^a-zA-Z0-9]/g, '');

  let page = 1;
  let totalProducts = 0;
  let productsBelow70 = 0;

  console.log("Buscando produtos da Nuvemshop...");

  while (true) {
    try {
      const response = await axios.get(`https://api.nuvemshop.com.br/v1/${cleanStoreId}/products?page=${page}&per_page=50`, {
        headers: {
          'Authentication': `bearer ${cleanToken}`,
          'User-Agent': 'AI Studio (contact@example.com)'
        }
      });
      
      const products = response.data;
      if (!products || products.length === 0) break;

      totalProducts += products.length;

      for (const product of products) {
        // Evaluate if product exists
        if (!product) continue;
        
        let score = 0;
        let checks = 0;
        let passed = 0;

        const title = product.seo_title || product.name?.pt || product.name || '';
        const description = product.seo_description || '';
        
        checks++;
        if (title.length >= 40) passed++;

        checks++;
        if (!title.includes('!!!!') && !title.includes('....')) passed++;

        checks++;
        if (description.length >= 50) passed++;

        checks++;
        const hasDesc = product.description?.pt || product.description;
        if (hasDesc && hasDesc.length > 50) passed++;

        const finalScore = Math.round((passed / checks) * 100);

        if (finalScore < 70) {
          productsBelow70++;
          console.log(`- ID: ${product.id} | Score: ${finalScore}% | Nome: ${title}`);
        }
      }

      page++;
    } catch (err: any) {
      console.error("Erro na API da Nuvemshop", err.response?.data || err.message);
      break;
    }
  }

  console.log(`\nTotal de produtos analisados: ${totalProducts}`);
  console.log(`Total de produtos com SEO < 70%: ${productsBelow70}`);
}

checkNuvemshopSEO();
