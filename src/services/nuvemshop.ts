import axios from 'axios';
import { firebaseService } from './firebase.js';

export const nuvemshopService = {
  /**
   * Consulta o catálogo de produtos na Nuvemshop por palavra-chave.
   */
  async searchProducts(query: string): Promise<string> {
    try {
      // Busca as credenciais geradas pelo OAuth e salvas no Firebase
      const credentials = await firebaseService.getNuvemshopCredentials();

      if (!credentials) {
        console.warn('⚠️ Credenciais da Nuvemshop não encontradas no Firebase. O App não foi instalado. Retornando Mock Seguro.');
        // MOCK SEGURO para que a IA não quebre no teste
        return `Produtos encontrados na Nuvemshop (MOCK):
- ${query} Premium | Preço: R$ 99,00 | Estoque: Disponível | Link: www.123mart.com.br/produto/exemplo

(Regra: Formate esses dados de forma amigável para o cliente usando os links oficiais fornecidos).`;
      }

      const { storeId, accessToken } = credentials;
      const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;

      const response = await axios.get(`${API_URL}/products`, {
        headers: {
          'Authentication': `bearer ${accessToken}`,
          'User-Agent': '123Mart AI Assistant (marcus.solidez@gmail.com)'
        },
        params: {
          q: query,
          per_page: 5
        }
      });

      const produtos = response.data;

      if (!produtos || produtos.length === 0) {
        return `Nenhum produto encontrado para o termo: ${query}.`;
      }

      // Mapeia os 5 primeiros produtos para fornecer ao Gemini
      const produtosStr = produtos.map((p: any) => {
        const url = p.seo_title ? `www.123mart.com.br/produtos/${p.seo_title}` : 'www.123mart.com.br';
        const price = p.variants?.[0]?.price || 'Sob consulta';
        const stock = p.variants?.[0]?.stock !== null ? p.variants?.[0]?.stock : 'Disponível';
        return `- ${p.name?.pt || p.name} | Preço: R$ ${price} | Estoque: ${stock} | Link: ${url}`;
      }).join('\n');

      return `Produtos encontrados na Nuvemshop:\n${produtosStr}\n\n(Regra: Formate esses dados de forma amigável para o cliente usando os links fornecidos).`;
      
    } catch (error) {
      console.error('❌ Erro na consulta de produtos (Nuvemshop):', error);
      return 'Erro interno ao consultar o catálogo de produtos na Nuvemshop.';
    }
  },

  /**
   * Consulta um cliente (Customer) na Nuvemshop via email (ou Q no search).
   * A Nuvemshop API V1 Customers suporta busca por parâmetro 'q'
   */
  async searchCustomer(query: string): Promise<any> {
    try {
      const credentials = await firebaseService.getNuvemshopCredentials();
      if (!credentials) {
         return null;
      }
      
      const { storeId, accessToken } = credentials;
      const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;

      const response = await axios.get(`${API_URL}/customers`, {
        headers: {
          'Authentication': `bearer ${accessToken}`,
          'User-Agent': '123Mart AI Assistant (marcus.solidez@gmail.com)'
        },
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro na consulta de contato (Nuvemshop):', error);
      return null;
    }
  },
  async updateProduct(productId: string, data: any): Promise<any> {
    try {
      const credentials = await firebaseService.getNuvemshopCredentials();
      if (!credentials) {
        console.warn('⚠️ Credenciais da Nuvemshop não encontradas (Mock update).');
        return { success: true, mock: true };
      }
      const { storeId, accessToken } = credentials;
      const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;
      const response = await axios.put(`${API_URL}/products/${productId}`, data, {
        headers: {
          'Authentication': `bearer ${accessToken}`,
          'User-Agent': '123Mart AI Assistant (marcus.solidez@gmail.com)'
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar produto (Nuvemshop):', error);
      throw error;
    }
  }
};
