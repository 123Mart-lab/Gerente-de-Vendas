import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outputDir = path.join(process.cwd(), 'public', 'assets', 'slots_09180');
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
  console.log('=== Iniciando Geração dos 8 Slots Publicitários Profissionais SKU 123Mart09180 ===');
  console.log('Diretrizes: Ambientes Reais de Piscina, Tipografia Mobile-First Gigante, ZERO menção a 123Mart.');

  const foto1Open = path.join(outputDir, 'foto_1_isolated.png');
  const foto2Closed = path.join(outputDir, 'foto_2.png');
  const foto3Ph = path.join(outputDir, 'foto_3.png');
  const foto4Cloro = path.join(outputDir, 'foto_4.png');

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
    const kitHeight = 850;
    const kitBuffer = await sharp(foto1Open)
      .resize({ height: kitHeight, fit: 'inside' })
      .toBuffer();
    const kitMeta = await sharp(kitBuffer).metadata();
    const kitWidth = kitMeta.width || 800;
    const kitLeft = Math.round((WIDTH - kitWidth) / 2);
    const kitTop = 160;

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
        <ellipse cx="600" cy="${kitTop + kitHeight - 20}" rx="380" ry="34" fill="url(#shadowGrad)" />
        <ellipse cx="600" cy="${kitTop + kitHeight - 22}" rx="260" ry="18" fill="url(#coreShadow)" />
      </svg>
    `);

    const p = sharp({
      create: { width: WIDTH, height: HEIGHT, channels: 3, background: { r: 255, g: 255, b: 255 } }
    }).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: kitBuffer, top: kitTop, left: kitLeft }
    ]);

    await saveOptimized(p, 1);
  }

  // =========================================================================
  // SLOT 2: AMBIENTE REAL DE USO - PISCINA CRISTALINA & CONTROLE DE pH E CLORO
  // =========================================================================
  {
    console.log('\n[Slot 2] Piscina Ensolarada & Controle Preciso de pH e Cloro...');
    const bgBuffer = await sharp(bgSunnyPool)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const kitHeight = 680;
    const kitBuffer = await sharp(foto2Closed)
      .resize({ height: kitHeight, fit: 'inside' })
      .toBuffer();
    const kitMeta = await sharp(kitBuffer).metadata();
    const kitWidth = kitMeta.width || 500;
    const kitLeft = 620;
    const kitTop = 440;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${kitLeft + Math.round(kitWidth / 2)}" cy="${kitTop + kitHeight - 14}" rx="250" ry="26" fill="#000000" fill-opacity="0.65" />
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
            EQUILÍBRIO QUÍMICO PERFEITO
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900">
            CONTROLE PRECISO DE pH &amp; CLORO
          </text>

          <text x="36" y="172" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="700">
            Evita água verde, turva e proliferação de bactérias e algas
          </text>
          <text x="36" y="210" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600">
            Garante água cristalina e segura em piscinas de Alvenaria, Fibra e Vinil
          </text>
        </g>

        <!-- Card Lateral com Benefícios em Destaque -->
        <g transform="translate(48, 330)">
          <rect x="0" y="0" width="530" height="270" rx="20" fill="#0f2b48" fill-opacity="0.92" stroke="#0284c7" stroke-width="2" filter="url(#f2)" />
          
          <g transform="translate(24, 48)">
            <circle cx="18" cy="18" r="18" fill="#0284c7" />
            <path d="M11 18 L16 23 L25 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Água 100% Cristalina
            </text>
            <text x="52" y="58" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Controle visual exato da cloração
            </text>
          </g>

          <g transform="translate(24, 156)">
            <circle cx="18" cy="18" r="18" fill="#059669" />
            <path d="M11 18 L16 23 L25 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Banho Seguro &amp; Convidativo
            </text>
            <text x="52" y="58" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Protege a saúde de banhistas e crianças
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
      { input: kitBuffer, top: kitTop, left: kitLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 2);
  }

  // =========================================================================
  // SLOT 3: LEITURA FÁCIL E IMEDIATA: ESCALA COLORIMÉTRICA DE ALTA PRECISÃO
  // =========================================================================
  {
    console.log('\n[Slot 3] Escala Colorimétrica & Tubos de Ensaio...');
    const bgBuffer = await sharp(bgWaterRipples)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .modulate({ brightness: 0.95, saturation: 1.3 })
      .toBuffer();

    const kitHeight = 720;
    const kitBuffer = await sharp(foto1Open)
      .resize({ height: kitHeight, fit: 'inside' })
      .toBuffer();
    const kitMeta = await sharp(kitBuffer).metadata();
    const kitWidth = kitMeta.width || 680;
    const kitLeft = 480;
    const kitTop = 390;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${kitLeft + Math.round(kitWidth / 2)}" cy="${kitTop + kitHeight - 16}" rx="320" ry="28" fill="#000000" fill-opacity="0.65" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f3" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.45" />
          </filter>
        </defs>

        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="240" rx="24" fill="#0c1e33" fill-opacity="0.95" stroke="#38bdf8" stroke-width="2.5" filter="url(#f3)" />
          
          <text x="36" y="52" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="1.5">
            LEITURA INSTANTÂNEA EM SEGUNDOS
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="50" font-weight="900">
            ESCALA COLORIMÉTRICA DE ALTA PRECISÃO
          </text>

          <text x="36" y="172" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="700">
            Tubos graduados com escala comparativa permanente e indelével
          </text>
          <text x="36" y="210" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600">
            Resultado visual rápido e confiável sem necessidade de pilhas ou cabos
          </text>
        </g>

        <!-- Card de Comparação -->
        <g transform="translate(48, 330)">
          <rect x="0" y="0" width="410" height="280" rx="20" fill="#0f2b48" fill-opacity="0.92" stroke="#0284c7" stroke-width="2" filter="url(#f3)" />
          
          <g transform="translate(24, 48)">
            <circle cx="18" cy="18" r="18" fill="#e11d48" />
            <text x="18" y="24" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="900" text-anchor="middle">pH</text>
            <text x="48" y="22" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">
              Escala de pH: 6.8 a 8.2
            </text>
            <text x="48" y="52" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600">
              Faixa ideal: 7.2 a 7.6
            </text>
          </g>

          <g transform="translate(24, 156)">
            <circle cx="18" cy="18" r="18" fill="#eab308" />
            <text x="18" y="24" fill="#000000" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="900" text-anchor="middle">Cl</text>
            <text x="48" y="22" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">
              Cloro Livre: 0.5 a 5.0
            </text>
            <text x="48" y="52" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600">
              Faixa ideal: 1.0 a 3.0 ppm
            </text>
          </g>
        </g>

        <!-- Badge Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#0284c7" filter="url(#f3)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            RESULTADO VISUAL IMEDIATO
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: kitBuffer, top: kitTop, left: kitLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 3);
  }

  // =========================================================================
  // SLOT 4: SAÚDE E CONFORTO: ZERO ARDÊNCIA NOS OLHOS E PELE MACIA
  // =========================================================================
  {
    console.log('\n[Slot 4] Saúde e Conforto Familiar (Zero Ardência nos Olhos)...');
    const bgBuffer = await sharp(bgBackyardPatio)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const phHeight = 750;
    const phBuffer = await sharp(foto3Ph)
      .resize({ height: phHeight, fit: 'inside' })
      .toBuffer();
    const phMeta = await sharp(phBuffer).metadata();
    const phWidth = phMeta.width || 250;
    const phLeft = 750;
    const phTop = 410;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${phLeft + Math.round(phWidth / 2)}" cy="${phTop + phHeight - 14}" rx="140" ry="20" fill="#000000" fill-opacity="0.6" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f4" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.45" />
          </filter>
        </defs>

        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="240" rx="24" fill="#062d22" fill-opacity="0.95" stroke="#10b981" stroke-width="2.5" filter="url(#f4)" />
          
          <text x="36" y="52" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="1.5">
            SAÚDE &amp; PROTEÇÃO DA FAMÍLIA
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="900">
            FIM DA ARDÊNCIA NOS OLHOS E PELE RESSECADA
          </text>

          <text x="36" y="172" fill="#A7F3D0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="700">
            Água no pH ideal (7.2 a 7.6) não irrita os olhos e preserva os cabelos
          </text>
          <text x="36" y="210" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600">
            Banho suave, agradável e 100% seguro para crianças e adultos
          </text>
        </g>

        <!-- Card de Benefícios -->
        <g transform="translate(48, 330)">
          <rect x="0" y="0" width="650" height="280" rx="20" fill="#052e23" fill-opacity="0.92" stroke="#059669" stroke-width="2" filter="url(#f4)" />
          
          <g transform="translate(24, 46)">
            <circle cx="18" cy="18" r="18" fill="#10b981" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Zero Ardência ou Vermelhidão
            </text>
            <text x="52" y="58" fill="#A7F3D0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Equilíbrio exato que protege a mucosa ocular
            </text>
          </g>

          <g transform="translate(24, 156)">
            <circle cx="18" cy="18" r="18" fill="#047857" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Cabelos Macios &amp; Pele Hidratada
            </text>
            <text x="52" y="58" fill="#A7F3D0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Evita a ação corrosiva da água ácida ou alcalina
            </text>
          </g>
        </g>

        <!-- Selo Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#059669" filter="url(#f4)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            BANHO SUAVE &amp; CONFORTÁVEL
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: phBuffer, top: phTop, left: phLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 4);
  }

  // =========================================================================
  // SLOT 5: ECONOMIA INTELIGENTE: EVITA DESPERDÍCIO DE PRODUTOS QUÍMICOS
  // =========================================================================
  {
    console.log('\n[Slot 5] Economia Inteligente (Até 50% em Químicos)...');
    const bgBuffer = await sharp(bgSkimmer)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const cloroHeight = 750;
    const cloroBuffer = await sharp(foto4Cloro)
      .resize({ height: cloroHeight, fit: 'inside' })
      .toBuffer();
    const cloroMeta = await sharp(cloroBuffer).metadata();
    const cloroWidth = cloroMeta.width || 250;
    const cloroLeft = 750;
    const cloroTop = 410;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${cloroLeft + Math.round(cloroWidth / 2)}" cy="${cloroTop + cloroHeight - 14}" rx="140" ry="20" fill="#000000" fill-opacity="0.6" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f5" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.45" />
          </filter>
        </defs>

        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="250" rx="24" fill="#1e1804" fill-opacity="0.95" stroke="#f59e0b" stroke-width="3" filter="url(#f5)" />
          
          <text x="36" y="52" fill="#FBBF24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="1.5">
            ECONOMIA COMPROVADA NA MANUTENÇÃO
          </text>

          <text x="36" y="122" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900">
            ECONOMIZE ATÉ <tspan fill="#FBBF24">50% EM PRODUTOS</tspan>
          </text>

          <text x="36" y="176" fill="#FEF3C7" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="700">
            Nunca mais jogue cloro ou algicida fora em água desregulada
          </text>
          <text x="36" y="216" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600">
            Aplique apenas a dosagem necessária: o estojo se paga logo no 1º mês
          </text>
        </g>

        <!-- Card de Comparação -->
        <g transform="translate(48, 340)">
          <rect x="0" y="0" width="650" height="290" rx="20" fill="#291e05" fill-opacity="0.92" stroke="#d97706" stroke-width="2" filter="url(#f5)" />
          
          <g transform="translate(24, 48)">
            <circle cx="18" cy="18" r="18" fill="#f59e0b" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Zero Desperdício de Químicos
            </text>
            <text x="52" y="58" fill="#FEF3C7" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Cloro age com 100% de eficácia no pH correto
            </text>
          </g>

          <g transform="translate(24, 160)">
            <circle cx="18" cy="18" r="18" fill="#b45309" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Durabilidade dos Equipamentos
            </text>
            <text x="52" y="58" fill="#FEF3C7" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Protege bomba, filtro, aquecedor e vinil contra corrosão
            </text>
          </g>
        </g>

        <!-- Badge Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#d97706" filter="url(#f5)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            CUSTO-BENEFÍCIO IMBATÍVEL
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: cloroBuffer, top: cloroTop, left: cloroLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 5);
  }

  // =========================================================================
  // SLOT 6: PASSO A PASSO SIMPLES: TESTE COMPLETO EM 3 PASSOS (MENOS DE 1 MIN)
  // =========================================================================
  {
    console.log('\n[Slot 6] Passo a Passo Simples em 3 Passos...');
    const bgBuffer = await sharp(bgSunnyPool)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const kitHeight = 650;
    const kitBuffer = await sharp(foto1Open)
      .resize({ height: kitHeight, fit: 'inside' })
      .toBuffer();
    const kitMeta = await sharp(kitBuffer).metadata();
    const kitWidth = kitMeta.width || 600;
    const kitLeft = 540;
    const kitTop = 460;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${kitLeft + Math.round(kitWidth / 2)}" cy="${kitTop + kitHeight - 14}" rx="280" ry="24" fill="#000000" fill-opacity="0.65" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f6" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.45" />
          </filter>
        </defs>

        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="240" rx="24" fill="#0b1e36" fill-opacity="0.95" stroke="#6366f1" stroke-width="2.5" filter="url(#f6)" />
          
          <text x="36" y="52" fill="#818CF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="1.5">
            MÉTODO DESCOMPLICADO
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900">
            TESTE COMPLETO EM MENOS DE 1 MINUTO
          </text>

          <text x="36" y="172" fill="#E0E7FF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="700">
            Processo intuitivo: basta coletar a água, pingar as gotas e comparar
          </text>
          <text x="36" y="210" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600">
            Qualquer pessoa consegue realizar a medição com precisão profissional
          </text>
        </g>

        <!-- 3 Passos Numéricos -->
        <g transform="translate(48, 330)">
          <rect x="0" y="0" width="460" height="340" rx="20" fill="#0f172a" fill-opacity="0.94" stroke="#4f46e5" stroke-width="2" filter="url(#f6)" />
          
          <g transform="translate(24, 38)">
            <circle cx="20" cy="20" r="20" fill="#6366f1" />
            <text x="20" y="27" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" text-anchor="middle">1</text>
            <text x="56" y="22" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">Colete a Água</text>
            <text x="56" y="50" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600">Mergulhe os tubos a 30cm de prof.</text>
          </g>

          <g transform="translate(24, 140)">
            <circle cx="20" cy="20" r="20" fill="#6366f1" />
            <text x="20" y="27" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" text-anchor="middle">2</text>
            <text x="56" y="22" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">Pingue os Reagentes</text>
            <text x="56" y="50" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600">4 a 5 gotas em cada tubo</text>
          </g>

          <g transform="translate(24, 242)">
            <circle cx="20" cy="20" r="20" fill="#10b981" />
            <text x="20" y="27" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" text-anchor="middle">3</text>
            <text x="56" y="22" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">Agite e Compare</text>
            <text x="56" y="50" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600">Leitura imediata na escala</text>
          </g>
        </g>

        <!-- Badge Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#4f46e5" filter="url(#f6)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            RÁPIDO, SIMPLES &amp; SEGURO
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: kitBuffer, top: kitTop, left: kitLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 6);
  }

  // =========================================================================
  // SLOT 7: REAGENTES INCLUSOS: VERMELHO FENOL E ORTO-TOLIDINA
  // =========================================================================
  {
    console.log('\n[Slot 7] Reagentes Inclusos (Frascos Conta-Gotas)...');
    const bgBuffer = await sharp(bgWaterRipples)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const phHeight = 720;
    const phBuffer = await sharp(foto3Ph).resize({ height: phHeight, fit: 'inside' }).toBuffer();
    const cloroBuffer = await sharp(foto4Cloro).resize({ height: phHeight, fit: 'inside' }).toBuffer();

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="690" cy="1120" rx="130" ry="18" fill="#000000" fill-opacity="0.6" />
        <ellipse cx="960" cy="1120" rx="130" ry="18" fill="#000000" fill-opacity="0.6" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f7" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.45" />
          </filter>
        </defs>

        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="240" rx="24" fill="#1f1122" fill-opacity="0.95" stroke="#f43f5e" stroke-width="2.5" filter="url(#f7)" />
          
          <text x="36" y="52" fill="#FB7185" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="1.5">
            KIT COMPLETO PRONTO PARA USO
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900">
            REAGENTES DE ALTA PUREZA INCLUSOS
          </text>

          <text x="36" y="172" fill="#FFE4E6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="700">
            Frascos dosadores conta-gotas com tampa de vedação hermética
          </text>
          <text x="36" y="210" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600">
            Estojo rígido resistente para guardar na casa de máquinas sem vazamento
          </text>
        </g>

        <!-- Detalhes dos 2 Reagentes -->
        <g transform="translate(48, 330)">
          <rect x="0" y="0" width="510" height="290" rx="20" fill="#2d1222" fill-opacity="0.92" stroke="#e11d48" stroke-width="2" filter="url(#f7)" />
          
          <g transform="translate(24, 48)">
            <circle cx="18" cy="18" r="18" fill="#e11d48" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Vermelho Fenol (23ml)
            </text>
            <text x="52" y="58" fill="#FFE4E6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Medição rápida do nível de pH
            </text>
          </g>

          <g transform="translate(24, 160)">
            <circle cx="18" cy="18" r="18" fill="#eab308" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#000000" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Orto-Tolidina (23ml)
            </text>
            <text x="52" y="58" fill="#FFE4E6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Medição exata do Cloro Livre residual
            </text>
          </g>
        </g>

        <!-- Badge Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#e11d48" filter="url(#f7)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            QUALIDADE START QUÍMICA
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: phBuffer, top: 430, left: 560 },
      { input: cloroBuffer, top: 430, left: 830 },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 7);
  }

  // =========================================================================
  // SLOT 8: PADRÃO START QUÍMICA & PROCEDÊNCIA ORIGINAL
  // =========================================================================
  {
    console.log('\n[Slot 8] Procedência e Padrão Start Química...');
    const bgBuffer = await sharp(bgBackyardPatio)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toBuffer();

    const kitHeight = 700;
    const kitBuffer = await sharp(foto1Open)
      .resize({ height: kitHeight, fit: 'inside' })
      .toBuffer();
    const kitMeta = await sharp(kitBuffer).metadata();
    const kitWidth = kitMeta.width || 660;
    const kitLeft = 490;
    const kitTop = 410;

    const shadowSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${kitLeft + Math.round(kitWidth / 2)}" cy="${kitTop + kitHeight - 16}" rx="300" ry="26" fill="#000000" fill-opacity="0.65" />
      </svg>
    `);

    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="f8" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.45" />
          </filter>
        </defs>

        <g transform="translate(48, 48)">
          <rect x="0" y="0" width="1104" height="240" rx="24" fill="#0f172a" fill-opacity="0.95" stroke="#38bdf8" stroke-width="2.5" filter="url(#f8)" />
          
          <text x="36" y="52" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" letter-spacing="1.5">
            PROCEDÊNCIA &amp; CONFIANÇA
          </text>

          <text x="36" y="118" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900">
            LÍDER NACIONAL EM TRATAMENTO DE ÁGUA
          </text>

          <text x="36" y="172" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="700">
            Qualidade industrial Start Química com garantia total de fábrica
          </text>
          <text x="36" y="210" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600">
            Produto 100% original e aprovado por profissionais de piscinas em todo o país
          </text>
        </g>

        <!-- Card de Garantia -->
        <g transform="translate(48, 330)">
          <rect x="0" y="0" width="410" height="280" rx="20" fill="#1e293b" fill-opacity="0.92" stroke="#475569" stroke-width="2" filter="url(#f8)" />
          
          <g transform="translate(24, 48)">
            <circle cx="18" cy="18" r="18" fill="#0284c7" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Fórmula Homologada
            </text>
            <text x="52" y="58" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Rigoroso controle laboratorial
            </text>
          </g>

          <g transform="translate(24, 156)">
            <circle cx="18" cy="18" r="18" fill="#10b981" />
            <path d="M12 18 L16 22 L24 13" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="52" y="26" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">
              Envio com Nota Fiscal
            </text>
            <text x="52" y="58" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">
              Segurança e procedência garantida
            </text>
          </g>
        </g>

        <!-- Badge Inferior -->
        <g transform="translate(48, 1050)">
          <rect x="0" y="0" width="460" height="88" rx="44" fill="#0284c7" filter="url(#f8)" />
          <text x="230" y="54" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" text-anchor="middle">
            GARANTIA &amp; AUTENTICIDADE
          </text>
        </g>
      </svg>
    `);

    const p = sharp(bgBuffer).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: kitBuffer, top: kitTop, left: kitLeft },
      { input: overlaySvg, top: 0, left: 0 }
    ]);

    await saveOptimized(p, 8);
  }

  console.log('\n=== Concluída Geração dos 8 Slots do SKU 123Mart09180 com Sucesso! ===');
}

run().catch(err => {
  console.error('Erro ao gerar slots:', err);
  process.exit(1);
});
