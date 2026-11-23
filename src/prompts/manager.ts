import type { ProductVisualAudit } from './planner.js';

export interface ManagerSlotBrief {
  slotNumber: number;
  commercialObjective: string;
  keyBenefit: string;
  objectionToBreak: string;
  mustIncludeFacts: string[];
}

export interface ManagerStrategicBriefing {
  sku: string;
  officialBrand: string;
  manufacturer: string;
  productCategory: string;
  targetPersona: string;
  positioningDirective: string;
  pricingVerdict: string;
  topPains: string[];
  topObjections: string[];
  verifiedTechnicalFacts: string[];
  copyTriggers: string[];
  slotAgenda: ManagerSlotBrief[];
}

export function buildManagerBriefingPrompt(
  productData: any,
  plannerSummary: string,
  monitorSummary: string,
  officialBrand: string,
  visualAudit?: ProductVisualAudit | null
): string {
  const imagesCount = Array.isArray(productData.images) ? productData.images.length : 0;
  const visualAuditBlock = visualAudit
    ? `\n[AUDITORIA VISUAL DO RÓTULO REAL — FONTE DE VERDADE ABSOLUTA]
- Marca lida no rótulo: ${visualAudit.officialBrand || officialBrand}
- Fabricante confirmado visualmente no rótulo: ${visualAudit.verifiedManufacturer || 'Confirmar no rótulo da embalagem'}
- Volume/Peso unitário no rótulo: ${visualAudit.unitVolume || 'Não visível'}
- Unidades mostradas na foto principal: ${visualAudit.unitsShownInPhoto ?? 'N/A'}
- Alegações reais impressas na embalagem: ${(visualAudit.labelClaims || []).join(' | ') || 'Nenhuma extraída'}
${visualAudit.kitMismatchDetected ? `- ⚠️ ALERTA COMERCIAL DE KIT/PREÇO: ${visualAudit.kitMismatchNote || 'Divergência entre título e embalagem fotografada.'}` : ''}
REGRA INVIOLÁVEL: Se "Fabricante confirmado visualmente no rótulo" estiver preenchido acima, ele PREVALECE sobre qualquer chute divergente do Planner ou Monitor!\n`
    : '';

  return `Você é o Gerente de Projetos Sênior de E-commerce da 123Mart.
Sua função neste estágio da esteira é consolidar a inteligência do Pesquisador de Mercado e do Monitor de Concorrência em um BRIEFING MESTRE ESTRATÉGICO que guiará o Diretor de Arte e o Especialista SEO.

DIVISÃO DE RESPONSABILIDADES (PADRÃO AGÊNCIA):
- Você define ESTRATÉGIA COMERCIAL: O QUÊ vender, PARA QUEM vender, QUAIS DORES atacar, QUAIS OBJEÇÕES quebrar e QUAIS FATOS TÉCNICOS REAIS são obrigatórios.
- Você NÃO dita ângulo de câmera, cor de fundo, degradê nem posicionamento visual — isso é responsabilidade técnica exclusiva do Diretor de Arte, que analisará as fotos reais do produto.

REGRAS CRÍTICAS DE CONFORMIDADE:
1. ECOSSISTEMA MULTIMARCAS & FABRICANTE SEM CHUTES: A 123Mart revende centenas de marcas distintas. Utilize EXCLUSIVAMENTE a marca e o fabricante confirmados na Auditoria Visual do Rótulo abaixo (ou na ficha técnica oficial). É TERMINANTEMENTE PROIBIDO deduzir, supor ou chutar o nome de um fabricante concorrente por associação de categoria (ex: nunca chutar "Genco", "HTH", "Hidroall" ou "Start" se esse nome NÃO estiver confirmado visualmente no rótulo). Se o fabricante não estiver confirmado, preencha "manufacturer" como "Confirmar no rótulo da embalagem" — o Diretor de Arte fará a leitura visual detalhada da embalagem!
2. PROIBIÇÃO DE MARCA DA LOJA: Nunca inclua "123Mart", "123Mart Oficial", telefones ou URLs da loja nos gatilhos destinados às imagens de marketplace.
3. ZERO ALUCINAÇÃO TÉCNICA: Em "verifiedTechnicalFacts" e "mustIncludeFacts", inclua APENAS dados reais presentes na Auditoria Visual do Rótulo, no cadastro do produto ou na pesquisa abaixo (rendimento, volume, peso, dosagem, aplicações, certificações reais). Se um número não existir nos dados, NÃO invente.
4. ORTOGRAFIA PT-BR IMPECÁVEL: Escreva em Português do Brasil formal, claro, com acentuação correta e unidades padronizadas (mL, L, kg, g, ppm, cm, min).

DADOS DO PRODUTO (NUVEMSHOP):
- SKU: ${productData.sku || 'Não informado'}
- Nome Atual: ${productData.name || 'Produto'}
- Marca Cadastrada / Detectada: ${visualAudit?.officialBrand || officialBrand}
- Preço: R$ ${productData.price || 'Não informado'}
- Quantidade de Fotos no Cadastro: ${imagesCount}
- Descrição Atual: ${(productData.description || 'Sem descrição detalhada').slice(0, 1600)}
${visualAuditBlock}
[INTELIGÊNCIA DO PESQUISADOR DE MERCADO]
${plannerSummary || 'Pesquisa não fornecida.'}

[INTELIGÊNCIA DO MONITOR DE CONCORRÊNCIA]
${monitorSummary || 'Monitoramento não fornecido.'}

TAREFA:
Retorne ESTRITAMENTE um JSON válido com a estrutura abaixo, planejando a agenda comercial dos 8 slots da galeria:
- Slot 1: Sempre Capa Oficial de Marketplace (foco em reconhecimento imediato do produto real, fundo branco puro, zero texto na imagem).
- Slots 2 a 8: Cada slot deve ter um objetivo comercial ÚNICO e progressivo (ex: ambiente real de uso, principal benefício/dor, rendimento/economia matemática, prova técnica/qualidade, modo de uso passo a passo, diferencial contra concorrentes, segurança/procedência original de fábrica).

JSON OBRIGATÓRIO:
{
  "sku": "${productData.sku || ''}",
  "officialBrand": "Marca oficial validada deste produto",
  "manufacturer": "Fabricante EXPLICITAMENTE citado nos dados acima, ou 'Confirmar no rótulo da embalagem' se não constar no texto (NUNCA chute)",
  "productCategory": "Categoria exata do nicho (ex: Tratamento de Piscina, Higiene Alimentar, Lavanderia, Cozinha)",
  "targetPersona": "Perfil objetivo do comprador ideal",
  "positioningDirective": "Diretriz central de posicionamento em 2 frases",
  "pricingVerdict": "Resumo estratégico de preço e proposta de valor frente à concorrência",
  "topPains": ["Dor real 1", "Dor real 2", "Dor real 3"],
  "topObjections": ["Objeção real 1", "Objeção real 2", "Objeção real 3"],
  "verifiedTechnicalFacts": ["Fato técnico verificável 1", "Fato técnico verificável 2", "Fato técnico verificável 3"],
  "copyTriggers": ["Gatilho comercial curto 1", "Gatilho comercial curto 2", "Gatilho comercial curto 3", "Gatilho comercial curto 4"],
  "slotAgenda": [
    {
      "slotNumber": 1,
      "commercialObjective": "Capa oficial limpa para marketplace (reconhecimento imediato sem texto)",
      "keyBenefit": "Identificação nítida da embalagem oficial",
      "objectionToBreak": "Desconfiança de anúncio amador",
      "mustIncludeFacts": ["Embalagem original sem obstruções"]
    }
  ]
}
ATENÇÃO: O array "slotAgenda" DEVE conter EXATAMENTE 8 itens numerados de 1 a 8.`;
}

