import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outputDir = path.join(process.cwd(), 'public', 'assets', 'slots_09168');
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

async function run() {
  console.log('=== Iniciando Geração dos 8 Slots para SKU 123Mart09168 ===');
  console.log('Regra de ouro: ZERO tarjas pretas. Strict compositing e Mobile-First typography.');

  const isolatedPath = path.join(process.cwd(), 'public', 'assets', 'qualifood_isolated.png');

  // =========================================================================
  // SLOT 1: CAPA OFICIAL MARKETPLACE (Fundo 100% Branco Puro #FFFFFF)
  // =========================================================================
  {
    console.log('\n[Slot 1] Gerando Capa Oficial (Fundo 100% Branco Puro)...');
    
    // Resize ONLY with fit: inside (preserves true aspect ratio, absolutely NO letterboxing or black margins)
    const bottleHeight = 960;
    const bottleBuffer = await sharp(isolatedPath)
      .resize({ height: bottleHeight, fit: 'inside' })
      .toBuffer();
    const bottleMeta = await sharp(bottleBuffer).metadata();
    const bottleWidth = bottleMeta.width || 267;
    const bottleLeft = Math.round((WIDTH - bottleWidth) / 2);
    const bottleTop = 110;

    // Realistic studio ground shadow
    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.32" />
            <stop offset="60%" stop-color="#000000" stop-opacity="0.08" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="coreShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="600" cy="${bottleTop + bottleHeight - 12}" rx="170" ry="24" fill="url(#shadowGrad)" />
        <ellipse cx="600" cy="${bottleTop + bottleHeight - 14}" rx="110" ry="12" fill="url(#coreShadow)" />
      </svg>
    `);

    // Slot 1 JPG
    const slot1JpgPath = path.join(outputDir, 'slot_1.jpg');
    let q = 85;
    let jpgRes = await sharp({
      create: {
        width: WIDTH,
        height: HEIGHT,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: bottleBuffer, top: bottleTop, left: bottleLeft }
    ])
    .jpeg({ quality: q, mozjpeg: true })
    .toFile(slot1JpgPath);

    while (jpgRes.size > 90 * 1024 && q > 40) {
      q -= 5;
      jpgRes = await sharp({
        create: { width: WIDTH, height: HEIGHT, channels: 3, background: { r: 255, g: 255, b: 255 } }
      })
      .composite([
        { input: shadowSvg, top: 0, left: 0 },
        { input: bottleBuffer, top: bottleTop, left: bottleLeft }
      ])
      .jpeg({ quality: q, mozjpeg: true })
      .toFile(slot1JpgPath);
    }

    // Slot 1 WebP
    const slot1WebpPath = path.join(outputDir, 'slot_1.webp');
    let wq = 85;
    let webpRes = await sharp({
      create: { width: WIDTH, height: HEIGHT, channels: 3, background: { r: 255, g: 255, b: 255 } }
    })
    .composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: bottleBuffer, top: bottleTop, left: bottleLeft }
    ])
    .webp({ quality: wq })
    .toFile(slot1WebpPath);

    while (webpRes.size > 75 * 1024 && wq > 40) {
      wq -= 5;
      webpRes = await sharp({
        create: { width: WIDTH, height: HEIGHT, channels: 3, background: { r: 255, g: 255, b: 255 } }
      })
      .composite([
        { input: shadowSvg, top: 0, left: 0 },
        { input: bottleBuffer, top: bottleTop, left: bottleLeft }
      ])
      .webp({ quality: wq })
      .toFile(slot1WebpPath);
    }

    console.log(`✓ Slot 1 gerado: JPG: ${(jpgRes.size / 1024).toFixed(1)} KB (q=${q}) | WebP: ${(webpRes.size / 1024).toFixed(1)} KB (wq=${wq})`);
  }

  // =========================================================================
  // HELPER PARA SLOTS AMBIENTADOS (SLOTS 2 A 8)
  // =========================================================================
  async function compositeAmbientSlot({
    slotNum,
    bgFilename,
    categoryBadge,
    categoryColor = '#059669', // Emerald
    headline,
    bullet1,
    bullet2,
    calloutText,
    calloutColor = '#0284c7', // Sky Blue
    bottleX = 140, // Left side position for bottle
    bottleScaleHeight = 840,
    bottleY = 270
  }) {
    console.log(`\n[Slot ${slotNum}] Gerando Slot Ambientado (${categoryBadge})...`);
    const bgPath = path.join(process.cwd(), 'src', 'assets', 'images', bgFilename);
    
    // Scale base image to cover 1200x1200
    const bgBuffer = await sharp(bgPath)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    // Prepare bottle resized strictly with fit: inside (NO letterbox, NO black border)
    const bottleBuffer = await sharp(isolatedPath)
      .resize({ height: bottleScaleHeight, fit: 'inside' })
      .toBuffer();
    const bottleMeta = await sharp(bottleBuffer).metadata();
    const bottleWidth = bottleMeta.width || 234;

    // Soft realistic shadow under bottle base
    const shadowCx = bottleX + Math.round(bottleWidth / 2);
    const shadowCy = bottleY + bottleScaleHeight - 10;
    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ambShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.55" />
            <stop offset="50%" stop-color="#000000" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="coreAmbShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.75" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="${shadowCx}" cy="${shadowCy}" rx="140" ry="22" fill="url(#ambShadow)" />
        <ellipse cx="${shadowCx}" cy="${shadowCy - 2}" rx="85" ry="12" fill="url(#coreAmbShadow)" />
      </svg>
    `);

    // Mobile-First Typography Vector Overlay
    // Clean, high contrast, readable on smartphone screen, ZERO seller branding ("123Mart")
    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Top subtle scrim to guarantee high contrast readability -->
          <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#090d16" stop-opacity="0.94" />
            <stop offset="45%" stop-color="#090d16" stop-opacity="0.82" />
            <stop offset="80%" stop-color="#0f172a" stop-opacity="0.30" />
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
          </linearGradient>

          <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#000000" flood-opacity="0.6" />
          </filter>
        </defs>

        <!-- Top Scrim -->
        <rect x="0" y="0" width="${WIDTH}" height="320" fill="url(#scrim)" />

        <!-- 1. Category Pill -->
        <g transform="translate(60, 42)">
          <rect x="0" y="0" width="310" height="42" rx="21" fill="${categoryColor}" filter="url(#dropShadow)" />
          <text x="155" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="900" fill="#ffffff" letter-spacing="1.5" text-anchor="middle">
            ${escapeXml(categoryBadge.toUpperCase())}
          </text>
        </g>

        <!-- 2. Main Headline (Huge 48px Bold Mobile-First) -->
        <g transform="translate(60, 138)">
          <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="900" fill="#ffffff" letter-spacing="-0.5" filter="url(#dropShadow)">
            ${escapeXml(headline.toUpperCase())}
          </text>
        </g>

        <!-- 3. Key Benefits Card (Right Side or Floating Header) -->
        <g transform="translate(480, 200)" filter="url(#dropShadow)">
          <rect x="0" y="0" width="660" height="150" rx="16" fill="#0f172a" fill-opacity="0.88" stroke="#334155" stroke-width="2" />
          
          <!-- Bullet 1 -->
          <circle cx="36" cy="45" r="14" fill="#10b981" />
          <path d="M30 45 L34 49 L42 41" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <text x="64" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="700" fill="#f8fafc">
            ${escapeXml(bullet1)}
          </text>

          <!-- Bullet 2 -->
          <circle cx="36" cy="105" r="14" fill="#10b981" />
          <path d="M30 105 L34 109 L42 101" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <text x="64" y="112" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="700" fill="#f8fafc">
            ${escapeXml(bullet2)}
          </text>
        </g>

        <!-- 4. Bottom Callout Badge on Product Footprint -->
        <g transform="translate(${bottleX - 20}, ${bottleY + bottleScaleHeight - 35})" filter="url(#dropShadow)">
          <rect x="0" y="0" width="${bottleWidth + 40}" height="44" rx="12" fill="${calloutColor}" />
          <text x="${(bottleWidth + 40) / 2}" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="900" fill="#ffffff" letter-spacing="1" text-anchor="middle">
            ${escapeXml(calloutText.toUpperCase())}
          </text>
        </g>
      </svg>
    `);

    // Layer Composite in exact order: Background -> Shadow -> Bottle -> Vector Overlay
    const composed = sharp(bgBuffer)
      .composite([
        { input: shadowSvg, top: 0, left: 0 },
        { input: bottleBuffer, top: bottleY, left: bottleX },
        { input: overlaySvg, top: 0, left: 0 }
      ]);

    // JPG Generation (< 90 KB)
    const jpgPath = path.join(outputDir, `slot_${slotNum}.jpg`);
    let q = 70;
    let jpgRes = await composed
      .clone()
      .jpeg({ quality: q, mozjpeg: true })
      .toFile(jpgPath);

    while (jpgRes.size > 89 * 1024 && q > 38) {
      q -= 4;
      jpgRes = await composed
        .clone()
        .jpeg({ quality: q, mozjpeg: true })
        .toFile(jpgPath);
    }

    // WebP Generation (< 75 KB)
    const webpPath = path.join(outputDir, `slot_${slotNum}.webp`);
    let wq = 72;
    let webpRes = await composed
      .clone()
      .webp({ quality: wq })
      .toFile(webpPath);

    while (webpRes.size > 74 * 1024 && wq > 38) {
      wq -= 4;
      webpRes = await composed
        .clone()
        .webp({ quality: wq })
        .toFile(webpPath);
    }

    console.log(`✓ Slot ${slotNum} gerado: JPG: ${(jpgRes.size / 1024).toFixed(1)} KB (q=${q}) | WebP: ${(webpRes.size / 1024).toFixed(1)} KB (wq=${wq})`);
  }

  // =========================================================================
  // SLOTS 2 A 8
  // =========================================================================

  // Slot 2: Frutas & Vegetais
  await compositeAmbientSlot({
    slotNum: 2,
    bgFilename: 'qualifood_bg_kitchen_fruits_1793658239072.jpg',
    categoryBadge: 'Higiene de Alimentos',
    categoryColor: '#059669', // Emerald
    headline: 'Desinfecção Total de Frutas & Vegetais',
    bullet1: 'Elimina agrotóxicos superficiais e bactérias',
    bullet2: 'Preserva a crocância e frescor dos alimentos',
    calloutText: 'Lava & Desinfeta',
    calloutColor: '#0284c7',
    bottleX: 130
  });

  // Slot 3: Mamadeiras & Maternidade
  await compositeAmbientSlot({
    slotNum: 3,
    bgFilename: 'qualifood_bg_baby_maternity_1793658253259.jpg',
    categoryBadge: 'Maternidade & Bebê',
    categoryColor: '#0284c7', // Sky Blue
    headline: '100% Seguro para Mamadeiras & Chupetas',
    bullet1: 'Higienização hospitalar para bicos e utensílios',
    bullet2: 'Zero resíduo tóxico: pureza total para o bebê',
    calloutText: 'Cuidado Materno',
    calloutColor: '#0369a1',
    bottleX: 130
  });

  // Slot 4: Rendimento 58 Litros
  await compositeAmbientSlot({
    slotNum: 4,
    bgFilename: 'qualifood_bg_yield_pitcher_1793658266221.jpg',
    categoryBadge: 'Rendimento Máximo',
    categoryColor: '#d97706', // Amber
    headline: '1 Frasco Rende até 58 Litros de Solução',
    bullet1: 'Apenas 6 mL por litro de água da torneira',
    bullet2: 'Mais de 58 bacias de lavagem por frasco',
    calloutText: '6 mL = 1 Litro',
    calloutColor: '#b45309',
    bottleX: 130
  });

  // Slot 5: Eficácia Comprovada Laboratório
  await compositeAmbientSlot({
    slotNum: 5,
    bgFilename: 'qualifood_bg_kitchen_fruits_1793658239072.jpg',
    categoryBadge: 'Eficácia Comprovada',
    categoryColor: '#e11d48', // Rose
    headline: 'Elimina E. Coli & Enterococcus',
    bullet1: 'Ação bactericida testada em laboratório',
    bullet2: 'Barreira definitiva contra contaminações',
    calloutText: 'Eficácia 99,9%',
    calloutColor: '#be123c',
    bottleX: 130
  });

  // Slot 6: Modo de Aplicação 10 Minutos
  await compositeAmbientSlot({
    slotNum: 6,
    bgFilename: 'qualifood_bg_soaking_bowl_1793658279146.jpg',
    categoryBadge: 'Preparo Rápido',
    categoryColor: '#0891b2', // Cyan
    headline: 'Desinfecção Completa em 10 Minutos',
    bullet1: '1. Lave em água • 2. Deixe 10 min de molho',
    bullet2: '3. Enxágue e pronto: praticidade diária',
    calloutText: 'Apenas 10 Min',
    calloutColor: '#0e7490',
    bottleX: 130
  });

  // Slot 7: Pureza Sensorial (Sem cheiro nem gosto)
  await compositeAmbientSlot({
    slotNum: 7,
    bgFilename: 'qualifood_bg_kitchen_fruits_1793658239072.jpg',
    categoryBadge: 'Aroma & Sabor Neutros',
    categoryColor: '#047857', // Forest Emerald
    headline: 'Não Altera o Sabor nem o Cheiro',
    bullet1: 'Zero resíduo: frutas e legumes com sabor puro',
    bullet2: 'Sem cloro agressivo: preserva o aroma natural',
    calloutText: 'Sabor Natural',
    calloutColor: '#065f46',
    bottleX: 130
  });

  // Slot 8: Fórmula Biodegradável & Segura
  await compositeAmbientSlot({
    slotNum: 8,
    bgFilename: 'qualifood_bg_soaking_bowl_1793658279146.jpg',
    categoryBadge: 'Eco-Friendly & Seguro',
    categoryColor: '#0f766e', // Teal
    headline: 'Fórmula Biodegradável & Segura',
    bullet1: 'Amiga do meio ambiente e atóxica para o lar',
    bullet2: 'Padrão profissional Qualifood com nota fiscal',
    calloutText: 'Biodegradável',
    calloutColor: '#115e59',
    bottleX: 130
  });

  console.log('\n=== Todos os 8 Slots de SKU 123Mart09168 Gerados com Sucesso! ===');
}

run().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
