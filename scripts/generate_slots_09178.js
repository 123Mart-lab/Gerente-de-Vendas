import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outputDir = path.join(process.cwd(), 'public', 'assets', 'slots_09178');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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

async function saveOptimized(imagePipeline, slotNum) {
  const jpgPath = path.join(outputDir, `slot_${slotNum}.jpg`);
  const webpPath = path.join(outputDir, `slot_${slotNum}.webp`);

  if (slotNum === 1) {
    const jpgBuf = await imagePipeline.clone().jpeg({ quality: 84, mozjpeg: true }).toBuffer();
    const webpBuf = await imagePipeline.clone().webp({ quality: 80, effort: 2 }).toBuffer();
    fs.writeFileSync(jpgPath, jpgBuf);
    fs.writeFileSync(webpPath, webpBuf);
    console.log(`✓ Slot 1 gravado: JPG ${(jpgBuf.length / 1024).toFixed(1)} KB | WebP ${(webpBuf.length / 1024).toFixed(1)} KB`);
    return;
  }

  let q = 38;
  let jpgBuffer = await imagePipeline.clone().jpeg({ quality: q, mozjpeg: true, chromaSubsampling: '4:2:0' }).toBuffer();
  while (jpgBuffer.length > 88 * 1024 && q > 18) {
    q -= 4;
    jpgBuffer = await imagePipeline.clone().jpeg({ quality: q, mozjpeg: true, chromaSubsampling: '4:2:0' }).toBuffer();
  }
  fs.writeFileSync(jpgPath, jpgBuffer);

  let wq = 34;
  let webpBuffer = await imagePipeline.clone().webp({ quality: wq, effort: 2 }).toBuffer();
  while (webpBuffer.length > 74 * 1024 && wq > 18) {
    wq -= 4;
    webpBuffer = await imagePipeline.clone().webp({ quality: wq, effort: 2 }).toBuffer();
  }
  fs.writeFileSync(webpPath, webpBuffer);

  console.log(`✓ Slot ${slotNum} gravado: JPG ${(jpgBuffer.length / 1024).toFixed(1)} KB (q=${q}) | WebP ${(webpBuffer.length / 1024).toFixed(1)} KB (wq=${wq})`);
}