export function formatManagerBriefingMarkdown(
  briefing: ManagerStrategicBriefing,
  sku: string,
  productName: string
): string {
  const lines: string[] = [
    `# Briefing Mestre Estratégico — Gerência de Projetos`,
    ``,
    `- **SKU:** ${sku}`,
    `- **Produto:** ${productName}`,
    `- **Marca Oficial Homologada:** ${briefing.officialBrand}`,
    `- **Fabricante:** ${briefing.manufacturer}`,
    `- **Categoria / Nicho:** ${briefing.productCategory}`,
    ``,
    `## 1. Diretriz de Posicionamento`,
    briefing.positioningDirective,
    ``,
    `## 2. Persona & Veredito de Preço/Oferta`,
    `- **Público-Alvo:** ${briefing.targetPersona}`,
    `- **Veredito Comercial:** ${briefing.pricingVerdict}`,
    ``,
    `## 3. Dores e Objeções a Quebrar`,
    `**Dores Principais:**`,
    ...briefing.topPains.map((p) => `- ${p}`),
    ``,
    `**Objeções Críticas:**`,
    ...briefing.topObjections.map((o) => `- ${o}`),
    ``,
    `## 4. Fatos Técnicos Verificados (Uso Obrigatório em Arte e SEO)`,
    ...briefing.verifiedTechnicalFacts.map((f) => `- ${f}`),
    ``,
    `## 5. Gatilhos Comerciais Aprovados`,
    ...briefing.copyTriggers.map((t) => `- ${t}`),
    ``,
    `## 6. Agenda Comercial da Galeria (8 Slots para o Diretor de Arte)`,
    ...briefing.slotAgenda.map(
      (s) =>
        `### Slot ${s.slotNumber} — ${s.commercialObjective}\n` +
        `- **Benefício Central:** ${s.keyBenefit}\n` +
        `- **Objeção a Quebrar:** ${s.objectionToBreak}\n` +
        `- **Fatos Obrigatórios:** ${s.mustIncludeFacts.join(' • ')}\n`
    ),
  ];

  return lines.join('\n');
}
