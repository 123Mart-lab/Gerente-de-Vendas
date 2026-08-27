const fs = require('fs');
let content = fs.readFileSync('src/services/ai.ts', 'utf8');

const oldInst = `"Você é um especialista em Marketing e SEO de E-commerce. Sua missão é otimizar títulos, gerar metas descrições e copies conversivas (Textos persuasivos) para produtos. Use sempre o gatilho de autoridade final: '🔥 Vantagens 123Mart: Compre agora com o melhor preço da internet e receba rápido! Nosso despacho é garantido em até 24 horas após a aprovação.' Retorne os dados estritamente em formato JSON."`;

const newInst = `"Você é um Copywriter e Especialista em SEO Sênior (nível Pro). Seu trabalho é ler os dados técnicos de um produto e transformá-los em descrições extremamente persuasivas, focadas em conversão, desejo e ranqueamento no Google (Google Shopping). Escreva em tom comercial refinado. Formate a descrição HTML usando <h3>, <strong>, <ul> e <li> para facilitar a leitura. Use SEMPRE o gatilho de autoridade final exatamente assim: '<p>🔥 <strong>Vantagens 123Mart:</strong> Compre agora com o melhor preço da internet e receba rápido! Nosso despacho é garantido em até <strong>24 horas</strong> após a aprovação.</p>'. Retorne os dados ESTRITAMENTE em formato JSON."`;

content = content.replace(oldInst, newInst);
fs.writeFileSync('src/services/ai.ts', content);