async function run() {
  console.log('=== Iniciando Geração dos 8 Slots Publicitários Profissionais SKU 123Mart09178 (Cloro Triaction 3,5kg) ===');
  console.log('Diretrizes: Ambientes Reais de Piscina, Balde 3,5kg Isolado sem Fundo Branco Colado, Tipografia Mobile-First, ZERO menção a 123Mart.');

  const fotoBucket = path.join(outputDir, 'foto_1.png');

  const imgDir = path.join(process.cwd(), 'src', 'assets', 'images');
  const bgSunnyPool = path.join(imgDir, 'aquapool_bg_swimming_pool_sunny_1793708114754.jpg');
  const bgWaterRipples = path.join(imgDir, 'aquapool_bg_pool_water_ripples_1793708114823.jpg');
  const bgBackyardPatio = path.join(imgDir, 'aquapool_bg_backyard_patio_1793708115599.jpg');
  const bgSkimmer = path.join(imgDir, 'aquapool_bg_skimmer_filter_1793708116485.jpg');

  // =========================================================================
  // SLOT 1: CAPA OFICIAL MARKETPLACE (Fundo 100% Branco Puro #FFFFFF)
  // =========================================================================
  {
    console.log('\n[Slot 1] Capa Oficial (Fundo 100% Branco Puro #FFFFFF)...');
    const bucketHeight = 780;
    const bucketBuffer = await sharp(fotoBucket)
      .resize({ height: bucketHeight, fit: 'inside' })
      .toBuffer();
    const bucketMeta = await sharp(bucketBuffer).metadata();
    const bucketWidth = bucketMeta.width || 700;
    const bucketLeft = Math.round((WIDTH - bucketWidth) / 2);
    const bucketTop = 210;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.35" />
            <stop offset="60%" stop-color="#000000" stop-opacity="0.10" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="coreShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.60" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="600" cy="${bucketTop + bucketHeight - 16}" rx="360" ry="32" fill="url(#shadowGrad)" />
        <ellipse cx="600" cy="${bucketTop + bucketHeight - 18}" rx="240" ry="16" fill="url(#coreShadow)" />
      </svg>
    `);

    const p = sharp({
      create: { width: WIDTH, height: HEIGHT, channels: 3, background: { r: 255, g: 255, b: 255 } }
    }).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: bucketBuffer, top: bucketTop, left: bucketLeft }
    ]);

    await saveOptimized(p, 1);
  }

  // =========================================================================
  // SLOT 2: AMBIENTE REAL DE USO - PISCINA CRISTALINA & AÇÃO 3 EM 1
  // =========================================================================
  {
    console.log('\n[Slot 2] Piscina Ensolarada & Ação Completa 3 em 1...');
    const bgBuffer = await sharp(bgSunnyPool)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const bucketHeight = 650;
    const bucketBuffer = await sharp(fotoBucket)
      .resize({ height: bucketHeight, fit: 'inside' })
      .toBuffer();
    const bucketMeta = await sharp(bucketBuffer).metadata();
    const bucketWidth = bucketMeta.width || 580;
    const bucketLeft = 570;
    const bucketTop = 470;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${bucketLeft + Math.round(bucketWidth / 2)}" cy="${bucketTop + bucketHeight - 14}" rx="260" ry="26" fill="#000000" fill-opacity="0.65" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f2" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.4" />
          </filter>
        </defs>

        <!-- Header Card Flutuante Mobile-First -->
        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="240" rx="24" fill="#0b1e36" fill-opacity="0.94" stroke="#38bdf8" stroke-width="2.5" filter="url(#f2)" />
          
          <text x="36" y="52" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="2">
            TRATAMENTO COMPLETO DE PISCINAS
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="50" font-weight="900">
            AÇÃO 3 EM 1: DESINFETA, CLARIFICA &amp; PREVINE
          </text>

          <text x="36" y="172" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700">
            Elimina 99,9% das bactérias e mantém a água 100% cristalina
          </text>
          <text x="36" y="210" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="23" font-weight="600">
            Ideal para piscinas de Fibra, Vinil, Alvenaria e Pintura
          </text>
        </g>

        <!-- Card Lateral com Benefícios em Destaque -->
        <g transform="translate(48, 330)">
          <rect x="0" y="0" width="510" height="270" rx="20" fill="#0f2b48" fill-opacity="0.92" stroke="#0284c7" stroke-width="2" filter="url(#f2)" />
          
          <g transform="translate(24, 48)">
            <circle cx="18" cy="18" r="18" fill="#0284c7" />
            <path d="M11 18 L16 23 L25 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Desinfecção Poderosa
            </text>
            <text x="52" y="58" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="600">
              Ação bactericida e oxidante imediata
            </text>
          </g>

          <g transform="translate(24, 156)">
            <circle cx="18" cy="18" r="18" fill="#059669" />
            <path d="M11 18 L16 23 L25 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Clarificante &amp; Algistático
            </text>
            <text x="52" y="58" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="600">
              Impede água turva e paredes esverdeadas
            </text>
          </g>
        </g>

        <!-- Selo de Ação no Canto Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#0284c7" filter="url(#f2)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            PISCINA PURA &amp; PROTEGIDA
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: bucketBuffer, top: bucketTop, left: bucketLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 2);
  }

  // =========================================================================
  // SLOT 3: RESISTÊNCIA SOLAR & FÓRMULA ESTABILIZADA UV
  // =========================================================================
  {
    console.log('\n[Slot 3] Fórmula Estabilizada & Resistência UV...');
    const bgBuffer = await sharp(bgWaterRipples)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .modulate({ brightness: 0.95, saturation: 1.25 })
      .toBuffer();

    const bucketHeight = 650;
    const bucketBuffer = await sharp(fotoBucket)
      .resize({ height: bucketHeight, fit: 'inside' })
      .toBuffer();
    const bucketMeta = await sharp(bucketBuffer).metadata();
    const bucketWidth = bucketMeta.width || 580;
    const bucketLeft = 570;
    const bucketTop = 470;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${bucketLeft + Math.round(bucketWidth / 2)}" cy="${bucketTop + bucketHeight - 14}" rx="260" ry="26" fill="#000000" fill-opacity="0.65" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f3" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.4" />
          </filter>
        </defs>

        <!-- Header Card Flutuante -->
        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="230" rx="24" fill="#0b1e36" fill-opacity="0.94" stroke="#f59e0b" stroke-width="2.5" filter="url(#f3)" />
          
          <text x="36" y="52" fill="#FBBF24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="2">
            PROTEÇÃO CONTRA A LUZ SOLAR
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="900">
            FÓRMULA ESTABILIZADA: NÃO EVAPORA AO SOL
          </text>

          <text x="36" y="172" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700">
            Resiste aos raios UV mantendo o cloro ativo por dias
          </text>
        </g>

        <!-- Card de Comparação e Benefícios -->
        <g transform="translate(48, 320)">
          <rect x="0" y="0" width="510" height="310" rx="20" fill="#0f2b48" fill-opacity="0.94" stroke="#d97706" stroke-width="2" filter="url(#f3)" />
          
          <g transform="translate(24, 46)">
            <circle cx="18" cy="18" r="18" fill="#f59e0b" />
            <path d="M11 18 L16 23 L25 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Sem Reposição Diária
            </text>
            <text x="52" y="58" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="600">
              Economia real no consumo do produto
            </text>
          </g>

          <g transform="translate(24, 150)">
            <circle cx="18" cy="18" r="18" fill="#0284c7" />
            <path d="M11 18 L16 23 L25 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Teor Ativo Preservado
            </text>
            <text x="52" y="58" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="600">
              Ação sanitizante contínua no verão
            </text>
          </g>

          <g transform="translate(24, 250)">
            <rect x="0" y="0" width="462" height="40" rx="8" fill="#1e3a5f" />
            <text x="231" y="26" fill="#FBBF24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" text-anchor="middle">
              MENOS CLORO, MAIS PROTEÇÃO CONTÍNUA
            </text>
          </g>
        </g>

        <!-- Selo Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#d97706" filter="url(#f3)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            PROTEÇÃO UV MÁXIMA
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: bucketBuffer, top: bucketTop, left: bucketLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 3);
  }

  // =========================================================================
  // SLOT 4: ECONOMIA REAL & RENDIMENTO BALDE 3,5KG
  // =========================================================================
  {
    console.log('\n[Slot 4] Balde Econômico 3,5kg & Custo-Benefício...');
    const bgBuffer = await sharp(bgBackyardPatio)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const bucketHeight = 650;
    const bucketBuffer = await sharp(fotoBucket)
      .resize({ height: bucketHeight, fit: 'inside' })
      .toBuffer();
    const bucketMeta = await sharp(bucketBuffer).metadata();
    const bucketWidth = bucketMeta.width || 580;
    const bucketLeft = 570;
    const bucketTop = 470;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${bucketLeft + Math.round(bucketWidth / 2)}" cy="${bucketTop + bucketHeight - 14}" rx="260" ry="26" fill="#000000" fill-opacity="0.65" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f4" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.4" />
          </filter>
        </defs>

        <!-- Header Card Flutuante -->
        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="230" rx="24" fill="#0b1e36" fill-opacity="0.94" stroke="#10b981" stroke-width="2.5" filter="url(#f4)" />
          
          <text x="36" y="52" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="2">
            MÁXIMO CUSTO-BENEFÍCIO
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="900">
            BALDE 3,5KG: ALTO RENDIMENTO POR M³
          </text>

          <text x="36" y="172" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700">
            Dura muito mais: dosagem concentrada e econômica
          </text>
        </g>

        <!-- Card de Benefícios -->
        <g transform="translate(48, 320)">
          <rect x="0" y="0" width="510" height="280" rx="20" fill="#0f2b48" fill-opacity="0.94" stroke="#059669" stroke-width="2" filter="url(#f4)" />
          
          <g transform="translate(24, 46)">
            <circle cx="18" cy="18" r="18" fill="#10b981" />
            <path d="M11 18 L16 23 L25 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Balde Resistente &amp; Seguro
            </text>
            <text x="52" y="58" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="600">
              Lacre reforçado para casa de máquinas
            </text>
          </g>

          <g transform="translate(24, 150)">
            <circle cx="18" cy="18" r="18" fill="#0284c7" />
            <path d="M11 18 L16 23 L25 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Rendimento Prolongado
            </text>
            <text x="52" y="58" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="600">
              Atende meses de tratamento residencial
            </text>
          </g>
        </g>

        <!-- Selo Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#059669" filter="url(#f4)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            ECONOMIA COMPROVADA
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: bucketBuffer, top: bucketTop, left: bucketLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 4);
  }

  // =========================================================================
  // SLOT 5: ESPECIFICAÇÕES TÉCNICAS: RÁPIDA DISSOLUÇÃO & NÃO MANCHA
  // =========================================================================
  {
    console.log('\n[Slot 5] Especificações Técnicas & Rápida Dissolução...');
    const bgBuffer = await sharp(bgWaterRipples)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const bucketHeight = 650;
    const bucketBuffer = await sharp(fotoBucket)
      .resize({ height: bucketHeight, fit: 'inside' })
      .toBuffer();
    const bucketMeta = await sharp(bucketBuffer).metadata();
    const bucketWidth = bucketMeta.width || 580;
    const bucketLeft = 570;
    const bucketTop = 470;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${bucketLeft + Math.round(bucketWidth / 2)}" cy="${bucketTop + bucketHeight - 14}" rx="260" ry="26" fill="#000000" fill-opacity="0.65" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f5" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.4" />
          </filter>
        </defs>

        <!-- Header Card Flutuante -->
        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="230" rx="24" fill="#0b1e36" fill-opacity="0.94" stroke="#e11d48" stroke-width="2.5" filter="url(#f5)" />
          
          <text x="36" y="52" fill="#FDA4AF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="2">
            ESPECIFICAÇÕES TÉCNICAS
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="900">
            DISSOLUÇÃO TOTAL: NÃO DEIXA RESÍDUOS
          </text>

          <text x="36" y="172" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700">
            Não mancha vinil, fibra nem ataca as tubulações
          </text>
        </g>

        <!-- Card de Tabela Técnica -->
        <g transform="translate(48, 320)">
          <rect x="0" y="0" width="510" height="300" rx="20" fill="#0f2b48" fill-opacity="0.94" stroke="#be123c" stroke-width="2" filter="url(#f5)" />
          
          <g transform="translate(24, 46)">
            <circle cx="18" cy="18" r="18" fill="#e11d48" />
            <path d="M11 18 L16 23 L25 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Grânulos de Alta Pureza
            </text>
            <text x="52" y="58" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="600">
              Dissolução instantânea na água
            </text>
          </g>

          <g transform="translate(24, 150)">
            <circle cx="18" cy="18" r="18" fill="#059669" />
            <path d="M11 18 L16 23 L25 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Zero Depósito no Fundo
            </text>
            <text x="52" y="58" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="600">
              Não acumula pó no fundo da piscina
            </text>
          </g>

          <g transform="translate(24, 245)">
            <rect x="0" y="0" width="462" height="36" rx="8" fill="#1e3a5f" />
            <text x="231" y="24" fill="#FDA4AF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="800" text-anchor="middle">
              SEGURANÇA TOTAL PARA TODOS OS REVESTIMENTOS
            </text>
          </g>
        </g>

        <!-- Selo Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#be123c" filter="url(#f5)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            ALTA EFICÁCIA TÉCNICA
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: bucketBuffer, top: bucketTop, left: bucketLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 5);
  }

  // =========================================================================
  // SLOT 6: MODO DE APLICAÇÃO PRÁTICO PASSO A PASSO
  // =========================================================================
  {
    console.log('\n[Slot 6] Modo de Aplicação Passo a Passo...');
    const bgBuffer = await sharp(bgSkimmer)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const bucketHeight = 650;
    const bucketBuffer = await sharp(fotoBucket)
      .resize({ height: bucketHeight, fit: 'inside' })
      .toBuffer();
    const bucketMeta = await sharp(bucketBuffer).metadata();
    const bucketWidth = bucketMeta.width || 580;
    const bucketLeft = 570;
    const bucketTop = 470;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${bucketLeft + Math.round(bucketWidth / 2)}" cy="${bucketTop + bucketHeight - 14}" rx="260" ry="26" fill="#000000" fill-opacity="0.65" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f6" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.4" />
          </filter>
        </defs>

        <!-- Header Card Flutuante -->
        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="230" rx="24" fill="#0b1e36" fill-opacity="0.94" stroke="#0284c7" stroke-width="2.5" filter="url(#f6)" />
          
          <text x="36" y="52" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="2">
            MODO DE USAR SIMPLIFICADO
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="900">
            TRATAMENTO FÁCIL EM 3 ETAPAS
          </text>

          <text x="36" y="172" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700">
            Aplicação rápida sem mistérios para água pura
          </text>
        </g>

        <!-- Card de Passo a Passo -->
        <g transform="translate(48, 320)">
          <rect x="0" y="0" width="510" height="310" rx="20" fill="#0f2b48" fill-opacity="0.94" stroke="#0369a1" stroke-width="2" filter="url(#f6)" />
          
          <g transform="translate(24, 46)">
            <circle cx="18" cy="18" r="18" fill="#0284c7" />
            <text x="18" y="24" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" text-anchor="middle">1</text>
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">
              Medição Semanal
            </text>
            <text x="52" y="56" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600">
              Verifique pH e cloro livre com seu estojo
            </text>
          </g>

          <g transform="translate(24, 136)">
            <circle cx="18" cy="18" r="18" fill="#0284c7" />
            <text x="18" y="24" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" text-anchor="middle">2</text>
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">
              Dosagem Recomendada
            </text>
            <text x="52" y="56" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600">
              Adicione 4g para cada 1.000L de água
            </text>
          </g>

          <g transform="translate(24, 226)">
            <circle cx="18" cy="18" r="18" fill="#10b981" />
            <text x="18" y="24" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" text-anchor="middle">3</text>
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">
              Filtração Ativa
            </text>
            <text x="52" y="56" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600">
              Filtre por 6h para homogeneização total
            </text>
          </g>
        </g>

        <!-- Selo Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#0284c7" filter="url(#f6)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            APLICAÇÃO DESCOMPLICADA
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: bucketBuffer, top: bucketTop, left: bucketLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 6);
  }

  // =========================================================================
  // SLOT 7: PROTEÇÃO DOS BANHISTAS & ZERO IRRITAÇÃO
  // =========================================================================
  {
    console.log('\n[Slot 7] Proteção dos Banhistas & Zero Irritação...');
    const bgBuffer = await sharp(bgSunnyPool)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const bucketHeight = 650;
    const bucketBuffer = await sharp(fotoBucket)
      .resize({ height: bucketHeight, fit: 'inside' })
      .toBuffer();
    const bucketMeta = await sharp(bucketBuffer).metadata();
    const bucketWidth = bucketMeta.width || 580;
    const bucketLeft = 570;
    const bucketTop = 470;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${bucketLeft + Math.round(bucketWidth / 2)}" cy="${bucketTop + bucketHeight - 14}" rx="260" ry="26" fill="#000000" fill-opacity="0.65" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f7" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.4" />
          </filter>
        </defs>

        <!-- Header Card Flutuante -->
        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="230" rx="24" fill="#0b1e36" fill-opacity="0.94" stroke="#0d9488" stroke-width="2.5" filter="url(#f7)" />
          
          <text x="36" y="52" fill="#2DD4BF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="2">
            SAÚDE &amp; BEM-ESTAR DA FAMÍLIA
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="900">
            BANHO CONFORTÁVEL &amp; SEGURO
          </text>

          <text x="36" y="172" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700">
            Zero ardência nos olhos e sem ressecamento da pele
          </text>
        </g>

        <!-- Card de Benefícios -->
        <g transform="translate(48, 320)">
          <rect x="0" y="0" width="510" height="280" rx="20" fill="#0f2b48" fill-opacity="0.94" stroke="#0f766e" stroke-width="2" filter="url(#f7)" />
          
          <g transform="translate(24, 46)">
            <circle cx="18" cy="18" r="18" fill="#0d9488" />
            <path d="M11 18 L16 23 L25 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Segurança para Crianças
            </text>
            <text x="52" y="58" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="600">
              Tranquilidade total para banhistas sensíveis
            </text>
          </g>

          <g transform="translate(24, 150)">
            <circle cx="18" cy="18" r="18" fill="#10b981" />
            <path d="M11 18 L16 23 L25 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Sem Cheiro Forte
            </text>
            <text x="52" y="58" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="600">
              Oxidação pura sem cloraminas irritantes
            </text>
          </g>
        </g>

        <!-- Selo Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#0d9488" filter="url(#f7)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            PROTEÇÃO DOS BANHISTAS
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: bucketBuffer, top: bucketTop, left: bucketLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 7);
  }

  // =========================================================================
  // SLOT 8: AUTORIDADE INDUSTRIAL & PROCEDÊNCIA HOMOLOGADA
  // =========================================================================
  {
    console.log('\n[Slot 8] Qualidade Homologada & Garantia de Indústria...');
    const bgBuffer = await sharp(bgBackyardPatio)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const bucketHeight = 650;
    const bucketBuffer = await sharp(fotoBucket)
      .resize({ height: bucketHeight, fit: 'inside' })
      .toBuffer();
    const bucketMeta = await sharp(bucketBuffer).metadata();
    const bucketWidth = bucketMeta.width || 580;
    const bucketLeft = 570;
    const bucketTop = 470;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${bucketLeft + Math.round(bucketWidth / 2)}" cy="${bucketTop + bucketHeight - 14}" rx="260" ry="26" fill="#000000" fill-opacity="0.65" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f8" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.4" />
          </filter>
        </defs>

        <!-- Header Card Flutuante -->
        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="230" rx="24" fill="#0b1e36" fill-opacity="0.94" stroke="#3b82f6" stroke-width="2.5" filter="url(#f8)" />
          
          <text x="36" y="52" fill="#60A5FA" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="2">
            PROCEDÊNCIA &amp; AUTORIDADE
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="900">
            QUALIDADE LÍDER AQUAPOOL
          </text>

          <text x="36" y="172" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700">
            Fórmula original de fábrica com registro e garantia total
          </text>
        </g>

        <!-- Card de Autoridade -->
        <g transform="translate(48, 320)">
          <rect x="0" y="0" width="510" height="280" rx="20" fill="#0f2b48" fill-opacity="0.94" stroke="#1d4ed8" stroke-width="2" filter="url(#f8)" />
          
          <g transform="translate(24, 46)">
            <circle cx="18" cy="18" r="18" fill="#3b82f6" />
            <path d="M11 18 L16 23 L25 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Produto 100% Autêntico
            </text>
            <text x="52" y="58" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="600">
              Fornecido diretamente do fabricante
            </text>
          </g>

          <g transform="translate(24, 150)">
            <circle cx="18" cy="18" r="18" fill="#10b981" />
            <path d="M11 18 L16 23 L25 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Garantia e Nota Fiscal
            </text>
            <text x="52" y="58" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="21" font-weight="600">
              Reversão total de risco na compra
            </text>
          </g>
        </g>

        <!-- Selo Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#1d4ed8" filter="url(#f8)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            GARANTIA DE INDÚSTRIA
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: bucketBuffer, top: bucketTop, left: bucketLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 8);
  }

  console.log('\n=== Todos os 8 slots do SKU 123Mart09178 gerados com sucesso! ===');
}

run().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
