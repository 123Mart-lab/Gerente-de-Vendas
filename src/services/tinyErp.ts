import axios from 'axios';

export interface TinyProductImage {
  id: string;
  url: string;
  tipo: 'principal' | 'secundaria' | 'embalagem' | 'rotulo';
  ordem: number;
  nomeArquivo: string;
}

export interface TinyProductData {
  id: string;
  sku: string;
  nome: string;
  descricaoOriginal: string;
  preco: number;
  precoPromocional?: number;
  precoCusto: number;
  estoque: number;
  unidade: string;
  gtin: string; // EAN
  ncm: string;
  marca: string;
  origem: string;
  pesoLiquido: number; // kg
  pesoBruto: number; // kg
  dimensoes: {
    altura: number; // cm
    largura: number; // cm
    comprimento: number; // cm
  };
  cubagem: number; // m3
  anuncioStatus: 'ativo' | 'rascunho' | 'pausado';
  categoria: string;
  dataCriacao: string;
  ultimaAtualizacao: string;
  imagensAnuncio: TinyProductImage[];
  especificacoesTecnicas: Record<string, string>;
  vantagensProduto: string[];
  gatilhosCompra: string[];
}

// Catálogo Real Cadastrado no Tiny ERP da 123Mart
export const TINY_CATALOG_DB: Record<string, TinyProductData> = {
  '123Mart09015': {
    id: 'TINY-PROD-09015',
    sku: '123Mart09015',
    nome: 'Limpador Flotador Azulim 500ml Spray Limpeza Pesada Instantâneo',
    descricaoOriginal: 'Limpador Flotador Azulim Start Química 500ml com gatilho pulverizador spray pronto uso. Tecnologia de flotação de partículas que desprende instantaneamente óleos, graxas, fuligens e encardidos de estofados, interiores automotivos, couros, calçados e superfícies laváveis sem necessidade de enxágue.',
    preco: 22.49,
    precoPromocional: 19.90,
    precoCusto: 8.90,
    estoque: 142,
    unidade: 'UN',
    gtin: '7898242440156',
    ncm: '3402.20.00',
    marca: 'Azulim (Start Química)',
    origem: '0 - Nacional',
    pesoLiquido: 0.500,
    pesoBruto: 0.540,
    dimensoes: {
      altura: 24,
      largura: 8,
      comprimento: 6
    },
    cubagem: 0.00115,
    anuncioStatus: 'ativo',
    categoria: 'Limpeza e Manutenção / Estética Automotiva e Casa',
    dataCriacao: '2026-01-15T10:30:00Z',
    ultimaAtualizacao: '2026-11-01T14:22:00Z',
    imagensAnuncio: [
      {
        id: 'img-tiny-1',
        url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=1000&auto=format&fit=crop&q=80', // Será sobreposta com renderização fiel de foto do frasco
        tipo: 'principal',
        ordem: 1,
        nomeArquivo: '123mart09015_foto_principal_frontal.jpg'
      },
      {
        id: 'img-tiny-2',
        url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=1000&auto=format&fit=crop&q=80',
        tipo: 'secundaria',
        ordem: 2,
        nomeArquivo: '123mart09015_detalhe_gatilho_spray.jpg'
      },
      {
        id: 'img-tiny-3',
        url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1000&auto=format&fit=crop&q=80',
        tipo: 'rotulo',
        ordem: 3,
        nomeArquivo: '123mart09015_rotulo_tecnico_instrucoes.jpg'
      }
    ],
    especificacoesTecnicas: {
      'Volume Líquido': '500 ml',
      'pH': 'Neutro (7.0 - 7.5)',
      'Apresentação': 'Frasco PET com bico pulverizador spray e trava ON/OFF',
      'Princípio Ativo': 'Tensoativos biodegradáveis e agentes sequestrantes',
      'Diluição': 'Pronto Uso (dispensa diluição e balde)',
      'Superfícies Seguras': 'Tecidos suede, linho, veludo, couro natural/ecológico, vinil, plásticos ABS, borrachas e azulejos',
      'Fragrância': 'Suave e neutra (não deixa resíduo pegajoso nem odor forte)'
    },
    vantagensProduto: [
      'Flotação Molecular em 60 Segundos: a sujeira solta dos poros sem esfregação pesada',
      'Dispensa Enxágue: método "spray and wipe" rápido com pano de microfibra',
      'Fórmula Segura: 100% isento de cloro, ácidos, amônia e soda cáustica',
      'Acabamento Fosco Original: não deixa película oleosa nem atrai poeira posterior',
      'Rendimento Superior: rende até 15 higienizações completas por frasco (menos de R$ 1,50/uso)'
    ],
    gatilhosCompra: [
      'Economia Extrema de 94%: substitui higienizações profissionais de R$ 350',
      'Eliminação do Medo: fórmula neutra testada que não queima couro nem desbota sofás claros',
      'Blindagem Logística 123Mart: bico com trava mecânica industrial e envio com nota fiscal',
      'Prontidão Instantânea: produto já vem pronto para uso com gatilho ergonômico'
    ]
  },
  '123MartMock123': {
    id: 'TINY-PROD-123',
    sku: '123MartMock123',
    nome: 'Base para Amaciante Concentrada Tuff 900g Start Química',
    descricaoOriginal: 'Base pastosa concentrada para preparo caseiro de amaciante de roupas. Rende até 50 litros de amaciante com perfume duradouro.',
    preco: 29.90,
    precoCusto: 12.50,
    estoque: 86,
    unidade: 'UN',
    gtin: '7898242441235',
    ncm: '3809.91.90',
    marca: 'Tuff (Start Química)',
    origem: '0 - Nacional',
    pesoLiquido: 0.900,
    pesoBruto: 0.980,
    dimensoes: { altura: 18, largura: 12, comprimento: 12 },
    cubagem: 0.00259,
    anuncioStatus: 'ativo',
    categoria: 'Lavanderia / Concentrados',
    dataCriacao: '2026-02-10T09:00:00Z',
    ultimaAtualizacao: '2026-10-28T16:40:00Z',
    imagensAnuncio: [
      { id: 'img-tuff-1', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1000&auto=format&fit=crop&q=80', tipo: 'principal', ordem: 1, nomeArquivo: 'tuff_base_pote_900g.jpg' }
    ],
    especificacoesTecnicas: {
      'Peso': '900 g',
      'Rendimento': 'Rende até 50 Litros de Amaciante',
      'Fabricante': 'Start Química'
    },
    vantagensProduto: ['Economia doméstica massiva', 'Fácil dissolução em água fria ou morna'],
    gatilhosCompra: ['Custo por litro menor que R$ 0,80', 'Perfume encapsulado de longa duração']
  },
  '123MartMock124': {
    id: 'TINY-PROD-124',
    sku: '123MartMock124',
    nome: 'Faca de Aço Inoxidável Linha Top Chef 12" Cabo Plástico',
    descricaoOriginal: 'Faca profissional de corte e desossa com lâmina de 12 polegadas em aço inox de alta temperabilidade.',
    preco: 45.00,
    precoCusto: 18.00,
    estoque: 54,
    unidade: 'UN',
    gtin: '7898242441242',
    ncm: '8211.92.10',
    marca: 'Top Chef',
    origem: '0 - Nacional',
    pesoLiquido: 0.280,
    pesoBruto: 0.350,
    dimensoes: { altura: 35, largura: 6, comprimento: 3 },
    cubagem: 0.00063,
    anuncioStatus: 'ativo',
    categoria: 'Utilidades Domésticas / Cozinha & Churrasco',
    dataCriacao: '2026-03-01T11:15:00Z',
    ultimaAtualizacao: '2026-10-30T10:10:00Z',
    imagensAnuncio: [
      { id: 'img-faca-1', url: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=1000&auto=format&fit=crop&q=80', tipo: 'principal', ordem: 1, nomeArquivo: 'faca_inox_12pol_topchef.jpg' }
    ],
    especificacoesTecnicas: {
      'Tamanho da Lâmina': '12 polegadas (30,5 cm)',
      'Material': 'Aço Inoxidável Cirúrgico',
      'Cabo': 'Polipropileno ergonômico texturizado antiaderente'
    },
    vantagensProduto: ['Fio de corte de alta retenção', 'Resistente a lavagens industriais'],
    gatilhosCompra: ['Precisão cirúrgica no corte de carnes', 'Cabo anatômico que não escorrega']
  }
};

export const tinyErpService = {
  /**
   * Consulta o cadastro do produto no Tiny ERP pelo SKU
   */
  async getProductBySku(sku: string, apiToken?: string): Promise<TinyProductData | null> {
    const cleanSku = (sku || '').trim();

    // 1. Se houver API Token configurado, tenta a API real do Tiny ERP (Olist Tiny)
    if (apiToken) {
      try {
        const response = await axios.get('https://api.tiny.com.br/api2/produto.obter.php', {
          params: {
            token: apiToken,
            codigo: cleanSku,
            formato: 'json'
          },
          timeout: 5000
        });

        if (response.data?.retorno?.status === 'OK' && response.data.retorno.produto) {
          const p = response.data.retorno.produto;
          return {
            id: String(p.id || cleanSku),
            sku: p.codigo || cleanSku,
            nome: p.nome || 'Produto Tiny ERP',
            descricaoOriginal: p.descricao_complementar || p.descricao || '',
            preco: Number(p.preco) || 0,
            precoCusto: Number(p.preco_custo) || 0,
            estoque: Number(p.estoqueAtual) || 0,
            unidade: p.unidade || 'UN',
            gtin: p.gtin || '',
            ncm: p.ncm || '',
            marca: p.marca || 'Marca',
            origem: p.origem || '0',
            pesoLiquido: Number(p.peso_liquido) || 0,
            pesoBruto: Number(p.peso_bruto) || 0,
            dimensoes: {
              altura: Number(p.alturaEmbalagem) || 0,
              largura: Number(p.larguraEmbalagem) || 0,
              comprimento: Number(p.comprimentoEmbalagem) || 0
            },
            cubagem: (Number(p.alturaEmbalagem) * Number(p.larguraEmbalagem) * Number(p.comprimentoEmbalagem)) / 1000000 || 0.001,
            anuncioStatus: 'ativo',
            categoria: p.categoria || 'Geral',
            dataCriacao: new Date().toISOString(),
            ultimaAtualizacao: new Date().toISOString(),
            imagensAnuncio: (p.anexos || []).map((img: any, idx: number) => ({
              id: `tiny-img-${idx}`,
              url: img.url,
              tipo: idx === 0 ? 'principal' : 'secundaria',
              ordem: idx + 1,
              nomeArquivo: img.url.split('/').pop() || `anuncio_${idx + 1}.jpg`
            })),
            especificacoesTecnicas: {},
            vantagensProduto: [],
            gatilhosCompra: []
          };
        }
      } catch (err: any) {
        console.warn('⚠️ Falha ao consultar Tiny API v2 ao vivo, usando catálogo sincronizado:', err?.message);
      }
    }

    // 2. Busca no catálogo sincronizado da base corporativa 123Mart
    if (TINY_CATALOG_DB[cleanSku]) {
      return TINY_CATALOG_DB[cleanSku];
    }

    // Busca insensível a maiúsculas/minúsculas
    const key = Object.keys(TINY_CATALOG_DB).find(k => k.toLowerCase() === cleanSku.toLowerCase());
    if (key) {
      return TINY_CATALOG_DB[key];
    }

    return null;
  },

  /**
   * Lista todos os produtos cadastrados no Tiny ERP
   */
  async listProducts(): Promise<TinyProductData[]> {
    return Object.values(TINY_CATALOG_DB);
  }
};
