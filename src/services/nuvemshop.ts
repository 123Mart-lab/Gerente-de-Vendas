import axios from 'axios';
import { firebaseService } from './firebase.js';

async function resolveNuvemshopCredentials(): Promise<{ storeId: string; accessToken: string } | null> {
  if (process.env.NUVEMSHOP_ACCESS_TOKEN && process.env.NUVEMSHOP_STORE_ID) {
    const accessToken = process.env.NUVEMSHOP_ACCESS_TOKEN.replace(/[^a-zA-Z0-9]/g, '');
    const storeId = process.env.NUVEMSHOP_STORE_ID.replace(/[^0-9]/g, '');
    if (storeId && accessToken) {
      return { storeId, accessToken };
    }
  }
  const stored = await firebaseService.getNuvemshopCredentials();
  if (stored?.storeId && stored?.accessToken) {
    return { storeId: String(stored.storeId), accessToken: String(stored.accessToken) };
  }
  return null;
}

function extractPtField(field: any): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object') return String(field.pt || field.es || field.en || Object.values(field)[0] || '');
  return String(field);
}

export const nuvemshopService = {
  /**
   * Consulta detalhada de um produto específico na Nuvemshop por SKU ou ID,
   * retornando todos os campos de cadastro e SEO reais (título, seo_title, seo_description, tags, marca, descrição e fotos).
   */
  async getProductDetailsBySku(skuOrId: string): Promise<string> {
    const cleanQuery = String(skuOrId || '').trim();
    if (!cleanQuery) {
      return '[ERRO]: Nenhum SKU ou ID de produto foi informado para consulta na Nuvemshop.';
    }

    try {
      const credentials = await resolveNuvemshopCredentials();
      if (!credentials) {
        return '[ERRO]: Credenciais da Nuvemshop (NUVEMSHOP_STORE_ID / NUVEMSHOP_ACCESS_TOKEN) não configuradas no servidor.';
      }

      const { storeId, accessToken } = credentials;
      const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;
      const headers = {
        Authentication: `bearer ${accessToken}`,
        'User-Agent': '123Mart AI Assistant (marcus.solidez@gmail.com)',
      };

      let matchedProduct: any = null;

      // 1. Se for ID numérico puro, busca direta pelo endpoint /products/:id
      if (/^\d+$/.test(cleanQuery)) {
        try {
          const directRes = await axios.get(`${API_URL}/products/${cleanQuery}`, { headers });
          matchedProduct = directRes.data;
        } catch {
          // Segue para busca por query
        }
      }

      // 2. Busca por parâmetro q (SKU ou nome)
      if (!matchedProduct) {
        try {
          const searchRes = await axios.get(`${API_URL}/products`, {
            headers,
            params: { q: cleanQuery, per_page: 25 },
          });
          const list = Array.isArray(searchRes.data) ? searchRes.data : [];
          matchedProduct =
            list.find((p: any) =>
              p.variants?.some((v: any) => String(v.sku || '').trim().toLowerCase() === cleanQuery.toLowerCase())
            ) ||
            list.find((p: any) =>
              p.variants?.some((v: any) => String(v.sku || '').toLowerCase().includes(cleanQuery.toLowerCase()))
            ) ||
            list[0] ||
            null;
        } catch {
          // Segue para varredura paginada se a busca textual falhar
        }
      }

      // 3. Fallback: varredura rápida nas primeiras páginas para SKU exato caso q não indexe a variante
      if (!matchedProduct) {
        for (let page = 1; page <= 4 && !matchedProduct; page++) {
          try {
            const pageRes = await axios.get(`${API_URL}/products`, {
              headers,
              params: { page, per_page: 50 },
            });
            const list = Array.isArray(pageRes.data) ? pageRes.data : [];
            if (list.length === 0) break;
            matchedProduct =
              list.find((p: any) =>
                p.variants?.some((v: any) => String(v.sku || '').trim().toLowerCase() === cleanQuery.toLowerCase())
              ) || null;
          } catch {
            break;
          }
        }
      }

      if (!matchedProduct) {
        return `[NUVEMSHOP - CONSULTA AO VIVO]: Nenhum produto encontrado na loja ${storeId} para o SKU/ID "${cleanQuery}".`;
      }

      const name = extractPtField(matchedProduct.name);
      const description = extractPtField(matchedProduct.description);
      const seoTitle = extractPtField(matchedProduct.seo_title);
      const seoDescription = extractPtField(matchedProduct.seo_description);
      const handle = extractPtField(matchedProduct.handle);
      const tags = String(matchedProduct.tags || '').trim();
      const brand = String(matchedProduct.brand || '').trim();
      const variantSkus = (matchedProduct.variants || [])
        .map((v: any) => `${v.sku || 'SEM-SKU'} (R$ ${v.price ?? 'N/A'}, estoque: ${v.stock ?? 'ilimitado'})`)
        .join('; ');
      const images = Array.isArray(matchedProduct.images) ? matchedProduct.images : [];
      const plainDescPreview = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 260);

      const missingFields: string[] = [];
      if (!name) missingFields.push('Título (name)');
      if (!seoTitle) missingFields.push('Título SEO (seo_title)');
      if (!seoDescription) missingFields.push('Meta Description (seo_description)');
      if (!tags) missingFields.push('Tags');
      if (!brand) missingFields.push('Marca (brand)');
      if (!description || description.trim().length < 50) missingFields.push('Descrição HTML completa');

      return [
        `[NUVEMSHOP - CADASTRO AO VIVO NA LOJA ${storeId}]`,
        `- ID Nuvemshop: ${matchedProduct.id}`,
        `- Variantes/SKUs: ${variantSkus || 'Nenhuma'}`,
        `- Publicado: ${matchedProduct.published ? 'Sim' : 'Não'}`,
        `- Última atualização na Nuvemshop: ${matchedProduct.updated_at || 'N/A'}`,
        `- Título (name.pt): ${name || '(VAZIO)'}`,
        `- Título SEO (seo_title.pt): ${seoTitle || '(VAZIO)'}`,
        `- Meta Description (seo_description.pt): ${seoDescription || '(VAZIO)'}`,
        `- Tags: ${tags || '(VAZIO)'}`,
        `- Marca (brand): ${brand || '(VAZIO)'}`,
        `- URL amigável (handle.pt): ${handle || '(VAZIO)'}`,
        `- Descrição HTML: ${description ? `${description.length} caracteres — prévia: "${plainDescPreview}..."` : '(VAZIO)'}`,
        `- Imagens cadastradas: ${images.length} foto(s)${images.length > 0 ? ` (capa: ${images[0]?.src})` : ''}`,
        `- Campos vazios/incompletos detectados: ${missingFields.length > 0 ? missingFields.join(', ') : 'Nenhum (todos os campos principais preenchidos)'}`,
      ].join('\n');
    } catch (error: any) {
      const apiErr = error?.response?.data ? JSON.stringify(error.response.data) : error?.message || String(error);
      console.error('❌ Erro ao auditar SKU na Nuvemshop:', apiErr);
      return `[ERRO NUVEMSHOP]: Falha ao consultar o SKU "${cleanQuery}" na API da Nuvemshop (${apiErr}).`;
    }
  },

  /**
   * Consulta o catálogo de produtos na Nuvemshop por palavra-chave ou SKU.
   */
  async searchProducts(query: string): Promise<string> {
    const cleanQuery = String(query || '').trim();
    if (/^123mart[a-zA-Z0-9_-]+$/i.test(cleanQuery) || /^\d{6,}$/.test(cleanQuery)) {
      return this.getProductDetailsBySku(cleanQuery);
    }

    try {
      const credentials = await resolveNuvemshopCredentials();

      if (!credentials) {
        console.warn('⚠️ Credenciais da Nuvemshop não configuradas no servidor.');
        return '[ERRO]: Credenciais da Nuvemshop não configuradas (NUVEMSHOP_STORE_ID / NUVEMSHOP_ACCESS_TOKEN).';
      }

      const { storeId, accessToken } = credentials;
      const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;

      const response = await axios.get(`${API_URL}/products`, {
        headers: {
          Authentication: `bearer ${accessToken}`,
          'User-Agent': '123Mart AI Assistant (marcus.solidez@gmail.com)',
        },
        params: {
          ...(cleanQuery ? { q: cleanQuery } : {}),
          per_page: 5,
        },
      });

      const produtos = response.data;

      if (!produtos || produtos.length === 0) {
        return `Nenhum produto encontrado na Nuvemshop para o termo: "${cleanQuery}".`;
      }

      const produtosStr = produtos.map((p: any) => {
        const handle = extractPtField(p.handle);
        const url = handle ? `www.123mart.com.br/produtos/${handle}` : 'www.123mart.com.br';
        const price = p.variants?.[0]?.price || 'Sob consulta';
        const sku = p.variants?.[0]?.sku || 'SEM-SKU';
        const stock = p.variants?.[0]?.stock !== null ? p.variants?.[0]?.stock : 'Disponível';
        const img = p.images?.[0]?.src || 'Sem imagem';
        const seoTitle = extractPtField(p.seo_title) || '(VAZIO)';
        const tags = String(p.tags || '').trim() || '(VAZIO)';
        return `- [${sku}] ${extractPtField(p.name)} | ID: ${p.id} | Preço: R$ ${price} | Estoque: ${stock} | SEO Title: ${seoTitle} | Tags: ${tags} | Link: ${url} | Imagem: ${img}`;
      }).join('\n');

      return `Produtos encontrados na Nuvemshop (consulta ao vivo):\n${produtosStr}`;
    } catch (error: any) {
      console.error('❌ Erro na consulta de produtos (Nuvemshop):', error?.response?.data || error?.message || error);
      return 'Erro interno ao consultar o catálogo de produtos na Nuvemshop.';
    }
  },

  /**
   * Consulta um cliente (Customer) na Nuvemshop via email (ou Q no search).
   */
  async searchCustomer(query: string): Promise<any> {
    try {
      const credentials = await resolveNuvemshopCredentials();
      if (!credentials) {
        return null;
      }

      const { storeId, accessToken } = credentials;
      const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;

      const response = await axios.get(`${API_URL}/customers`, {
        headers: {
          Authentication: `bearer ${accessToken}`,
          'User-Agent': '123Mart AI Assistant (marcus.solidez@gmail.com)',
        },
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro na consulta de contato (Nuvemshop):', error);
      return null;
    }
  },

  async updateProduct(productId: string, data: any): Promise<any> {
    try {
      const credentials = await resolveNuvemshopCredentials();
      if (!credentials) {
        throw new Error('Credenciais da Nuvemshop não configuradas no servidor.');
      }
      const { storeId, accessToken } = credentials;
      const API_URL = `https://api.nuvemshop.com.br/v1/${storeId}`;
      const response = await axios.put(`${API_URL}/products/${productId}`, data, {
        headers: {
          Authentication: `bearer ${accessToken}`,
          'User-Agent': '123Mart AI Assistant (marcus.solidez@gmail.com)',
        },
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar produto (Nuvemshop):', error);
      throw error;
    }
  },
};
