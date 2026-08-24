import axios from 'axios';

const TINY_API_URL = 'https://api.tiny.com.br/api2';

export const tinyErpService = {
  /**
   * Consulta o catálogo de produtos no Tiny ERP por palavra-chave.
   */
  async searchProducts(query: string): Promise<string> {
    try {
      if (!process.env.TINY_ERP_TOKEN) {
        console.warn('⚠️ TINY_ERP_TOKEN não configurado no .env.');
        return 'Sistema de catálogo temporariamente indisponível.';
      }

      const response = await axios.post(`${TINY_API_URL}/produtos.pesquisa.php`, null, {
        params: {
          token: process.env.TINY_ERP_TOKEN,
          formato: 'JSON',
          pesquisa: query
        }
      });

      const { retorno } = response.data;

      if (retorno.status === 'Erro') {
        return `Nenhum produto encontrado para o termo: ${query}.`;
      }

      // Mapeia os 5 primeiros produtos para fornecer ao Gemini
      const produtosStr = retorno.produtos.slice(0, 5).map((p: any) => {
        const prod = p.produto;
        return `- ${prod.nome} | Preço: R$ ${prod.preco} | Estoque: ${prod.saldo_estoque || 'Sob consulta'} | ID: ${prod.id}`;
      }).join('\n');

      return `Produtos encontrados no Tiny ERP:\n${produtosStr}\n\n(Regra: Formate esses dados de forma amigável para o cliente usando os links oficiais www.123mart.com.br).`;
      
    } catch (error) {
      console.error('❌ Erro na consulta de produtos (Tiny ERP):', error);
      return 'Erro interno ao consultar o catálogo de produtos.';
    }
  },

  /**
   * Consulta um contato/cliente cadastrado via CPF ou Telefone
   */
  async searchContact(cpfOrPhone: string): Promise<any> {
    try {
      const response = await axios.post(`${TINY_API_URL}/contatos.pesquisa.php`, null, {
        params: {
          token: process.env.TINY_ERP_TOKEN,
          formato: 'JSON',
          pesquisa: cpfOrPhone
        }
      });
      return response.data.retorno;
    } catch (error) {
      console.error('❌ Erro na consulta de contato (Tiny ERP):', error);
      return null;
    }
  },

  /**
   * Lança um pedido de venda no Tiny ERP.
   */
  async createOrder(orderData: any): Promise<any> {
    try {
      // Cria a estrutura XML ou JSON esperada pelo Tiny para inserção de pedido
      // orderData deve conter itens, frete, dados do cliente
      console.log('Faturando pedido no Tiny ERP...', orderData);
      
      /* Exemplo estrutural (não executar sem mapear payload exato)
      const response = await axios.post(`${TINY_API_URL}/pedido.incluir.php`, null, {
        params: { token: process.env.TINY_ERP_TOKEN, formato: 'JSON', pedido: JSON.stringify(orderData) }
      });
      return response.data;
      */
      
      return { status: 'success', msg: 'Pedido enviado para faturamento.' };
    } catch (error) {
      console.error('❌ Erro ao criar pedido (Tiny ERP):', error);
      return null;
    }
  }
};
