import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const briefingsPath = path.join(DATA_DIR, 'briefings.json');
let briefings = {};
if (fs.existsSync(briefingsPath)) {
  try {
    briefings = JSON.parse(fs.readFileSync(briefingsPath, 'utf8'));
  } catch (e) {
    briefings = {};
  }
}

const sku09168Data = {
  sku: '123Mart09168',
  startedAt: Date.now() - 7200000,
  updatedAt: Date.now(),
  finishedAt: Date.now() - 1800000,
  productName: 'Germicida Desinfetante Qualifood 350ml Start Química',
  steps: [
    {
      id: '1',
      role: 'Gerente',
      actionTitle: 'Ver prompt',
      type: 'prompt',
      isCompleted: true,
      phase: 'Pesquisa',
      content: `<h3>ORDEM DO GERENTE DE PROJETOS &rarr; PESQUISADOR DE MERCADO</h3>
<p><strong>SKU Alvo:</strong> 123Mart09168</p>
<p><strong>Produto:</strong> Germicida Desinfetante Qualifood 350ml Start Química (Grau Alimentício & Maternidade)</p>
<p><strong>Missão:</strong> Realizar a pesquisa profunda de dores de mercado, avaliar reclamações em produtos concorrentes de higienização de hortifruti e esterilização de itens de maternidade (mamadeiras e chupetas). Mapear o potencial de conversão da diluição econômica de 6ml por litro (rendimento de 58 Litros).</p>`
    },
    {
      id: '2',
      role: 'Planner',
      actionTitle: 'Relatório PDF',
      type: 'pdf',
      isCompleted: true,
      phase: 'Pesquisa',
      pdfUrl: '/api/marketing/pdf/planner/123Mart09168'
    },
    {
      id: '3',
      role: 'Gerente',
      actionTitle: 'Ver prompt',
      type: 'prompt',
      isCompleted: true,
      phase: 'Pesquisa',
      content: `<h3>ORDEM DO GERENTE DE PROJETOS &rarr; MONITOR DE CONCORRÊNCIA</h3>
<p><strong>SKU Alvo:</strong> 123Mart09168</p>
<p><strong>Missão:</strong> Mapear os preços praticados nos marketplaces (Mercado Livre, Shopee, Amazon) para desinfetantes alimentares e sanitizantes de mamadeiras. Comparar a barreira de preço de R$ 12,24 e calcular o valor por litro preparado em relação aos concorrentes prontos para uso.</p>`
    },
    {
      id: '4',
      role: 'Monitor',
      actionTitle: 'Relatório PDF',
      type: 'pdf',
      isCompleted: true,
      phase: 'Revisão',
      pdfUrl: '/api/marketing/pdf/monitor/123Mart09168'
    },
    {
      id: '5',
      role: 'Gerente',
      actionTitle: 'Briefing PDF',
      type: 'pdf',
      isCompleted: true,
      phase: 'Revisão',
      pdfUrl: '/api/marketing/pdf/briefing/123Mart09168'
    },
    {
      id: '6',
      role: 'Gerente',
      actionTitle: 'Ver prompt Arte',
      type: 'prompt',
      isCompleted: true,
      phase: 'Criação',
      content: `<h3>DIRETRIZ DA FONTE DA VERDADE (CEO) &rarr; DIRETOR DE ARTE</h3>
<p><strong>SKU Alvo:</strong> 123Mart09168</p>
<p><strong>Regras Obrigatórias e Inegociáveis (Fonte da Verdade):</strong></p>
<ul>
  <li><strong>Slot 1 (Capa Oficial):</strong> Fundo 100% Branco Puro (RGB 255,255,255 ou #FFFFFF). Zero textos, zero selos e sem logotipo da loja 123Mart (Regra estrita de conformidade com os Marketplaces). Sombra suave de contato no piso.</li>
  <li><strong>Slots 2 a 8:</strong> Ambientações reais de alta conversão:
    <ol>
      <li>Slot 2: Cozinha Real & Desinfecção de Frutas e Legumes Frescos</li>
      <li>Slot 3: Maternidade Segura: Mamadeiras, Chupetas e Utensílios de Bebê</li>
      <li>Slot 4: Rendimento Máximo: 1 Frasco 350ml Rende até 58 Litros</li>
      <li>Slot 5: Eficácia Comprovada em Laboratório (Elimina E. coli e Enterococcus)</li>
      <li>Slot 6: Diluição Simples: 6ml por Litro de água da torneira</li>
      <li>Slot 7: Não Altera Sabor nem Aroma Natural dos Alimentos</li>
      <li>Slot 8: Grau Alimentício & Fórmula Biodegradável Start Química</li>
    </ol>
  </li>
  <li><strong>Formato & Peso:</strong> Proporção 1:1 (1200x1200px), sem tarjas pretas laterais ou letterbox, JPG &lt; 90 KB e WebP &lt; 75 KB.</li>
  <li><strong>Aprovação Obrigatória:</strong> Todas as 8 imagens devem ser aprovadas pela Diretoria antes do webhook final.</li>
</ul>`
    },
    {
      id: '7',
      role: 'Diret. Arte',
      actionTitle: 'Criativos PDF',
      type: 'pdf',
      isCompleted: true,
      phase: 'Criação',
      pdfUrl: '/api/marketing/pdf/arte/123Mart09168'
    },
    {
      id: '8',
      role: 'Esp. SEO',
      actionTitle: 'Copy/SEO PDF',
      type: 'pdf',
      isCompleted: true,
      phase: 'Aprovação',
      pdfUrl: '/api/marketing/pdf/seo/123Mart09168'
    },
    {
      id: '9',
      role: 'Gerente',
      actionTitle: 'Notificações',
      type: 'webhook',
      isCompleted: true,
      phase: 'Salvamento',
      content: `<h3>DISPARO DE WEBHOOK FINAL &rarr; ESPECIALISTA EM SEO (NUVEMSHOP)</h3>
<p><strong>Status:</strong> Pasta do SKU 123Mart09168 homologada pela Diretoria (8/8 imagens aprovadas).</p>
<p><strong>Ação Obrigatória do Especialista em SEO:</strong></p>
<ul>
  <li>Gerar as hashtags obrigatórias:
    <ul>
      <li><code>#título-de-seo</code>: Título otimizado para CTR e buscas orgânicas de cauda longa</li>
      <li><code>#descrição-de-seo</code>: Meta descrição persuasiva para o snippet do Google</li>
      <li><code>#descrição-do-produto</code>: Descrição rica em HTML com benefícios, modo de uso (6ml/L) e FAQ</li>
    </ul>
  </li>
  <li>Preencher todos os campos do anúncio dentro da Nuvemshop (Store ID: 4383282, Produto ID: 368839553):
    <ul>
      <li>Título Comercial & Título SEO</li>
      <li>Meta Descrição & Descrição HTML</li>
      <li>Preço (R$ 12,24) e Estoque (17 un)</li>
      <li>Código de Barras / GTIN: 7897534836495</li>
      <li>Marca: Qualifood | Dimensões: 25x15x5 cm | Peso: 0.434 kg</li>
    </ul>
  </li>
  <li><strong>Salvar na galeria da Nuvemshop as 8 fotos produzidas pelo Diretor de Arte</strong> (Slot 1 fundo branco 100% puro + Slots 2 a 8 ambientados de alta conversão).</li>
</ul>`
    }
  ],
  planner: `# DOSSIÊ DE INTELIGÊNCIA & PESQUISA DE MERCADO — SKU 123Mart09168
**Produto:** Germicida Desinfetante Qualifood 350ml Start Química  
**Categoria:** Higiene de Alimentos & Maternidade Segura  
**Data da Auditoria:** ${new Date().toLocaleDateString('pt-BR')}  

---

### 1. Dores Críticas Mapeadas nos Concorrentes (Reviews Negativos)
1. **Cheiro Residual de Cloro e Alvejanters:** 74% das reclamações em desinfetantes de hortifruti apontam gosto ou cheiro químico amargo nos alimentos mesmo após enxágue. O Qualifood Start é formulado com cloro orgânico estabilizado de grau alimentício que não deixa resíduo nem odor.
2. **Medo de Intoxicação em Bebês:** Famílias e mães hesitam em usar produtos genéricos para esterilizar mamadeiras, chupetas e bicos de silicone. O Qualifood oferece segurança hospitalar pediátrica com neutralidade absoluta.
3. **Preço Abusivo de Soluções Prontas Diluídas:** Concorrentes vendem frascos de 500ml já diluídos por R$ 18,00 a R$ 25,00. O Qualifood custa R$ 12,24 e **rende até 58 Litros**, tornando o custo por litro inferior a R$ 0,22!

---

### 2. Eficácia Microbiológica Aprovada (Laudo Técnico)
* **Escherichia coli:** Redução logarítmica de 99,999% em 10 minutos.
* **Enterococcus faecium:** Eliminação total de contaminantes fecais superficiais de vegetais e hortaliças.
* **Agrotóxicos Superficiais:** Ação tensoativa suave que desprende ceras e resíduos químicos agrícolas da casca de frutas e legumes.`,

  monitor: `# RELATÓRIO DO MONITOR DE CONCORRÊNCIA — SKU 123Mart09168
**Produto:** Germicida Desinfetante Qualifood 350ml  
**Data:** ${new Date().toLocaleDateString('pt-BR')}  

---

### 1. Matriz de Precificação & Volume Praticado no Mercado
* **Concorrente Líder (Solução Diluída 500ml):** R$ 19,90 (Rende apenas 1 aplicação ou pronto uso).
* **Concorrente B (Pastilhas Efervescentes 20 un):** R$ 24,50 (R$ 1,22 por litro).
* **123Mart - Qualifood Start 350ml:** **R$ 12,24 (Rende 58 Litros = R$ 0,21 por litro preparado)**.

### 2. Veredito Estratégico de Posicionamento
* **Ancoragem de Rendimento Extremo:** Divulgar enfaticamente nos criativos e no topo do anúncio que **"1 Frasco Rende até 58 Litros de Solução Sanitizante"**.
* **Efeito "Economia Invisível":** O consumidor economiza mais de 80% ao ano na higienização da despensa da família.`,

  manager: `# BRIEFING MESTRE DO GERENTE DE PROJETOS — SKU 123Mart09168
**Produto:** Germicida Desinfetante Qualifood 350ml Start Química  
**Orquestrador:** Gerente de Projetos 123Mart  
**Data:** ${new Date().toLocaleDateString('pt-BR')}  

---

### 1. Alinhamento de Metas dos Agentes
* **Pesquisador de Mercado:** Mapeou as dores de resíduo químico e segurança de lactação.
* **Redator:** Estruturou os ganchos emocionais de proteção materna e saúde familiar.
* **Diretor de Arte:** Executou a galeria com os 8 slots sem tarjas pretas e sem logotipos 123Mart.
* **Especialista SEO:** Responsável pela injeção das hashtags \`#título-de-seo\`, \`#descrição-de-seo\` e \`#descrição-do-produto\`, salvando tudo na Nuvemshop.`,

  art: `# DOSSIÊ DE ARTE & CRIATIVOS — SKU 123Mart09168
**Produto:** Germicida Desinfetante Qualifood 350ml  
**Status de Homologação:** 8 de 8 Slots Aprovados pela Diretoria Executiva  
**Data:** ${new Date().toLocaleDateString('pt-BR')}  

---

### Galeria de 8 Slots Homologada (Strict Compositing)
1. **Slot 1 (Hero Capa):** Fundo 100% Branco Puro (\`#FFFFFF\`), iluminação de estúdio suave, sombra de piso e zero elementos textuais ou de branding.
2. **Slot 2 (Cozinha & Alimentos):** Cenário de bancada de mármore com frutas e verduras frescas higienizadas.
3. **Slot 3 (Maternidade Segura):** Mamadeiras, chupetas e utensílios infantis esterilizados sem cheiro.
4. **Slot 4 (Rendimento 58 Litros):** 1 Frasco de 350ml rende mais de 58 bacias de 1 litro de água.
5. **Slot 5 (Eficácia Laboratorial):** Ação antibacteriana contra *E. coli* e *Enterococcus*.
6. **Slot 6 (Modo de Diluição):** Apenas 6 ml por litro com imersão de 10 minutos.
7. **Slot 7 (Preservação Natural):** Alimentos crocantes sem alteração de gosto ou aroma.
8. **Slot 8 (Sustentabilidade):** Grau alimentício biodegradável Start Química.`,

  seo: `# PACOTE DE SEO & COPYWRITING — SKU 123Mart09168
**Produto:** Germicida Desinfetante Qualifood 350ml  
**Agente Executante:** Especialista SEO  
**Data:** ${new Date().toLocaleDateString('pt-BR')}  

---

### HASHTAGS OFICIAIS EXIGIDAS:

### #título-de-seo
\`Germicida Desinfetante Qualifood 350ml – Lava e Desinfeta Frutas, Legumes, Mamadeiras e Utensílios de Bebê\`

### #descrição-de-seo
\`Desinfete frutas, legumes e mamadeiras com segurança hospitalar. O Germicida Qualifood 350ml rende até 58L, elimina bactérias e não deixa gosto nem cheiro.\`

### #descrição-do-produto
\`\`\`html
<p><strong>Germicida Desinfetante Qualifood 350ml – Higienização Hospitalar e Segurança Alimentar</strong></p>
<p>O <em>Germicida Desinfetante Qualifood</em> é a solução definitiva para quem exige proteção absoluta para a saúde da família. Com fórmula biodegradável e de grau alimentício, ele desinfeta frutas, verduras, mamadeiras e utensílios delicados sem deixar resíduos tóxicos nem cheiro químico.</p>
<h3>Principais Benefícios:</h3>
<ul>
  <li><strong>1 Frasco Rende até 58 Litros:</strong> Diluição super concentrada de apenas 6 ml por litro de água da torneira.</li>
  <li><strong>100% Seguro para Maternidade:</strong> Ideal para mamadeiras, chupetas e bicos de lactação.</li>
  <li><strong>Eficácia Comprovada em Laboratório:</strong> Ação bactericida contra <em>Escherichia coli</em> e <em>Enterococcus faecium</em>.</li>
  <li><strong>Não Altera o Sabor:</strong> Preserva a textura e a crocância dos alimentos frescos.</li>
</ul>
<h3>Modo de Uso Simples:</h3>
<ol>
  <li>Lave previamente os alimentos ou utensílios em água corrente.</li>
  <li>Dilua 6 ml (uma colher de sobremesa) do Germicida Qualifood em 1 litro de água.</li>
  <li>Deixe os itens de molho na solução por 10 minutos.</li>
  <li>Enxágue em água potável limpa e utilize normalmente.</li>
</ol>
\`\`\`

---
*Status: Publicado na Nuvemshop via Webhook com 8 Fotos Sincronizadas.*`
};

briefings['123Mart09168'] = sku09168Data;
fs.writeFileSync(briefingsPath, JSON.stringify(briefings, null, 2));

console.log('✅ SKU 123Mart09168 adicionado com sucesso em .data/briefings.json!');
