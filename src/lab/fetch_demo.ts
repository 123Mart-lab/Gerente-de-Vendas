import 'dotenv/config';
import { firebaseService } from '../services/firebase.js';
import axios from 'axios';

async function run() {
  console.log('⏳ Conectando ao Banco de Dados e buscando Token...');
  try {
    const creds = await firebaseService.getNuvemshopCredentials();
    if (!creds) {
      console.log('❌ Nenhuma credencial encontrada no Firestore. O app não foi instalado.');
      return;
    }
    
    const { storeId, accessToken } = creds;
    console.log(`✅ Conectado com sucesso na Loja ID: ${storeId}`);
    console.log('⏳ Puxando lista de produtos da Nuvemshop...');
    
    const response = await axios.get(`https://api.nuvemshop.com.br/v1/${storeId}/products`, {
      headers: {
        'Authentication': `bearer ${accessToken}`,
        'User-Agent': '123Mart AI Assistant (marcus.solidez@gmail.com)'
      }
    });
    
    const products = response.data;
    if (products.length > 0) {
      console.log('\n--- 📦 PRIMEIRO PRODUTO ENCONTRADO ---');
      console.log(`ID: ${products[0].id}`);
      console.log(`Nome: ${products[0].name?.pt || products[0].name}`);
      console.log(`Descrição: ${products[0].description?.pt ? 'Possui descrição' : 'Vazia'}`);
      console.log(`Preço: R$ ${products[0].variants[0]?.price}`);
      console.log(`Estoque: ${products[0].variants[0]?.stock}`);
      console.log('--------------------------------------\n');
    } else {
      console.log('\n⚠️ [LOJA VAZIA] Nenhum produto cadastrado nesta loja.');
      console.log('Dica: Como esta é uma Loja Demo nova, você precisa ir no painel dela e cadastrar pelo menos 1 produto de teste!\n');
    }
  } catch (err: any) {
    console.error('❌ Erro na API:', err?.response?.data || err.message);
  }
  process.exit(0);
}
run();
