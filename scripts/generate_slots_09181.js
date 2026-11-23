import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outputDir = path.join(process.cwd(), 'public', 'assets', 'slots_09181');
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

function toUpperXml(str) {
  if (!str) return '';
  return escapeXml(str.toUpperCase());
}

async function saveOptimized(imagePipeline, slotNum) {
  const jpgPath = path.join(outputDir, `slot_${slotNum}.jpg`);
  const webpPath = path.join(outputDir, `slot_${slotNum}.webp`);

  let q = 84;
  let jpgBuffer = await imagePipeline.clone().jpeg({ quality: q, mozjpeg: true, chromaSubsampling: '4:2:0' }).toBuffer();
  while (jpgBuffer.length > 90 * 1024 && q > 22) {
    q -= 4;
    jpgBuffer = await imagePipeline.clone().jpeg({ quality: q, mozjpeg: true, chromaSubsampling: '4:2:0' }).toBuffer();
  }
  fs.writeFileSync(jpgPath, jpgBuffer);

  let wq = 80;
  let webpBuffer = await imagePipeline.clone().webp({ quality: wq, effort: 5 }).toBuffer();
  while (webpBuffer.length > 75 * 1024 && wq > 22) {
    wq -= 4;
    webpBuffer = await imagePipeline.clone().webp({ quality: wq, effort: 5 }).toBuffer();
  }
  fs.writeFileSync(webpPath, webpBuffer);

  console.log(`✓ Slot ${slotNum} gravado: JPG ${(jpgBuffer.length / 1024).toFixed(1)} KB (q=${q}) | WebP ${(webpBuffer.length / 1024).toFixed(1)} KB (wq=${wq})`);
}

