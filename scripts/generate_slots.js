import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Output directory
const outputDir = path.join(process.cwd(), 'public', 'assets', 'slots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1200x1200 standard high resolution
const WIDTH = 1200;
const HEIGHT = 1200;

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Creates high-contrast, mobile-first advertising compositions:
 * - Preserves authentic product ambient usage environments (towels, laundry room, washer)
 * - Large, punchy typography (instantly readable at 300px thumbnail on mobile phones)
 * - 100% compliant with marketplaces (NO "123Mart", NO seller branding, NO watermarks)
 * - Optimized strictly under 100 KB in both JPG and WebP
 */
async function generateAllSlots() {
  console.log('--- Iniciando Geração dos 8 Slots Mobile-First ---');

  // =========================================================================
  // SLOT 1: CAPA OFICIAL MARKETPLACE (Fundo 100% Branco Puro, sem textos)
  // Regra absoluta do Mercado Livre / Shopee / Nuvemshop para a Imagem 1:
  // Produto centralizado em fundo branco puro (#FFFFFF) com sombra de estúdio suave.
  // =========================================================================
  {
    console.log('Gerando Slot 1 (Capa Oficial 100% Fundo Branco)...');
    const isolatedPath = path.join(process.cwd(), 'public', 'assets', 'tuff_isolated.png');
    const tuffImg = sharp(isolatedPath);
    const tuffResized = await tuffImg.resize(780, 780, { fit: 'inside' }).toBuffer();
    const tuffMeta = await sharp(tuffResized).metadata();

    const shadowSvg = `
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.32" />
            <stop offset="60%" stop-color="#000000" stop-opacity="0.10" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="coreShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="600" cy="980" rx="340" ry="38" fill="url(#shadowGrad)" />
        <ellipse cx="600" cy="975" rx="220" ry="18" fill="url(#coreShadow)" />
      </svg>
    `;

    const tuffTop = Math.round((HEIGHT - (tuffMeta.height || 780)) / 2) + 10;
    const tuffLeft = Math.round((WIDTH - (tuffMeta.width || 780)) / 2);

    const slot1Jpg = await sharp({
      create: {
        width: WIDTH,
        height: HEIGHT,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .composite([
      { input: Buffer.from(shadowSvg), top: 0, left: 0 },
      { input: tuffResized, top: tuffTop, left: tuffLeft }
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(outputDir, 'slot_1.jpg'));

    const slot1Webp = await sharp({
      create: {
        width: WIDTH,
        height: HEIGHT,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .composite([
      { input: Buffer.from(shadowSvg), top: 0, left: 0 },
      { input: tuffResized, top: tuffTop, left: tuffLeft }
    ])
    .webp({ quality: 84 })
    .toFile(path.join(outputDir, 'slot_1.webp'));

    console.log(`Slot 1 gerado: JPG: ${(slot1Jpg.size / 1024).toFixed(1)} KB | WebP: ${(slot1Webp.size / 1024).toFixed(1)} KB`);
  }

  // Helper for generating ambient overlays with big mobile typography
  async function compositeAmbientSlot({
    slotNum,
    baseImageName,
    topBadge,
    topBadgeColor = '#0284c7', // Sky Blue
    mainHeadline,
    headlineHighlight,
    subPill,
    subPillColor = '#f59e0b'
  }) {
    console.log(`Gerando Slot ${slotNum} com foto de ambiente (${baseImageName})...`);
    const baseImgPath = path.join(process.cwd(), 'public', 'assets', baseImageName);
    
    // Scale base image to cover 1200x1200
    const baseBuffer = await sharp(baseImgPath)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    // Mobile-First Typography Vector Overlay (Big, readable on mobile, ZERO store branding)
    const overlaySvg = `
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Soft gradient scrim at top to make text 100% readable over any ambient background -->
          <linearGradient id="topScrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#050b1a" stop-opacity="0.96" />
            <stop offset="50%" stop-color="#0f172a" stop-opacity="0.88" />
            <stop offset="85%" stop-color="#0f172a" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
          </linearGradient>

          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.5" />
          </filter>
        </defs>

        <!-- Top Dark Scrim Gradient -->
        <rect x="0" y="0" width="${WIDTH}" height="390" fill="url(#topScrim)" />

        <!-- 1. Top Mini-Badge / Category Pill -->
        <g transform="translate(60, 48)">
          <rect x="0" y="0" width="320" height="42" rx="21" fill="${topBadgeColor}" filter="url(#cardShadow)" />
          <text x="160" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="900" fill="#ffffff" letter-spacing="1.5" text-anchor="middle">
            ${escapeXml(topBadge.toUpperCase())}
          </text>
        </g>

        <!-- 2. Main High-Impact Headline (HUGE 54px Bold - Legible on phone screens) -->
        <g transform="translate(60, 155)">
          <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="52" font-weight="900" fill="#ffffff" letter-spacing="-0.5" filter="url(#cardShadow)">
            ${escapeXml(mainHeadline.toUpperCase())}
          </text>
        </g>

        <!-- 3. Headline Highlight (Accent Yellow/Green/Cyan, 38px Bold) -->
        <g transform="translate(60, 218)">
          <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="38" font-weight="900" fill="#facc15" letter-spacing="0.5" filter="url(#cardShadow)">
            ${escapeXml(headlineHighlight.toUpperCase())}
          </text>
        </g>

        <!-- 4. Sub-Pill / Key Feature Tag (Mobile friendly contrast) -->
        <g transform="translate(60, 260)">
          <rect x="0" y="0" rx="14" ry="14" width="700" height="48" fill="#0f172a" fill-opacity="0.92" stroke="#334155" stroke-width="2" filter="url(#cardShadow)" />
          <circle cx="24" cy="24" r="8" fill="${subPillColor}" />
          <text x="46" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="23" font-weight="800" fill="#f8fafc">
            ${escapeXml(subPill)}
          </text>
        </g>
      </svg>
    `;

    // Process JPG (guarantee <= 95 KB)
    const jpgPath = path.join(outputDir, `slot_${slotNum}.jpg`);
    let q = 68;
    let jpgRes = await sharp(baseBuffer)
      .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
      .jpeg({ quality: q, mozjpeg: true })
      .toFile(jpgPath);

    while (jpgRes.size > 95 * 1024 && q > 40) {
      q -= 5;
      jpgRes = await sharp(baseBuffer)
        .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
        .jpeg({ quality: q, mozjpeg: true })
        .toFile(jpgPath);
    }

    // Process WebP (guarantee <= 75 KB)
    const webpPath = path.join(outputDir, `slot_${slotNum}.webp`);
    let wq = 70;
    let webpRes = await sharp(baseBuffer)
      .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
      .webp({ quality: wq })
      .toFile(webpPath);

    while (webpRes.size > 75 * 1024 && wq > 40) {
      wq -= 5;
      webpRes = await sharp(baseBuffer)
        .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
        .webp({ quality: wq })
        .toFile(webpPath);
    }

    console.log(`Slot ${slotNum} final: JPG: ${(jpgRes.size / 1024).toFixed(1)} KB (q=${q}) | WebP: ${(webpRes.size / 1024).toFixed(1)} KB (wq=${wq})`);
  }

  // =========================================================================
  // SLOT 2: AMBIENTE TOALHAS & ACONCHEGO (Foto 2 Nuvemshop) - Rendimento 15L
  // =========================================================================
  await compositeAmbientSlot({
    slotNum: 2,
    baseImageName: 'nuvem_2.jpg',
    topBadge: 'Rendimento Máximo',
    topBadgeColor: '#0284c7', // Sky Blue
    mainHeadline: '1 Pote Rende 15 Litros',
    headlineHighlight: 'Equivale a 5 Galões de Supermercado',
    subPill: 'Fórmula Pura Concentrada: Dilua na Torneira',
    subPillColor: '#38bdf8'
  });

  // =========================================================================
  // SLOT 3: AMBIENTE MÁQUINA DE LAVAR (Foto 3 Nuvemshop) - Textura Cremosa
  // =========================================================================
  await compositeAmbientSlot({
    slotNum: 3,
    baseImageName: 'nuvem_3.jpg',
    topBadge: 'Consistência & Viscosidade',
    topBadgeColor: '#059669', // Emerald
    mainHeadline: 'Textura Cremosa Encorpada',
    headlineHighlight: 'Não Fica Rala & Não Separa com o Tempo',
    subPill: 'Você Controla a Densidade: Dilua de 10L a 15L',
    subPillColor: '#34d399'
  });

  // =========================================================================
  // SLOT 4: AMBIENTE LAVANDERIA MODERNA (Foto 4 Nuvemshop) - Perfumaria Fina
  // =========================================================================
  await compositeAmbientSlot({
    slotNum: 4,
    baseImageName: 'nuvem_4.jpg',
    topBadge: 'Fragrância Prolongada',
    topBadgeColor: '#7c3aed', // Violet
    mainHeadline: 'Perfumaria Fina de Alta Fixação',
    headlineHighlight: 'Microcápsulas que Amaciam as Fibras',
    subPill: 'Roupas Perfumadas por Dias no Guarda-Roupa',
    subPillColor: '#c084fc'
  });

  // =========================================================================
  // SLOT 5: ECONOMIA REAL (Foto 2 Ambientada) - Contraste R$ 3,63 / Litro
  // =========================================================================
  await compositeAmbientSlot({
    slotNum: 5,
    baseImageName: 'nuvem_2.jpg',
    topBadge: 'Economia Comprovada',
    topBadgeColor: '#d97706', // Amber
    mainHeadline: 'Apenas R$ 3,63 por Litro',
    headlineHighlight: 'Economize até 80% em Relação ao Mercado',
    subPill: 'Pare de Pagar por Água em Galões Pesados',
    subPillColor: '#fbbf24'
  });

  // =========================================================================
  // SLOT 6: PREPARO FÁCIL A FRIO (Foto 3 Ambientada) - 3 Passos Simples
  // =========================================================================
  await compositeAmbientSlot({
    slotNum: 6,
    baseImageName: 'nuvem_3.jpg',
    topBadge: 'Preparo Rápido',
    topBadgeColor: '#0891b2', // Cyan
    mainHeadline: 'Dissolução Instantânea a Frio',
    headlineHighlight: '1. Coloque a Base • 2. Adicione Água • 3. Misture',
    subPill: 'Não Precisa Ferver Água nem Usar Batedeira',
    subPillColor: '#22d3ee'
  });

  // =========================================================================
  // SLOT 7: LOGÍSTICA & FRETE LEVE (Foto 7 Nuvemshop) - Pote 900g
  // =========================================================================
  await compositeAmbientSlot({
    slotNum: 7,
    baseImageName: 'nuvem_7.jpg',
    topBadge: 'Embalagem Compacta',
    topBadgeColor: '#e11d48', // Rose
    mainHeadline: 'Pote 900g: Frete Mais Barato',
    headlineHighlight: 'Envio 15x Mais Leve que Galões de Água',
    subPill: 'Lacre Industrial Reforçado: Zero Risco de Vazar',
    subPillColor: '#fb7185'
  });

  // =========================================================================
  // SLOT 8: QUALIDADE & GARANTIA INDUSTRIAL (Foto 8 Nuvemshop)
  // =========================================================================
  await compositeAmbientSlot({
    slotNum: 8,
    baseImageName: 'nuvem_8.jpg',
    topBadge: 'Garantia de Qualidade',
    topBadgeColor: '#15803d', // Green
    mainHeadline: 'Fórmula Testada & Aprovada',
    headlineHighlight: 'Não Mancha Roupas & Cuida da Máquina',
    subPill: 'Qualidade Start Química com Validade de 6 Meses',
    subPillColor: '#4ade80'
  });

  console.log('--- Todos os 8 Slots foram gerados com sucesso! ---');
}

generateAllSlots().catch(err => {
  console.error('Erro na geração dos slots:', err);
  process.exit(1);
});
