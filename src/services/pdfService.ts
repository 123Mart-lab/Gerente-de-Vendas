import PDFDocument from 'pdfkit';
import { Response } from 'express';

export const generatePdf = (res: Response, role: string, sku: string) => {
  const doc = new PDFDocument({ margin: 50 });
  
  // Pipe its output to the Express response
  res.setHeader('Content-disposition', `attachment; filename="${role}_${sku}.pdf"`);
  res.setHeader('Content-type', 'application/pdf');
  doc.pipe(res);

  // Title
  doc.fontSize(20).text(`Relatório Oficial: ${role.toUpperCase()}`, { align: 'center' });
  doc.moveDown();
  
  // Meta
  doc.fontSize(12).fillColor('gray').text(`SKU: ${sku}`, { align: 'center' });
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
  doc.moveDown(2);
  
  // Content based on role
  doc.fillColor('black').fontSize(14).text('Resumo Executivo', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);

  if (role === 'planner') {
    doc.text('Análise de Mercado e Persona:');
    doc.text('- Persona primária: Mulheres de 25-45 anos, focadas em praticidade.');
    doc.text('- Dores mapeadas: Falta de tempo, dificuldade de organização.');
    doc.text('- Solução do Produto: Design ergonômico e eficiência rápida.');
  } else if (role === 'monitor') {
    doc.text('Levantamento de Concorrência:');
    doc.text('- Concorrente A: R$ 99,90 (Frete grátis, qualidade inferior)');
    doc.text('- Concorrente B: R$ 129,90 (Marca premium, entrega demorada)');
    doc.text('- Nosso Preço Alvo: R$ 109,90 (Posicionamento Custo/Benefício)');
  } else if (role === 'briefing') {
    doc.text('Product Playbook (Briefing Executivo de Execução):');
    doc.text('1. Dor do Cliente: Necessidade de resolver problemas em minutos.');
    doc.text('2. Nossa Solução: O produto mais rápido da categoria.');
    doc.text('3. Diferencial (Ângulo): "Recupere o seu tempo".');
    doc.text('4. Quebras de Objeção: "Não é frágil, tem garantia de 1 ano."');
  } else if (role === 'arte') {
    doc.text('Pacote de Criativos (Assets Visuais):');
    doc.text('- 3x Banners para Facebook Ads (Foco em conversão).');
    doc.text('- 2x Vídeos UGC (TikTok/Reels).');
    doc.text('- 5x Imagens High-end para Carrossel Nuvemshop.');
  } else if (role === 'seo') {
    doc.text('Dossiê SEO e Copywriting:');
    doc.text('- Título H1 Otimizado: "Produto X - Solução Definitiva".');
    doc.text('- Meta Descrição: "Compre o Produto X e resolva Y em minutos."');
    doc.text('- Palavras-chave: produto x, comprar produto x, solução y.');
  } else {
    doc.text('Relatório em processamento.');
  }

  doc.moveDown(3);
  doc.fillColor('gray').fontSize(10).text('123Mart Brain - Gerado automaticamente', { align: 'center' });
  
  // Finalize PDF file
  doc.end();
};