async function run() {
  console.log('=== Iniciando Geração dos 8 Slots Publicitários (Mobile-First) SKU 123Mart09181 ===');

  const isolatedPath = path.join(process.cwd(), 'public', 'assets', 'aquapool_isolated.png');
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
    const blisterHeight = 940;
    const blisterBuffer = await sharp(isolatedPath)
      .resize({ height: blisterHeight, fit: 'inside' })
      .toBuffer();
    const blisterMeta = await sharp(blisterBuffer).metadata();
    const blisterWidth = blisterMeta.width || 705;
    const blisterLeft = Math.round((WIDTH - blisterWidth) / 2);
    const blisterTop = 120;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.30" />
            <stop offset="60%" stop-color="#000000" stop-opacity="0.08" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="coreShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.50" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="600" cy="${blisterTop + blisterHeight - 10}" rx="320" ry="30" fill="url(#shadowGrad)" />
        <ellipse cx="600" cy="${blisterTop + blisterHeight - 12}" rx="220" ry="16" fill="url(#coreShadow)" />
      </svg>
    `);

    const p = sharp({
      create: { width: WIDTH, height: HEIGHT, channels: 3, background: { r: 255, g: 255, b: 255 } }
    }).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: blisterBuffer, top: blisterTop, left: blisterLeft }
    ]);

    await saveOptimized(p, 1);
  }

  // =========================================================================
  // SLOT 2: AMBIENTE REAL DE USO - PISCINA CRISTALINA & LAZER
  // Layout: Clean Floating Glass Card superior, sem degradê cobrindo a foto.
  // Tipografia Mobile-First grande (52px headline, 30px bullets).
  // =========================================================================
  {
    console.log('\n[Slot 2] Água Cristalina (Layout Superior Flutuante + Foto Aberta)...');
    const bgBuffer = await sharp(bgSunnyPool)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const blisterScaleHeight = 780;
    const blisterBuffer = await sharp(isolatedPath)
      .resize({ height: blisterScaleHeight, fit: 'inside' })
      .toBuffer();
    const blisterMeta = await sharp(blisterBuffer).metadata();
    const blisterWidth = blisterMeta.width || 580;
    const blisterLeft = 570;
    const blisterTop = 370;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="sh2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.65" />
            <stop offset="70%" stop-color="#000000" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="${blisterLeft + Math.round(blisterWidth / 2)}" cy="${blisterTop + blisterScaleHeight - 12}" rx="270" ry="28" fill="url(#sh2)" />
      </svg>
    `);

    // Sem degradê cobrindo a foto toda! Card com fundo semi-transparente de alto contraste
    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f2" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.4" />
          </filter>
        </defs>

        <!-- Header Card Flutuante (Sem degradê preto na foto!) -->
        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="240" rx="24" fill="#0b1e36" fill-opacity="0.92" stroke="#38bdf8" stroke-width="2" filter="url(#f2)" />
          
          <!-- Tag de Destaque -->
          <text x="36" y="52" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" letter-spacing="2">
            CRISTALINIDADE TOTAL
          </text>

          <!-- Headline Gigante Mobile-First -->
          <text x="36" y="116" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="-0.5">
            ÁGUA 100% CRISTALINA E PURA
          </text>

          <!-- Subheadline de Ação -->
          <text x="36" y="168" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="700">
            Elimina a água turva e aprisiona micropartículas no filtro
          </text>
          <text x="36" y="206" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600">
            Eficaz em piscinas de Alvenaria, Fibra e Vinil
          </text>
        </g>

        <!-- Card Lateral com Benefícios em Destaque -->
        <g transform="translate(48, 330)">
          <rect x="0" y="0" width="490" height="250" rx="20" fill="#0f2b48" fill-opacity="0.90" stroke="#0284c7" stroke-width="2" filter="url(#f2)" />
          
          <g transform="translate(24, 46)">
            <circle cx="16" cy="16" r="16" fill="#0284c7" />
            <path d="M10 16 L14 20 L22 11" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="48" y="24" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Ação Rápida em Horas
            </text>
            <text x="48" y="54" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Clarifica durante a filtragem normal
            </text>
          </g>

          <g transform="translate(24, 146)">
            <circle cx="16" cy="16" r="16" fill="#059669" />
            <path d="M10 16 L14 20 L22 11" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="48" y="24" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Brilho Espelhado
            </text>
            <text x="48" y="54" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Piscina azul e convidativa ao sol
            </text>
          </g>
        </g>

        <!-- Selo Flutuante no Canto Inferior -->
        <g transform="translate(48, 1060)">
          <rect x="0" y="0" width="450" height="84" rx="42" fill="#0284c7" filter="url(#f2)" />
          <text x="225" y="52" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle" letter-spacing="1">
            RESULTADO IMEDIATO
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: blisterBuffer, top: blisterTop, left: blisterLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 2);
  }

  // =========================================================================
  // SLOT 3: ALTO RENDIMENTO - 1 BLOCO DE 30g TRATA ATÉ 50.000 LITROS
  // Layout: Impacto Numérico Central (Typography Hero), Fundo Ondas Cristalinas
  // Destaque para "50.000 LITROS" em tamanho 64px, números grandes!
  // =========================================================================
  {
    console.log('\n[Slot 3] Alto Rendimento 50.000L (Tipografia Hero + Fundo Água Profunda)...');
    // Color grade das ondas de água para azul turquesa profundo
    const bgBuffer = await sharp(bgWaterRipples)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .modulate({ brightness: 0.95, saturation: 1.3 })
      .toBuffer();

    const blisterScaleHeight = 780;
    const blisterBuffer = await sharp(isolatedPath)
      .resize({ height: blisterScaleHeight, fit: 'inside' })
      .toBuffer();
    const blisterMeta = await sharp(blisterBuffer).metadata();
    const blisterWidth = blisterMeta.width || 580;
    const blisterLeft = 570;
    const blisterTop = 380;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${blisterLeft + Math.round(blisterWidth / 2)}" cy="${blisterTop + blisterScaleHeight - 14}" rx="270" ry="28" fill="#000000" fill-opacity="0.6" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f3" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.45" />
          </filter>
          <linearGradient id="goldBanner" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#b45309" />
            <stop offset="50%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#d97706" />
          </linearGradient>
        </defs>

        <!-- Banner de Impacto de Rendimento -->
        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="270" rx="24" fill="#0c1e33" fill-opacity="0.94" stroke="#f59e0b" stroke-width="3" filter="url(#f3)" />
          
          <rect x="36" y="24" width="280" height="40" rx="20" fill="url(#goldBanner)" />
          <text x="176" y="51" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" text-anchor="middle" letter-spacing="1">
            RENDIMENTO MÁXIMO
          </text>

          <text x="36" y="130" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="58" font-weight="900">
            1 BLOCO TRATA <tspan fill="#FBBF24">50.000 L</tspan>
          </text>

          <text x="36" y="188" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="700">
            Cartela com 6 blocos: trata até 300.000 Litros no total!
          </text>
          <text x="36" y="230" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600">
            Ação contínua e prolongada na água por até 7 dias cada bloco
          </text>
        </g>

        <!-- Card de Comparação de Economia (Esquerda) -->
        <g transform="translate(48, 350)">
          <rect x="0" y="0" width="490" height="300" rx="20" fill="#0f2b48" fill-opacity="0.92" stroke="#38bdf8" stroke-width="2" filter="url(#f3)" />
          
          <!-- Box Destaque de Economia -->
          <g transform="translate(24, 30)">
            <text x="0" y="32" fill="#FBBF24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="900">
              6 SEMANAS
            </text>
            <text x="0" y="66" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="700">
              De água pura com apenas 1 cartela
            </text>
            <text x="0" y="102" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Economia real sem desperdício de produto
            </text>
          </g>

          <!-- Linha divisória -->
          <line x1="24" y1="160" x2="466" y2="160" stroke="#1e40af" stroke-width="2" />

          <g transform="translate(24, 190)">
            <circle cx="16" cy="16" r="16" fill="#10b981" />
            <path d="M10 16 L14 20 L22 11" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            <text x="46" y="24" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Dosagem Sem Erro
            </text>
            <text x="46" y="56" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Bloco rígido pré-medido de 30g
            </text>
          </g>
        </g>

        <!-- Badge Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#d97706" filter="url(#f3)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            CUSTO-BENEFÍCIO IMBATÍVEL
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: blisterBuffer, top: blisterTop, left: blisterLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 3);
  }

  // =========================================================================
  // SLOT 4: FÓRMULA SEGURA - 100% BIODEGRADÁVEL E SEM CLORO (FAMÍLIA)
  // Layout: Amigável e Ecológico, tons esmeralda, foco em saúde e crianças
  // Fundo: Patio ensolarado com piscina limpa e deck
  // =========================================================================
  {
    console.log('\n[Slot 4] Fórmula Sem Cloro & Cuidado Familiar (Tons Esmeralda)...');
    const bgBuffer = await sharp(bgBackyardPatio)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const blisterScaleHeight = 780;
    const blisterBuffer = await sharp(isolatedPath)
      .resize({ height: blisterScaleHeight, fit: 'inside' })
      .toBuffer();
    const blisterMeta = await sharp(blisterBuffer).metadata();
    const blisterWidth = blisterMeta.width || 580;
    const blisterLeft = 570;
    const blisterTop = 380;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${blisterLeft + Math.round(blisterWidth / 2)}" cy="${blisterTop + blisterScaleHeight - 12}" rx="270" ry="28" fill="#000000" fill-opacity="0.65" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f4" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.45" />
          </filter>
        </defs>

        <!-- Top Header Card Verde Esmeralda Seguro -->
        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="260" rx="24" fill="#062d22" fill-opacity="0.94" stroke="#10b981" stroke-width="2.5" filter="url(#f4)" />
          
          <text x="36" y="52" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="1.5">
            SAÚDE &amp; PROTEÇÃO DA FAMÍLIA
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900">
            FÓRMULA BIODEGRADÁVEL &amp; SEM CLORO
          </text>

          <text x="36" y="174" fill="#A7F3D0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="700">
            Não altera o pH da piscina e não resseca a pele
          </text>
          <text x="36" y="214" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600">
            Totalmente seguro para crianças, bebês e animais domésticos
          </text>
        </g>

        <!-- Card de Vantagens da Fórmula (Esquerda) -->
        <g transform="translate(48, 340)">
          <rect x="0" y="0" width="490" height="310" rx="20" fill="#052e23" fill-opacity="0.92" stroke="#059669" stroke-width="2" filter="url(#f4)" />
          
          <g transform="translate(24, 44)">
            <circle cx="18" cy="18" r="18" fill="#10b981" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Zero Ardência nos Olhos
            </text>
            <text x="52" y="56" fill="#A7F3D0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Banho suave sem cheiro forte
            </text>
          </g>

          <g transform="translate(24, 150)">
            <circle cx="18" cy="18" r="18" fill="#047857" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Amigo da Natureza
            </text>
            <text x="52" y="56" fill="#A7F3D0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Fórmula 100% biodegradável
            </text>
          </g>
        </g>

        <!-- Selo Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#059669" filter="url(#f4)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            TRANQUILIDADE &amp; CUIDADO
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: blisterBuffer, top: blisterTop, left: blisterLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 4);
  }

  // =========================================================================
  // SLOT 5: DECANTAÇÃO & AGLOMERAÇÃO RÁPIDA (FILTRAÇÃO EFICIENTE)
  // Layout: Técnico e Dinâmico, Destaque para como o produto aglomera sujeira
  // =========================================================================
  {
    console.log('\n[Slot 5] Decantação & Aglomeração Rápida...');
    // Crop com zoom nas caustics da piscina para dar foco na purificação
    const bgBuffer = await sharp(bgWaterRipples)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'top' })
      .modulate({ brightness: 0.9, saturation: 1.25 })
      .toBuffer();

    const blisterScaleHeight = 780;
    const blisterBuffer = await sharp(isolatedPath)
      .resize({ height: blisterScaleHeight, fit: 'inside' })
      .toBuffer();
    const blisterMeta = await sharp(blisterBuffer).metadata();
    const blisterWidth = blisterMeta.width || 580;
    const blisterLeft = 570;
    const blisterTop = 380;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${blisterLeft + Math.round(blisterWidth / 2)}" cy="${blisterTop + blisterScaleHeight - 12}" rx="270" ry="28" fill="#000000" fill-opacity="0.65" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f5" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.45" />
          </filter>
        </defs>

        <!-- Header Card de Aglomeração -->
        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="260" rx="24" fill="#0a192f" fill-opacity="0.94" stroke="#00e5ff" stroke-width="2.5" filter="url(#f5)" />
          
          <text x="36" y="52" fill="#00E5FF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="1.5">
            TECNOLOGIA EM GEL FLOCULANTE
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900">
            AGLOMERAÇÃO &amp; DECANTAÇÃO EFICIENTE
          </text>

          <text x="36" y="174" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="700">
            Junta a micro-sujeira invisível em flocos fáceis de filtrar
          </text>
          <text x="36" y="214" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600">
            Reduz pela metade o esforço e o tempo de aspiração
          </text>
        </g>

        <!-- Card de Explicação Prática -->
        <g transform="translate(48, 340)">
          <rect x="0" y="0" width="490" height="310" rx="20" fill="#0f2642" fill-opacity="0.92" stroke="#0284c7" stroke-width="2" filter="url(#f5)" />
          
          <g transform="translate(24, 44)">
            <circle cx="18" cy="18" r="18" fill="#00e5ff" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#0a192f" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Retenção no Filtro
            </text>
            <text x="52" y="56" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Retém até partículas de 1 micra
            </text>
          </g>

          <g transform="translate(24, 150)">
            <circle cx="18" cy="18" r="18" fill="#0284c7" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Menos Aspiração
            </text>
            <text x="52" y="56" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Sujeira desce compacta para o fundo
            </text>
          </g>
        </g>

        <!-- Selo Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#0284c7" filter="url(#f5)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            ÁGUA LÍMPIDA EM POUCAS HORAS
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: blisterBuffer, top: blisterTop, left: blisterLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 5);
  }

  // =========================================================================
  // SLOT 6: MODO DE USO - APLICAÇÃO NO SKIMMER OU PRÉ-FILTRO
  // Layout Diagramático em Passos (1, 2, 3) com a foto do Skimmer
  // =========================================================================
  {
    console.log('\n[Slot 6] Modo de Uso (Passo a Passo Diagramado no Skimmer)...');
    const bgBuffer = await sharp(bgSkimmer)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const blisterScaleHeight = 750;
    const blisterBuffer = await sharp(isolatedPath)
      .resize({ height: blisterScaleHeight, fit: 'inside' })
      .toBuffer();
    const blisterMeta = await sharp(blisterBuffer).metadata();
    const blisterWidth = blisterMeta.width || 560;
    const blisterLeft = 600;
    const blisterTop = 410;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${blisterLeft + Math.round(blisterWidth / 2)}" cy="${blisterTop + blisterScaleHeight - 12}" rx="260" ry="26" fill="#000000" fill-opacity="0.7" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f6" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.5" />
          </filter>
        </defs>

        <!-- Top Header Card Passo a Passo -->
        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="230" rx="24" fill="#181129" fill-opacity="0.94" stroke="#a855f7" stroke-width="2.5" filter="url(#f6)" />
          
          <text x="36" y="50" fill="#C084FC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="1.5">
            APLICAÇÃO SIMPLES &amp; RÁPIDA
          </text>

          <text x="36" y="112" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="50" font-weight="900">
            PASSO A PASSO NO SKIMMER OU FILTRO
          </text>

          <text x="36" y="166" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="700">
            Sem pós que voam, sem medição de líquidos complicados
          </text>
        </g>

        <!-- Três Passos Diagramáticos Numéricos (Esquerda) -->
        <g transform="translate(48, 310)">
          <!-- Passo 1 -->
          <g transform="translate(0, 0)">
            <rect x="0" y="0" width="520" height="110" rx="16" fill="#201538" fill-opacity="0.94" stroke="#7c3aed" stroke-width="2" filter="url(#f6)" />
            <circle cx="50" cy="55" r="28" fill="#7c3aed" />
            <text x="50" y="66" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="900" text-anchor="middle">
              1
            </text>
            <text x="96" y="48" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Lave a Areia do Filtro
            </text>
            <text x="96" y="80" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600">
              Faça a retrolavagem normal do filtro
            </text>
          </g>

          <!-- Passo 2 -->
          <g transform="translate(0, 130)">
            <rect x="0" y="0" width="520" height="110" rx="16" fill="#201538" fill-opacity="0.94" stroke="#a855f7" stroke-width="2" filter="url(#f6)" />
            <circle cx="50" cy="55" r="28" fill="#a855f7" />
            <text x="50" y="66" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="900" text-anchor="middle">
              2
            </text>
            <text x="96" y="48" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Coloque no Cesto do Skimmer
            </text>
            <text x="96" y="80" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600">
              Ou no cesto do pré-filtro da motobomba
            </text>
          </g>

          <!-- Passo 3 -->
          <g transform="translate(0, 260)">
            <rect x="0" y="0" width="520" height="110" rx="16" fill="#201538" fill-opacity="0.94" stroke="#c084fc" stroke-width="2" filter="url(#f6)" />
            <circle cx="50" cy="55" r="28" fill="#c084fc" />
            <text x="50" y="66" fill="#181129" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="900" text-anchor="middle">
              3
            </text>
            <text x="96" y="48" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">
              Filtre por 6 a 8 Horas
            </text>
            <text x="96" y="80" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600">
              A dissolução gradual faz todo o trabalho
            </text>
          </g>
        </g>

        <!-- Badge Inferior -->
        <g transform="translate(48, 1060)">
          <rect x="0" y="0" width="480" height="84" rx="42" fill="#7c3aed" filter="url(#f6)" />
          <text x="240" y="52" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            PRATICIDADE TOTAL NO DIA A DIA
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: blisterBuffer, top: blisterTop, left: blisterLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 6);
  }

  // =========================================================================
  // SLOT 7: PROTEGE REVESTIMENTOS DE PISCINAS (VINIL & FIBRA)
  // Layout: Reversão de Objeção / Foco na integridade do revestimento
  // Fundo com piscina ensolarada com foco na borda e revestimento impecável
  // =========================================================================
  {
    console.log('\n[Slot 7] Proteção Total de Vinil e Fibra...');
    const bgBuffer = await sharp(bgSunnyPool)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'bottom' })
      .toBuffer();

    const blisterScaleHeight = 780;
    const blisterBuffer = await sharp(isolatedPath)
      .resize({ height: blisterScaleHeight, fit: 'inside' })
      .toBuffer();
    const blisterMeta = await sharp(blisterBuffer).metadata();
    const blisterWidth = blisterMeta.width || 580;
    const blisterLeft = 570;
    const blisterTop = 380;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${blisterLeft + Math.round(blisterWidth / 2)}" cy="${blisterTop + blisterScaleHeight - 12}" rx="270" ry="28" fill="#000000" fill-opacity="0.65" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f7" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.45" />
          </filter>
        </defs>

        <!-- Header Card de Proteção -->
        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="260" rx="24" fill="#09282f" fill-opacity="0.94" stroke="#14b8a6" stroke-width="2.5" filter="url(#f7)" />
          
          <text x="36" y="52" fill="#2DD4BF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="1.5">
            COMPATIBILIDADE SEGURA
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900">
            NÃO DESBOTA NEM MANCHA O VINIL
          </text>

          <text x="36" y="174" fill="#CCFBF1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="700">
            Dissolução gradativa suave no skimmer sem agredir as paredes
          </text>
          <text x="36" y="214" fill="#99F6E4" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600">
            Preserva o brilho, estampas de vinil e a cor da fibra
          </text>
        </g>

        <!-- Card de Revestimentos Testados (Esquerda) -->
        <g transform="translate(48, 340)">
          <rect x="0" y="0" width="490" height="310" rx="20" fill="#0d3b45" fill-opacity="0.92" stroke="#0d9488" stroke-width="2" filter="url(#f7)" />
          
          <g transform="translate(24, 44)">
            <circle cx="18" cy="18" r="18" fill="#14b8a6" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Piscinas de Vinil
            </text>
            <text x="52" y="56" fill="#CCFBF1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Não desbota a estampa nem resseca
            </text>
          </g>

          <g transform="translate(24, 150)">
            <circle cx="18" cy="18" r="18" fill="#0d9488" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Fibra &amp; Alvenaria
            </text>
            <text x="52" y="56" fill="#CCFBF1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Zero resíduo nos azulejos e pastilhas
            </text>
          </g>
        </g>

        <!-- Selo Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#0d9488" filter="url(#f7)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            100% SEGURO PARA SEU REVESTIMENTO
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: blisterBuffer, top: blisterTop, left: blisterLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 7);
  }

  // =========================================================================
  // SLOT 8: QUALIDADE LÍDER START QUÍMICA & PROCEDÊNCIA 123MART
  // Layout: Selo de Autenticidade e Confiança Oficial, Tons Navy & Dourado
  // =========================================================================
  {
    console.log('\n[Slot 8] Procedência Start Química & 123Mart...');
    const bgBuffer = await sharp(bgBackyardPatio)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'top' })
      .modulate({ brightness: 0.88, saturation: 1.1 })
      .toBuffer();

    const blisterScaleHeight = 780;
    const blisterBuffer = await sharp(isolatedPath)
      .resize({ height: blisterScaleHeight, fit: 'inside' })
      .toBuffer();
    const blisterMeta = await sharp(blisterBuffer).metadata();
    const blisterWidth = blisterMeta.width || 580;
    const blisterLeft = 570;
    const blisterTop = 380;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${blisterLeft + Math.round(blisterWidth / 2)}" cy="${blisterTop + blisterScaleHeight - 12}" rx="270" ry="28" fill="#000000" fill-opacity="0.65" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f8" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.5" />
          </filter>
          <linearGradient id="goldG8" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#b45309" />
            <stop offset="50%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#d97706" />
          </linearGradient>
        </defs>

        <!-- Top Header Card Autoridade Start Química -->
        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="260" rx="24" fill="#0f172a" fill-opacity="0.95" stroke="#f59e0b" stroke-width="2.5" filter="url(#f8)" />
          
          <rect x="36" y="24" width="340" height="40" rx="20" fill="url(#goldG8)" />
          <text x="206" y="51" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="900" text-anchor="middle" letter-spacing="1.5">
            GARANTIA DE PROCEDÊNCIA
          </text>

          <text x="36" y="120" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900">
            PADRÃO PROFISSIONAL START QUÍMICA
          </text>

          <text x="36" y="174" fill="#FEF08A" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="700">
            Produto 100% Original direto da indústria com Nota Fiscal
          </text>
          <text x="36" y="214" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600">
            A Start Química é líder nacional em soluções para tratamento de água
          </text>
        </g>

        <!-- Card de Selos e Confiabilidade (Esquerda) -->
        <g transform="translate(48, 340)">
          <rect x="0" y="0" width="490" height="310" rx="20" fill="#1e293b" fill-opacity="0.94" stroke="#475569" stroke-width="2" filter="url(#f8)" />
          
          <g transform="translate(24, 44)">
            <circle cx="18" cy="18" r="18" fill="#f59e0b" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Lote Novo e Lacrado
            </text>
            <text x="52" y="56" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Validade longa e embalagem protegida
            </text>
          </g>

          <g transform="translate(24, 150)">
            <circle cx="18" cy="18" r="18" fill="#10b981" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Envio Rápido 123Mart
            </text>
            <text x="52" y="56" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Expedição ágil com garantia de entrega
            </text>
          </g>
        </g>

        <!-- Selo Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#b45309" filter="url(#f8)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            COMPRA 100% SEGURA
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: blisterBuffer, top: blisterTop, left: blisterLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 8);
  }

  console.log('\n=== Todos os 8 Slots foram gerados com sucesso e sem degradê engessado! ===');
}

run().catch(err => {
  console.error('Erro na geração dos slots:', err);
  process.exit(1);
});
