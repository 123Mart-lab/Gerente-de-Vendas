import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { GoogleGenAI } from '@google/genai';
import type {
  ArtInfoCard,
  ArtRenderMode,
  CardStyle,
  PanelTheme,
  TextPlacement,
} from '../prompts/artDirector.js';

export interface HybridOverlaySpec {
  slotNumber: number;
  badge: string;
  headline: string;
  subtitle?: string;
  cardStyle?: CardStyle;
  cards?: ArtInfoCard[];
  bullets: string[];
  callout: string;
  accentHex: string;
  panelTheme: PanelTheme;
  textPosition: TextPlacement;
}

export interface ComposeArtSlotInput {
  sku: string;
  slotNumber: number;
  sourceImageUrlOrPath: string;
  renderMode: ArtRenderMode;
  hybridScenePrompt: string;
  integratedImagePrompt: string;
  overlay: HybridOverlaySpec;
  /** Se true no modo híbrido e existir cena limpa em cache, apenas re-renderiza a tipografia PT-BR sem regerar a foto */
  overlayOnly?: boolean;
  cachedCleanScenePath?: string;
  /** Se true, ignora recorte por flood-fill e força Gemini Strict Compositing Sólido (zero transparência) + Glassmorphism PT-BR */
  forceSolidAiCompositing?: boolean;
}

export interface ComposeArtSlotResult {
  jpgUrl: string;
  webpUrl: string;
  cleanSceneUrl?: string;
  jpgSizeKb: string;
  webpSizeKb: string;
  jpgBytes: number;
  webpBytes: number;
  modelUsed: string;
  renderMode: ArtRenderMode;
  width: number;
  height: number;
}

export interface RealProductCutout {
  cutoutBuffer: Buffer;
  width: number;
  height: number;
}

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = (hex || '#0284C7').replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return { r: 2, g: 132, b: 199 };
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/**
 * Estima a largura renderizada em pixels para DejaVu Sans / Liberation Sans (usadas pelo librsvg/sharp no Linux),
 * com margem de segurança para fontes Bold e letter-spacing, garantindo ZERO corte ou vazamento.
 */
function estimateTextWidthPx(
  text: string,
  fontSize: number,
  isBold: boolean,
  letterSpacing = 0
): number {
  const factor = isBold ? 0.72 : 0.64;
  let units = 0;
  for (const ch of text) {
    if ('WM@%#&'.includes(ch)) units += 1.38;
    else if ('ABCDEFGHKNOPQRSTUVXYZÀÁÂÃÉÊÍÓÔÕÚÇ'.includes(ch)) units += 1.12;
    else if ('ilIjtfr1.,:;!|\' '.includes(ch)) units += 0.54;
    else if ('mw'.includes(ch)) units += 1.24;
    else if ('023456789'.includes(ch)) units += 1.05;
    else units += 0.96;
  }
  const spacingTotal = Math.max(0, text.length - 1) * letterSpacing;
  return units * fontSize * factor + spacingTotal;
}

/**
 * Quebra linhas de forma inteligente por palavra (NUNCA corta palavras ao meio e NUNCA trunca com "...").
 */
export function wrapPortugueseText(
  text: string,
  maxWidthPx: number,
  fontSize: number,
  isBold: boolean,
  letterSpacing = 0
): string[] {
  const clean = (text || '')
    .trim()
    .replace(/\s+/g, ' ')
    // Mantém número + unidade inseparáveis na quebra de linha (ex: "30 g", "6 mL", "50.000 L", "10 min")
    .replace(/(\d)\s+(g|kg|mg|mL|ml|L|l|cm|mm|m|ppm|min|h|dias|semanas|unidades|un|%|°C)\b/g, '$1\u00A0$2');
  if (!clean) return [];

  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (estimateTextWidthPx(candidate, fontSize, isBold, letterSpacing) <= maxWidthPx) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
        current = word;
      } else {
        // Palavra única maior que a largura: mantém inteira para não cortar informação
        lines.push(word);
        current = '';
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Auto-ajusta o tamanho da fonte dentro de limites legíveis Mobile-First para garantir que o texto
 * caiba perfeitamente no número máximo de linhas desejado SEM jamais cortar ou vazar do painel.
 */
function fitTextLines(
  text: string,
  maxWidthPx: number,
  initialFontSize: number,
  minFontSize: number,
  maxLines: number,
  isBold: boolean,
  letterSpacing = 0
): { fontSize: number; lines: string[] } {
  let fontSize = initialFontSize;
  let lines = wrapPortugueseText(text, maxWidthPx, fontSize, isBold, letterSpacing);

  while (
    fontSize > minFontSize &&
    (lines.length > maxLines ||
      lines.some((line) => estimateTextWidthPx(line, fontSize, isBold, letterSpacing) > maxWidthPx))
  ) {
    fontSize -= 1.5;
    lines = wrapPortugueseText(text, maxWidthPx, fontSize, isBold, letterSpacing);
  }

  return { fontSize: Math.round(fontSize), lines };
}

/**
 * Normaliza cards estruturados (compatível tanto com Híbrido 2.0 `cards` quanto com `bullets` legados).
 */
function resolveOverlayCards(spec: HybridOverlaySpec): ArtInfoCard[] {
  if (Array.isArray(spec.cards) && spec.cards.length > 0) {
    return spec.cards
      .map((c) => ({
        title: (c?.title || '').trim(),
        description: (c?.description || '').trim(),
      }))
      .filter((c) => c.title || c.description)
      .slice(0, 3);
  }

  return (spec.bullets || [])
    .map((b) => (b || '').trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((b) => {
      const sepIdx = b.indexOf(':');
      if (sepIdx > 2 && sepIdx < 34) {
        return {
          title: b.slice(0, sepIdx).trim(),
          description: b.slice(sepIdx + 1).trim(),
        };
      }
      return { title: b, description: '' };
    });
}

/**
 * Extrai recorte transparente 100% pixel-original de fotos de produto com fundo branco/neutro de estúdio.
 * Usa BFS (flood-fill) conectado EXCLUSIVAMENTE às 4 bordas externas da imagem:
 * - Protege 100% do branco INTERNO da embalagem (rótulos, blisters brancos, frascos brancos).
 * - Aplica suavização anti-aliasing na borda (feathering) para eliminar halos brancos em cenários escuros.
 * - Retorna `null` se a foto não for um packshot em fundo branco limpo (ex: foto ambientada),
 *   permitindo fallback seguro para Strict Compositing via Gemini.
 */
export async function extractRealProductCutout(
  sourceBuffer: Buffer,
  options: { isSlot1?: boolean } = {}
): Promise<RealProductCutout | null> {
  try {
    const { data, info } = await sharp(sourceBuffer)
      .resize(1100, 1100, { fit: 'inside', withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const w = info.width;
    const h = info.height;
    if (w < 120 || h < 120) return null;

    const rgba = Buffer.from(data);

    // 1. Inspeciona pixels das 4 bordas para validar se é foto de estúdio em fundo branco ou PNG transparente
    let borderTotal = 0;
    let borderWhiteLike = 0;
    let borderPureWhite = 0;
    let borderTransparent = 0;

    const isTransparentAt = (idx: number) => rgba[idx * 4 + 3] < 128;
    const isNearWhiteAt = (idx: number, minLum: number, maxChroma: number) => {
      const o = idx * 4;
      const a = rgba[o + 3];
      if (a < 128) return true;
      const r = rgba[o];
      const g = rgba[o + 1];
      const b = rgba[o + 2];
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      return minC >= minLum && maxC - minC <= maxChroma;
    };

    for (let x = 0; x < w; x++) {
      for (const y of [0, h - 1]) {
        const idx = y * w + x;
        borderTotal++;
        if (isTransparentAt(idx)) borderTransparent++;
        if (isNearWhiteAt(idx, 224, 26)) borderWhiteLike++;
        if (isNearWhiteAt(idx, 250, 8)) borderPureWhite++;
      }
    }
    for (let y = 1; y < h - 1; y++) {
      for (const x of [0, w - 1]) {
        const idx = y * w + x;
        borderTotal++;
        if (isTransparentAt(idx)) borderTransparent++;
        if (isNearWhiteAt(idx, 224, 26)) borderWhiteLike++;
        if (isNearWhiteAt(idx, 250, 8)) borderPureWhite++;
      }
    }

    const whiteRatio = borderWhiteLike / Math.max(1, borderTotal);
    const pureWhiteRatio = borderPureWhite / Math.max(1, borderTotal);
    const transRatio = borderTransparent / Math.max(1, borderTotal);

    // Se menos de 65% das bordas são branco limpo ou transparente, é uma foto ambientada/cenário -> não recortar
    if (whiteRatio < 0.65 && transRatio < 0.6) {
      return null;
    }

    // 2. Se ainda não é PNG transparente, executa BFS flood-fill somente a partir das bordas externas
    if (transRatio < 0.6) {
      // Em fundos de estúdio branco puro (#FFFFFF), usa limiar preciso (244/14) que remove artefatos JPEG externos
      // sem jamais "morder" embalagens brancas; em fundos levemente cinzas/off-white usa (234/18).
      const isPureWhiteStudio = pureWhiteRatio >= 0.8;
      const floodMinLum = isPureWhiteStudio ? 244 : 234;
      const floodMaxChroma = isPureWhiteStudio ? 14 : 18;
      const seedMinLum = isPureWhiteStudio ? 242 : 230;
      const seedMaxChroma = isPureWhiteStudio ? 16 : 22;

      const bgMask = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0;
      let tail = 0;

      const trySeed = (x: number, y: number) => {
        const idx = y * w + x;
        if (bgMask[idx] === 0 && isNearWhiteAt(idx, seedMinLum, seedMaxChroma)) {
          bgMask[idx] = 1;
          queue[tail++] = idx;
        }
      };

      for (let x = 0; x < w; x++) {
        trySeed(x, 0);
        trySeed(x, h - 1);
      }
      for (let y = 1; y < h - 1; y++) {
        trySeed(0, y);
        trySeed(w - 1, y);
      }

      while (head < tail) {
        const idx = queue[head++];
        const x = idx % w;
        const y = (idx - x) / w;

        // 4-conectividade para não vazar por cantos diagonais finos da embalagem
        if (x > 0) {
          const n = idx - 1;
          if (bgMask[n] === 0 && isNearWhiteAt(n, floodMinLum, floodMaxChroma)) {
            bgMask[n] = 1;
            queue[tail++] = n;
          }
        }
        if (x + 1 < w) {
          const n = idx + 1;
          if (bgMask[n] === 0 && isNearWhiteAt(n, floodMinLum, floodMaxChroma)) {
            bgMask[n] = 1;
            queue[tail++] = n;
          }
        }
        if (y > 0) {
          const n = idx - w;
          if (bgMask[n] === 0 && isNearWhiteAt(n, floodMinLum, floodMaxChroma)) {
            bgMask[n] = 1;
            queue[tail++] = n;
          }
        }
        if (y + 1 < h) {
          const n = idx + w;
          if (bgMask[n] === 0 && isNearWhiteAt(n, floodMinLum, floodMaxChroma)) {
            bgMask[n] = 1;
            queue[tail++] = n;
          }
        }
      }

      // Verifica se o flood-fill removeu uma proporção realista de fundo (entre 6% e 88%)
      const removedRatio = tail / (w * h);
      if (removedRatio < 0.06 || removedRatio > 0.88) {
        return null;
      }

      // 2B. RESTAURAÇÃO 100% PIXEL-ORIGINAL PARA EMBALAGENS BRANCAS (ZERO TRANSPARÊNCIA + ZERO REDESENHO DE IA):
      // Mede se o corpo superior da embalagem é branco/claro (ignorando a franja de 1px, preservando gatilhos de borrifadores pretos).
      // Se for embalagem branca (ex: sacos 2kg, blisters brancos, baldes brancos), restaura qualquer cavidade interna onde o flood-fill
      // entrou em reflexos especulares brancos da embalagem — mantendo 100% dos pixels reais da embalagem e do rótulo intactos!
      const rowMinX = new Int32Array(h).fill(w);
      const rowMaxX = new Int32Array(h).fill(-1);
      const colMinY = new Int32Array(w).fill(h);
      const colMaxY = new Int32Array(w).fill(-1);
      let minX = w;
      let maxX = 0;
      let minY = h;
      let maxY = 0;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (bgMask[y * w + x] === 0) {
            if (x < rowMinX[y]) rowMinX[y] = x;
            if (x > rowMaxX[y]) rowMaxX[y] = x;
            if (y < colMinY[x]) colMinY[x] = y;
            if (y > colMaxY[x]) colMaxY[x] = y;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      const bw = Math.max(1, maxX - minX + 1);
      const bh = Math.max(1, maxY - minY + 1);
      let fgInterior = 0;
      let fgLight = 0;
      let boundaryTotal = 0;
      let boundaryWhite = 0;

      for (let y = minY + 1; y < Math.min(h - 1, maxY); y++) {
        for (let x = minX + 1; x < Math.min(w - 1, maxX); x++) {
          const idx = y * w + x;
          if (bgMask[idx] !== 0) continue;

          const o = idx * 4;
          const r = rgba[o];
          const g = rgba[o + 1];
          const b = rgba[o + 2];
          const lum = (r + g + b) / 3;
          const ch = Math.max(r, g, b) - Math.min(r, g, b);

          const touchesBg =
            bgMask[idx - 1] === 1 ||
            bgMask[idx + 1] === 1 ||
            bgMask[idx - w] === 1 ||
            bgMask[idx + w] === 1;

          if (touchesBg) {
            boundaryTotal++;
            if (lum >= 200 && ch <= 32) boundaryWhite++;
          } else if (
            x >= minX + 2 &&
            x < w - 2 &&
            y >= minY + 2 &&
            y < h - 2 &&
            bgMask[idx - 2] === 0 &&
            bgMask[idx + 2] === 0 &&
            bgMask[idx - 2 * w] === 0 &&
            bgMask[idx + 2 * w] === 0
          ) {
            fgInterior++;
            if (lum >= 185 && ch <= 36) fgLight++;
          }
        }
      }

      const fgLightRatio = fgInterior > 200 ? fgLight / fgInterior : 0;
      const whiteBoundaryRatio = boundaryTotal > 60 ? boundaryWhite / boundaryTotal : 0;
      const isWhiteSurfacePackaging = fgLightRatio >= 0.16 || whiteBoundaryRatio >= 0.16;

      // CRÍTICO PARA SLOTS 2-8 (CENÁRIOS AMBIENTADOS/ESCUROS):
      // Se a embalagem possui corpo ou bordas brancas/claras sobre fundo branco de estúdio (ex: tubos brancos,
      // frascos brancos, sacos brancos, rótulos brancos encostando na borda), o flood-fill por cor inevitavelmente
      // morde o plástico branco (gerando buracos transparentes) ou deixa halo serrilhado.
      // Nesses casos, abortamos o recorte por flood-fill e acionamos o Compositing Sólido 100% opaco via Gemini!
      if (!options.isSlot1 && isWhiteSurfacePackaging) {
        console.log(
          `[🛡️ ArtComposer Anti-Transparência] Embalagem branca/clara detectada (corpo claro: ${(fgLightRatio * 100).toFixed(1)}%, borda clara: ${(whiteBoundaryRatio * 100).toFixed(1)}%). Abortando flood-fill para usar Compositing Sólido 100% opaco.`
        );
        return null;
      }

      if (isWhiteSurfacePackaging) {
        // Slot 1 (#FFFFFF): restaura eventuais cavidades de brilho branco mantendo 100% dos pixels originais
        const smoothColMinY = new Int32Array(colMinY);
        const maxBridgeSpan = Math.max(12, Math.round(bw * 0.14));
        const topBandLimit = minY + Math.round(bh * 0.12);
        for (let pass = 0; pass < 2; pass++) {
          for (let x = minX + 1; x < maxX; x++) {
            let lx = x - 1;
            while (lx >= minX && x - lx <= maxBridgeSpan && smoothColMinY[lx] > topBandLimit) {
              lx--;
            }
            let rx = x + 1;
            while (rx <= maxX && rx - x <= maxBridgeSpan && smoothColMinY[rx] > topBandLimit) {
              rx++;
            }
            if (lx >= minX && rx <= maxX && x - lx <= maxBridgeSpan && rx - x <= maxBridgeSpan) {
              const interpY = Math.round(
                smoothColMinY[lx] + ((smoothColMinY[rx] - smoothColMinY[lx]) * (x - lx)) / (rx - lx)
              );
              if (interpY < smoothColMinY[x]) smoothColMinY[x] = interpY;
            }
          }
        }

        let restoredPixels = 0;
        for (let y = minY; y <= maxY; y++) {
          if (rowMaxX[y] <= rowMinX[y]) continue;
          for (let x = rowMinX[y] + 1; x < rowMaxX[y]; x++) {
            const idx = y * w + x;
            if (bgMask[idx] === 1 && y >= smoothColMinY[x] && y < colMaxY[x]) {
              bgMask[idx] = 0;
              restoredPixels++;
            }
          }
        }
        if (restoredPixels > 500) {
          console.log(
            `[🛡️ ArtComposer Pixel-Original] Slot 1 blindado: ${restoredPixels} pixels de brilho branco restaurados (100% opaco).`
          );
        }
      }

      // 2C. REMOÇÃO DETERMINÍSTICA DE REFLEXO ESPELHADO / SOMBRA DE PISO DE CATÁLOGO (base 22% da silhueta):
      // Corta limpo o reflexo claro espelhado abaixo da base real do saco/embalagem sem afetar embalagens sem reflexo.
      const measureRow = (y: number) => {
        const lums: number[] = [];
        let satSum = 0;
        for (let x = minX; x <= maxX; x++) {
          const idx = y * w + x;
          if (bgMask[idx] === 0) {
            const o = idx * 4;
            const r = rgba[o];
            const g = rgba[o + 1];
            const b = rgba[o + 2];
            lums.push((r + g + b) / 3);
            satSum += Math.max(r, g, b) - Math.min(r, g, b);
          }
        }
        if (lums.length === 0) return { count: 0, meanLum: 255, p15Lum: 255, meanSat: 0 };
        lums.sort((a, b) => a - b);
        return {
          count: lums.length,
          meanLum: lums.reduce((a, b) => a + b, 0) / lums.length,
          p15Lum: lums[Math.floor(lums.length * 0.15)],
          meanSat: satSum / lums.length,
        };
      };

      const reflectionLimitY = Math.floor(minY + bh * 0.78);
      let cutY = maxY;
      let foundPaleBottom = false;
      for (let y = maxY; y >= reflectionLimitY; y--) {
        const st = measureRow(y);
        if (st.count === 0 || (st.meanLum >= 186 && st.p15Lum >= 145 && st.meanSat <= 24)) {
          cutY = y - 1;
          foundPaleBottom = true;
        } else {
          break;
        }
      }
      if (foundPaleBottom && cutY < maxY - 2) {
        let solidRowsAbove = 0;
        for (let y = Math.max(minY, cutY - 6); y <= cutY; y++) {
          const st = measureRow(y);
          if (st.count > 0 && (st.p15Lum <= 135 || st.meanLum <= 168 || st.meanSat >= 28)) {
            solidRowsAbove++;
          }
        }
        if (solidRowsAbove >= 2) {
          for (let y = cutY + 1; y <= maxY; y++) {
            for (let x = 0; x < w; x++) {
              bgMask[y * w + x] = 1;
            }
          }
        }
      }


      // Aplica transparência total ao fundo conectado
      for (let i = 0; i < w * h; i++) {
        if (bgMask[i] === 1) {
          rgba[i * 4 + 3] = 0;
        }
      }

      // Remove ilhas desconectadas pequenas (ex: sombra oval cinza destacada no rodapé da foto original de catálogo!)
      // Mantém o objeto principal e qualquer componente secundário relevante (>= 10% do maior componente, ex: kits de 2 frascos).
      const compLabels = new Int32Array(w * h);
      const compSizes: number[] = [0];
      let nextLabel = 1;
      let maxCompSize = 0;

      for (let startIdx = 0; startIdx < w * h; startIdx++) {
        if (bgMask[startIdx] === 1 || compLabels[startIdx] !== 0) continue;
        const label = nextLabel++;
        let qHead = 0;
        let qTail = 0;
        compLabels[startIdx] = label;
        queue[qTail++] = startIdx;

        while (qHead < qTail) {
          const cur = queue[qHead++];
          const cx = cur % w;
          const cy = (cur - cx) / w;
          if (cx > 0) {
            const n = cur - 1;
            if (bgMask[n] === 0 && compLabels[n] === 0) {
              compLabels[n] = label;
              queue[qTail++] = n;
            }
          }
          if (cx + 1 < w) {
            const n = cur + 1;
            if (bgMask[n] === 0 && compLabels[n] === 0) {
              compLabels[n] = label;
              queue[qTail++] = n;
            }
          }
          if (cy > 0) {
            const n = cur - w;
            if (bgMask[n] === 0 && compLabels[n] === 0) {
              compLabels[n] = label;
              queue[qTail++] = n;
            }
          }
          if (cy + 1 < h) {
            const n = cur + w;
            if (bgMask[n] === 0 && compLabels[n] === 0) {
              compLabels[n] = label;
              queue[qTail++] = n;
            }
          }
        }
        compSizes.push(qTail);
        if (qTail > maxCompSize) maxCompSize = qTail;
      }

      // Se nos Slots 2-8 o flood-fill fragmentou o produto em múltiplos blocos desconectados relevantes
      // (sinal clássico de que uma faixa/gargalo branco da embalagem foi comido pelo recorte),
      // aborta o recorte e delega ao Compositing Sólido via Gemini.
      if (!options.isSlot1 && maxCompSize > 0 && nextLabel > 2) {
        const majorComponents = compSizes.filter((sz) => sz >= Math.max(400, Math.round(maxCompSize * 0.08))).length;
        if (majorComponents >= 2) {
          console.log(
            `[🛡️ ArtComposer Anti-Transparência] Silhueta fragmentada em ${majorComponents} partes pelo flood-fill (faixa branca vazada). Alternando para Compositing Sólido.`
          );
          return null;
        }
      }

      if (maxCompSize > 0 && nextLabel > 2) {
        const minKeepSize = Math.max(200, Math.round(maxCompSize * 0.1));
        for (let i = 0; i < w * h; i++) {
          const lbl = compLabels[i];
          if (lbl > 0 && compSizes[lbl] < minKeepSize) {
            bgMask[i] = 1;
            rgba[i * 4 + 3] = 0;
          }
        }
      }

      // Suavização anti-aliasing conservadora de 1px na fronteira: remove apenas ruído isolado e franja branco-puro
      // sem jamais aplicar semi-transparência em bordas sólidas do produto.
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          if (bgMask[idx] === 1) continue;

          let bgNeighbors = 0;
          if (bgMask[idx - 1]) bgNeighbors++;
          if (bgMask[idx + 1]) bgNeighbors++;
          if (bgMask[idx - w]) bgNeighbors++;
          if (bgMask[idx + w]) bgNeighbors++;
          if (bgMask[idx - w - 1]) bgNeighbors++;
          if (bgMask[idx - w + 1]) bgNeighbors++;
          if (bgMask[idx + w - 1]) bgNeighbors++;
          if (bgMask[idx + w + 1]) bgNeighbors++;

          if (bgNeighbors === 0) continue;

          const o = idx * 4;
          const r = rgba[o];
          const g = rgba[o + 1];
          const b = rgba[o + 2];
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          const lum = (r + g + b) / 3;

          if (bgNeighbors >= 7) {
            // Remove pixels soltos de ruído (speckles)
            rgba[o + 3] = 0;
          } else if (bgNeighbors >= 4 && lum >= 244 && maxC - minC <= 10) {
            // Remove apenas 1px de halo branco puro solto na ponta externa
            rgba[o + 3] = Math.round(rgba[o + 3] * 0.55);
          }
        }
      }
    }

    // 3. Reconstrói PNG e recorta exatamente nos limites do produto (trim)
    const rawPng = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
      .png()
      .toBuffer();

    const trimmed = await sharp(rawPng).trim({ threshold: 10 }).png().toBuffer({ resolveWithObject: true });
    const trimW = trimmed.info.width;
    const trimH = trimmed.info.height;

    // Valida dimensões do recorte para garantir que não sobrou apenas um caco ou a imagem inteira sem recorte
    if (trimW < w * 0.14 || trimH < h * 0.14) return null;
    if (trimW * trimH > w * h * 0.96 && transRatio < 0.5) return null;

    return {
      cutoutBuffer: trimmed.data,
      width: trimW,
      height: trimH,
    };
  } catch (err: any) {
    console.warn('[ArtComposer] Recorte pixel-original não aplicável, usando fallback IA:', err?.message);
    return null;
  }
}

/**
 * Compõe o Slot 1 (Capa Oficial Marketplace): fundo 100% branco puro #FFFFFF + recorte real pixel-original
 * em escala heroica (~80%) + sombra suave de contato no piso. Zero distorção de rótulo!
 */
export async function composeSlot1StudioCover(cutout: RealProductCutout): Promise<Buffer> {
  const size = 1200;
  const maxBox = 950;

  const resized = await sharp(cutout.cutoutBuffer)
    .resize(maxBox, maxBox, { fit: 'inside', kernel: 'lanczos3' })
    .sharpen({ sigma: 0.65 })
    .png()
    .toBuffer({ resolveWithObject: true });

  const prodW = resized.info.width;
  const prodH = resized.info.height;
  const left = Math.round((size - prodW) / 2);
  const top = Math.round((size - prodH) / 2) - 14;

  const shadowCx = Math.round(size / 2);
  const shadowCy = Math.min(size - 28, top + prodH - 4);
  const shadowRx = Math.round(prodW * 0.44);
  const shadowRy = Math.max(16, Math.round(prodH * 0.032));

  const floorShadowSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs>
        <radialGradient id="s1Core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0F172A" stop-opacity="0.22" />
          <stop offset="55%" stop-color="#0F172A" stop-opacity="0.09" />
          <stop offset="100%" stop-color="#0F172A" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="s1Soft" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0F172A" stop-opacity="0.11" />
          <stop offset="70%" stop-color="#0F172A" stop-opacity="0.03" />
          <stop offset="100%" stop-color="#0F172A" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="${shadowCx}" cy="${shadowCy + 6}" rx="${Math.round(shadowRx * 1.25)}" ry="${Math.round(shadowRy * 1.65)}" fill="url(#s1Soft)" />
      <ellipse cx="${shadowCx}" cy="${shadowCy}" rx="${shadowRx}" ry="${shadowRy}" fill="url(#s1Core)" />
    </svg>
  `;

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: Buffer.from(floorShadowSvg, 'utf8'), top: 0, left: 0 },
      { input: resized.data, top, left },
    ])
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer();
}

/**
 * Compõe o recorte real pixel-original do produto sobre um cenário fotográfico 1200x1200 gerado por IA,
 * posicionado exatamente na ZONA SEGURA oposta à tipografia, com sombra de contato e sombra projetada suaves.
 */
export async function composeProductOntoStage(
  stageBuffer: Buffer,
  cutout: RealProductCutout,
  textPosition: TextPlacement
): Promise<Buffer> {
  const size = 1200;
  const stage1200 = await sharp(stageBuffer)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .ensureAlpha()
    .png()
    .toBuffer();

  // Zonas heroicas de posicionamento 100% livres da tipografia Híbrido 2.0
  const placementMap: Record<
    TextPlacement,
    { centerX: number; bottomY: number; maxW: number; maxH: number }
  > = {
    left: { centerX: 910, bottomY: 1095, maxW: 500, maxH: 820 },
    right: { centerX: 290, bottomY: 1095, maxW: 500, maxH: 820 },
    top: { centerX: 925, bottomY: 1115, maxW: 500, maxH: 770 },
    bottom: { centerX: 600, bottomY: 690, maxW: 490, maxH: 550 },
    none: { centerX: 600, bottomY: 1060, maxW: 860, maxH: 860 },
  };

  const zone = placementMap[textPosition] || placementMap.left;

  const prodResized = await sharp(cutout.cutoutBuffer)
    .resize(zone.maxW, zone.maxH, { fit: 'inside', kernel: 'lanczos3' })
    .sharpen({ sigma: 0.65 })
    .ensureAlpha()
    .png()
    .toBuffer({ resolveWithObject: true });

  const prodW = prodResized.info.width;
  const prodH = prodResized.info.height;
  const left = Math.max(24, Math.min(size - prodW - 24, Math.round(zone.centerX - prodW / 2)));
  const minTopMargin = textPosition === 'bottom' ? 52 : 24;
  const top = Math.max(minTopMargin, Math.min(size - prodH - 24, Math.round(zone.bottomY - prodH)));

  // 1. Sombra projetada da silhueta real do produto (dá profundidade 3D fotográfica)
  const rawSilhouette = await sharp(prodResized.data)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const shadowPixels = Buffer.alloc(rawSilhouette.data.length);
  for (let i = 0; i < rawSilhouette.data.length; i += 4) {
    shadowPixels[i] = 8;
    shadowPixels[i + 1] = 15;
    shadowPixels[i + 2] = 30;
    shadowPixels[i + 3] = Math.round(rawSilhouette.data[i + 3] * 0.34);
  }
  const padShadow = 44;
  const castShadowPng = await sharp(shadowPixels, {
    raw: { width: prodW, height: prodH, channels: 4 },
  })
    .extend({
      top: padShadow,
      bottom: padShadow,
      left: padShadow,
      right: padShadow,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .blur(16)
    .png()
    .toBuffer();

  // 2. Sombra de contato no piso/superfície (ambient occlusion firme sob a base da embalagem)
  const contactCx = left + Math.round(prodW / 2);
  const contactCy = Math.min(size - 20, top + prodH - 3);
  const contactRx = Math.round(prodW * 0.52);
  const contactRy = Math.max(20, Math.round(prodH * 0.044));

  const contactShadowSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs>
        <radialGradient id="aoCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#020617" stop-opacity="0.60" />
          <stop offset="52%" stop-color="#020617" stop-opacity="0.30" />
          <stop offset="100%" stop-color="#020617" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="aoSoft" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#020617" stop-opacity="0.34" />
          <stop offset="68%" stop-color="#020617" stop-opacity="0.11" />
          <stop offset="100%" stop-color="#020617" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="${contactCx + 6}" cy="${contactCy + 10}" rx="${Math.round(contactRx * 1.36)}" ry="${Math.round(contactRy * 1.80)}" fill="url(#aoSoft)" />
      <ellipse cx="${contactCx}" cy="${contactCy}" rx="${contactRx}" ry="${contactRy}" fill="url(#aoCore)" />
    </svg>
  `;

  const shadowLeft = Math.max(0, left - padShadow + 14);
  const shadowTop = Math.max(0, top - padShadow + 18);

  return sharp(stage1200)
    .composite([
      { input: castShadowPng, top: shadowTop, left: shadowLeft },
      { input: Buffer.from(contactShadowSvg, 'utf8'), top: 0, left: 0 },
      { input: prodResized.data, top, left },
    ])
    .png()
    .toBuffer();
}

/**
 * Gera um prompt de palco/cenário fotográfico LIMPO (sem produto desenhado pela IA e sem texto)
 * preparado para receber o recorte 100% pixel-original do produto real.
 */
function buildEmptyStagePrompt(baseScenePrompt: string, textPosition: TextPlacement): string {
  const stageLayoutByPos: Record<TextPlacement, string> = {
    left: 'COMPOSITION: Place a clean, well-lit foreground surface/ledge/countertop on the RIGHT 48% of the frame (bottom edge around 88% height) ready to hold a studio product upright. Keep the LEFT 52% as clean, atmospheric, softly blurred background depth (bokeh) for editorial typography.',
    right: 'COMPOSITION: Place a clean, well-lit foreground surface/ledge/countertop on the LEFT 48% of the frame (bottom edge around 88% height) ready to hold a studio product upright. Keep the RIGHT 52% as clean, atmospheric, softly blurred background depth (bokeh) for editorial typography.',
    top: 'COMPOSITION: Place a clean, well-lit foreground surface/ledge/countertop on the LOWER-RIGHT 48% of the frame (surface around 88% height) ready to hold a studio product upright. Keep the TOP 32% and LOWER-LEFT 50% as clean, atmospheric, softly blurred depth for editorial typography.',
    bottom: 'COMPOSITION: Place a clean, sunlit foreground stone ledge/deck/countertop across the MIDDLE of the frame (horizontal surface around 58% height from the top) ready to hold a hero product centered in the upper half. Keep the LOWER 40% clean and smooth for bottom editorial cards.',
    none: 'COMPOSITION: Clean commercial studio environment with subtle depth.',
  };

  return [
    'Photorealistic high-end commercial lifestyle & architectural stage photograph (50mm f/2.8 lens, natural editorial studio lighting, rich realistic textures, crisp foreground surface, cinematic background bokeh).',
    `SCENE CONCEPT: ${baseScenePrompt}`,
    stageLayoutByPos[textPosition] || stageLayoutByPos.left,
    'ABSOLUTE STAGE RULES (CRITICAL):',
    '1. DO NOT draw, generate, or include ANY product, bottle, packaging, box, blister pack, bucket, kit, or container anywhere in the image — the real product cutout will be composited in post-production!',
    '2. DO NOT render ANY text, letters, numbers, labels, badges, icons, watermarks, logos, or store names anywhere in the image.',
    '3. Keep the foreground resting surface flat, realistic, clean, and naturally lit so a real studio product placed on it looks 100% physically grounded.',
  ].join('\n');
}

/**
 * Renderiza o SVG de um Card Glassmorphism individual (com ícone ✓ ou círculo numerado 1-2-3).
 */
function renderGlassCardSvg(params: {
  x: number;
  y: number;
  width: number;
  card: ArtInfoCard;
  index: number;
  cardStyle: CardStyle;
  accent: string;
  isLight: boolean;
  compact?: boolean;
  fontStack: string;
}): { svg: string; height: number } {
  const { x, y, width, card, index, cardStyle, accent, isLight, compact, fontStack } = params;

  const padX = compact ? 18 : 22;
  const padY = compact ? 16 : 18;
  const iconR = compact ? 17 : 20;
  const iconGap = compact ? 14 : 16;

  const textX = x + padX + iconR * 2 + iconGap;
  const textMaxW = Math.max(120, width - padX * 2 - iconR * 2 - iconGap);

  const titleFit = card.title
    ? fitTextLines(card.title, textMaxW, compact ? 20 : 23, compact ? 16 : 18, 2, true, 0)
    : null;

  const descFit = card.description
    ? fitTextLines(card.description, textMaxW, compact ? 16 : 18, compact ? 13 : 15, compact ? 3 : 2, false, 0)
    : null;

  const titleLineH = titleFit ? Math.round(titleFit.fontSize * 1.24) : 0;
  const descLineH = descFit ? Math.round(descFit.fontSize * 1.3) : 0;

  let textBlockH = 0;
  if (titleFit) textBlockH += titleFit.lines.length * titleLineH;
  if (titleFit && descFit) textBlockH += 6;
  if (descFit) textBlockH += descFit.lines.length * descLineH;

  const minCardH = iconR * 2 + padY * 2;
  const cardH = Math.max(minCardH, textBlockH + padY * 2);

  const cardBg = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(15,23,42,0.78)';
  const cardBorder = isLight ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.22)';
  const titleColor = isLight ? '#0F172A' : '#FFFFFF';
  const descColor = isLight ? '#334155' : '#E2E8F0';

  const iconCx = x + padX + iconR;
  const iconCy = y + Math.round(cardH / 2);

  const parts: string[] = [];

  // Glassmorphism card container + subtle top specular highlight
  parts.push(`
    <rect x="${x}" y="${y}" width="${width}" height="${cardH}" rx="18" ry="18"
          fill="${cardBg}" stroke="${cardBorder}" stroke-width="1.8" filter="url(#glassCardShadow)" />
    <rect x="${x + 1}" y="${y + 1}" width="${width - 2}" height="3" rx="2"
          fill="${isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.14)'}" />
  `);

  // Left circular icon badge (Step number 1/2/3 OR crisp vector checkmark ✓)
  parts.push(`
    <circle cx="${iconCx}" cy="${iconCy}" r="${iconR}" fill="${accent}" />
  `);

  if (cardStyle === 'steps') {
    const numFontSize = compact ? 18 : 21;
    parts.push(`
      <text x="${iconCx}" y="${iconCy + Math.round(numFontSize * 0.36)}"
            text-anchor="middle" font-family="${fontStack}" font-size="${numFontSize}" font-weight="700"
            fill="#FFFFFF">${index + 1}</text>
    `);
  } else {
    const scale = compact ? 0.85 : 1.0;
    parts.push(`
      <g transform="translate(${iconCx}, ${iconCy}) scale(${scale})">
        <path d="M -7 0.5 L -2 5.5 L 8 -5.5" fill="none" stroke="#FFFFFF" stroke-width="3.2"
              stroke-linecap="round" stroke-linejoin="round" />
      </g>
    `);
  }

  // Vertically center text block inside card
  let curY = y + Math.round((cardH - textBlockH) / 2);

  if (titleFit) {
    for (const line of titleFit.lines) {
      curY += titleFit.fontSize;
      parts.push(`
        <text x="${textX}" y="${curY}"
              font-family="${fontStack}" font-size="${titleFit.fontSize}" font-weight="700"
              fill="${titleColor}">${escapeXml(line)}</text>
      `);
      curY += titleLineH - titleFit.fontSize;
    }
    if (descFit) curY += 6;
  }

  if (descFit) {
    for (const line of descFit.lines) {
      curY += descFit.fontSize;
      parts.push(`
        <text x="${textX}" y="${curY}"
              font-family="${fontStack}" font-size="${descFit.fontSize}" font-weight="400"
              fill="${descColor}">${escapeXml(line)}</text>
      `);
      curY += descLineH - descFit.fontSize;
    }
  }

  return { svg: parts.join('\n'), height: cardH };
}

/**
 * MOTOR EDITORIAL HÍBRIDO 2.0 (1200x1200):
 * - ZERO caixa branca chapada de PowerPoint e ZERO degradê preto obrigatório no topo.
 * - Scrim atmosférico direcional suave + Hierarquia editorial completa:
 *   Badge -> Headline -> Subtítulo explicativo -> 2 ou 3 Cards Glassmorphism (✓ ou Passos 1-2-3) -> Callout.
 * - ZERO corte de palavras, unidades inseparáveis (30 g, 50.000 L), ZERO erros de grafia PT-BR.
 */
export function buildHybridOverlaySvg(spec: HybridOverlaySpec, size = 1200): string {
  if (spec.slotNumber === 1 || spec.textPosition === 'none') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"></svg>`;
  }

  const accent = /^#[0-9A-Fa-f]{6}$/.test(spec.accentHex) ? spec.accentHex : '#0284C7';
  const accentRgb = hexToRgb(accent);
  const isLight = spec.panelTheme === 'light';
  const cardStyle: CardStyle = spec.cardStyle === 'steps' ? 'steps' : 'checks';
  const fontStack = `'DejaVu Sans', 'Liberation Sans', 'Noto Sans', Arial, Helvetica, sans-serif`;

  const scrimHex = isLight ? '#F8FAFC' : '#091526';
  const headlineColor = isLight ? '#0F172A' : '#FFFFFF';
  const subtitleColor = isLight ? '#1E293B' : '#E2E8F0';
  const calloutFill = isLight
    ? `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.16)`
    : `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.34)`;
  const calloutTextColor = isLight ? '#0F172A' : '#FFFFFF';

  const cleanBadge = (spec.badge || '').trim().toUpperCase();
  const cleanHeadline = (spec.headline || '').trim();
  const cleanSubtitle = (spec.subtitle || '').trim();
  const cleanCards = resolveOverlayCards(spec);
  const cleanCallout = (spec.callout || '').trim().toUpperCase();

  const badgeLetterSpacing = 1.1;
  const calloutLetterSpacing = 0.9;

  const elements: string[] = [];

  // Defs: filtros suaves + gradientes atmosféricos direcionais (sem caixa opaca chapada!)
  elements.push(`
    <defs>
      <filter id="glassCardShadow" x="-10%" y="-12%" width="120%" height="135%">
        <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#020617" flood-opacity="${isLight ? '0.14' : '0.32'}"/>
      </filter>
      <filter id="textLift" x="-8%" y="-12%" width="116%" height="132%">
        <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="${isLight ? '#FFFFFF' : '#020617'}" flood-opacity="${isLight ? '0.65' : '0.58'}"/>
      </filter>
      <linearGradient id="scrimLeft" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${scrimHex}" stop-opacity="${isLight ? '0.92' : '0.88'}" />
        <stop offset="44%" stop-color="${scrimHex}" stop-opacity="${isLight ? '0.78' : '0.74'}" />
        <stop offset="62%" stop-color="${scrimHex}" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="scrimRight" x1="100%" y1="0%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="${scrimHex}" stop-opacity="${isLight ? '0.92' : '0.88'}" />
        <stop offset="44%" stop-color="${scrimHex}" stop-opacity="${isLight ? '0.78' : '0.74'}" />
        <stop offset="62%" stop-color="${scrimHex}" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="scrimTop" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${scrimHex}" stop-opacity="${isLight ? '0.92' : '0.86'}" />
        <stop offset="28%" stop-color="${scrimHex}" stop-opacity="${isLight ? '0.70' : '0.62'}" />
        <stop offset="44%" stop-color="${scrimHex}" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="scrimBottom" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="${scrimHex}" stop-opacity="${isLight ? '0.95' : '0.92'}" />
        <stop offset="36%" stop-color="${scrimHex}" stop-opacity="${isLight ? '0.84' : '0.80'}" />
        <stop offset="52%" stop-color="${scrimHex}" stop-opacity="0" />
      </linearGradient>
    </defs>
  `);

  const renderBadgePill = (x: number, y: number, maxW: number): { svg: string; w: number; h: number } => {
    if (!cleanBadge) return { svg: '', w: 0, h: 0 };
    const fit = fitTextLines(cleanBadge, maxW - 44, 19, 14, 1, true, badgeLetterSpacing);
    const pillH = 42;
    const pillW = Math.min(
      maxW,
      Math.max(150, Math.round(estimateTextWidthPx(fit.lines[0], fit.fontSize, true, badgeLetterSpacing) + 46))
    );
    const svg = `
      <rect x="${x}" y="${y}" width="${pillW}" height="${pillH}" rx="12" ry="12" fill="${accent}" filter="url(#glassCardShadow)" />
      <text x="${x + Math.round(pillW / 2)}" y="${y + Math.round(pillH * 0.66)}"
            text-anchor="middle" font-family="${fontStack}" font-size="${fit.fontSize}" font-weight="700"
            letter-spacing="${badgeLetterSpacing}" fill="#FFFFFF">${escapeXml(fit.lines[0])}</text>
    `;
    return { svg, w: pillW, h: pillH };
  };

  const renderCalloutPill = (
    x: number,
    y: number,
    maxW: number,
    alignRightToX?: number
  ): { svg: string; w: number; h: number } => {
    if (!cleanCallout) return { svg: '', w: 0, h: 0 };
    const fit = fitTextLines(cleanCallout, maxW - 48, 19, 14, 1, true, calloutLetterSpacing);
    const pillH = 44;
    const pillW = Math.min(
      maxW,
      Math.max(160, Math.round(estimateTextWidthPx(fit.lines[0], fit.fontSize, true, calloutLetterSpacing) + 52))
    );
    const rx = alignRightToX !== undefined ? alignRightToX - pillW : x;
    const svg = `
      <rect x="${rx}" y="${y}" width="${pillW}" height="${pillH}" rx="12" ry="12"
            fill="${calloutFill}" stroke="${accent}" stroke-width="2.2" filter="url(#glassCardShadow)" />
      <text x="${rx + Math.round(pillW / 2)}" y="${y + Math.round(pillH * 0.66)}"
            text-anchor="middle" font-family="${fontStack}" font-size="${fit.fontSize}" font-weight="700"
            letter-spacing="${calloutLetterSpacing}" fill="${calloutTextColor}">${escapeXml(fit.lines[0])}</text>
    `;
    return { svg, w: pillW, h: pillH };
  };

  // =========================================================================
  // LAYOUT A: LATERAL (LEFT ou RIGHT) — Coluna Editorial Rica + Produto Heroico Oposto
  // =========================================================================
  if (spec.textPosition === 'left' || spec.textPosition === 'right') {
    const colW = 556;
    const colX = spec.textPosition === 'left' ? 48 : size - 48 - colW;

    elements.push(
      `<rect x="0" y="0" width="${size}" height="${size}" fill="url(#${spec.textPosition === 'left' ? 'scrimLeft' : 'scrimRight'})" />`
    );

    const headlineFit = cleanHeadline
      ? fitTextLines(cleanHeadline, colW, 44, 30, 3, true, 0)
      : null;
    const subtitleFit = cleanSubtitle
      ? fitTextLines(cleanSubtitle, colW, 21, 16, 3, false, 0)
      : null;

    const cardGap = 16;
    const cardRenders = cleanCards.map((card, idx) =>
      renderGlassCardSvg({
        x: colX,
        y: 0,
        width: colW,
        card,
        index: idx,
        cardStyle,
        accent,
        isLight,
        compact: cleanCards.length >= 3,
        fontStack,
      })
    );

    const badgeH = cleanBadge ? 42 : 0;
    const headlineLineH = headlineFit ? Math.round(headlineFit.fontSize * 1.18) : 0;
    const headlineH = headlineFit ? headlineFit.lines.length * headlineLineH : 0;
    const subtitleLineH = subtitleFit ? Math.round(subtitleFit.fontSize * 1.32) : 0;
    const subtitleH = subtitleFit ? subtitleFit.lines.length * subtitleLineH : 0;
    const cardsTotalH = cardRenders.reduce((acc, c, i) => acc + c.height + (i > 0 ? cardGap : 0), 0);
    const calloutH = cleanCallout ? 44 : 0;

    let totalStackH = 0;
    if (badgeH) totalStackH += badgeH + 20;
    if (headlineH) totalStackH += headlineH + (subtitleH ? 14 : 24);
    if (subtitleH) totalStackH += subtitleH + 26;
    if (cardsTotalH) totalStackH += cardsTotalH + (calloutH ? 24 : 0);
    if (calloutH) totalStackH += calloutH;

    let cursorY = Math.max(48, Math.round((size - totalStackH) / 2));

    if (cleanBadge) {
      const b = renderBadgePill(colX, cursorY, colW);
      elements.push(b.svg);
      cursorY += b.h + 20;
    }

    if (headlineFit) {
      for (const line of headlineFit.lines) {
        cursorY += headlineFit.fontSize;
        elements.push(`
          <text x="${colX}" y="${cursorY}" filter="url(#textLift)"
                font-family="${fontStack}" font-size="${headlineFit.fontSize}" font-weight="700"
                fill="${headlineColor}">${escapeXml(line)}</text>
        `);
        cursorY += headlineLineH - headlineFit.fontSize;
      }
      cursorY += subtitleH ? 14 : 24;
    }

    if (subtitleFit) {
      for (const line of subtitleFit.lines) {
        cursorY += subtitleFit.fontSize;
        elements.push(`
          <text x="${colX}" y="${cursorY}" filter="url(#textLift)"
                font-family="${fontStack}" font-size="${subtitleFit.fontSize}" font-weight="400"
                fill="${subtitleColor}">${escapeXml(line)}</text>
        `);
        cursorY += subtitleLineH - subtitleFit.fontSize;
      }
      cursorY += 26;
    }

    // Re-render cards at exact computed Y positions
    for (let i = 0; i < cleanCards.length; i++) {
      const rendered = renderGlassCardSvg({
        x: colX,
        y: cursorY,
        width: colW,
        card: cleanCards[i],
        index: i,
        cardStyle,
        accent,
        isLight,
        compact: cleanCards.length >= 3,
        fontStack,
      });
      elements.push(rendered.svg);
      cursorY += rendered.height + cardGap;
    }

    if (cleanCallout) {
      cursorY += cleanCards.length > 0 ? 8 : 0;
      const c = renderCalloutPill(colX, Math.min(size - 90, cursorY), colW);
      elements.push(c.svg);
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${elements.join('\n')}</svg>`;
  }

  // =========================================================================
  // LAYOUT B: TOP — Cabeçalho Full-Width no Topo + Cards na Esquerda Inferior + Produto na Direita Inferior
  // =========================================================================
  if (spec.textPosition === 'top') {
    const margin = 48;
    const fullW = size - margin * 2;
    const leftColW = 505;

    // Scrim suave contínuo no topo + lateral esquerda (começando em y=0 para ZERO emenda visível), deixando a direita inferior aberta para o produto
    elements.push(`
      <rect x="0" y="0" width="${size}" height="${size}" fill="url(#scrimTop)" />
      <rect x="0" y="0" width="${size}" height="${size}" fill="url(#scrimLeft)" opacity="0.62" />
    `);

    let cursorY = 44;

    // Linha 1: Badge à esquerda + Callout à direita (se couberem)
    let calloutPlacedTop = false;
    if (cleanBadge) {
      const b = renderBadgePill(margin, cursorY, 540);
      elements.push(b.svg);
      if (cleanCallout) {
        const c = renderCalloutPill(0, cursorY, 440, size - margin);
        if (b.w + c.w + 32 <= fullW) {
          elements.push(c.svg);
          calloutPlacedTop = true;
        }
      }
      cursorY += b.h + 18;
    }

    // Headline ampla no topo
    const headlineFit = cleanHeadline
      ? fitTextLines(cleanHeadline, fullW, 48, 32, 2, true, 0)
      : null;
    if (headlineFit) {
      const lh = Math.round(headlineFit.fontSize * 1.18);
      for (const line of headlineFit.lines) {
        cursorY += headlineFit.fontSize;
        elements.push(`
          <text x="${margin}" y="${cursorY}" filter="url(#textLift)"
                font-family="${fontStack}" font-size="${headlineFit.fontSize}" font-weight="700"
                fill="${headlineColor}">${escapeXml(line)}</text>
        `);
        cursorY += lh - headlineFit.fontSize;
      }
      cursorY += 10;
    }

    // Subtítulo explicativo
    const subtitleFit = cleanSubtitle
      ? fitTextLines(cleanSubtitle, fullW - 60, 22, 17, 2, false, 0)
      : null;
    if (subtitleFit) {
      const lh = Math.round(subtitleFit.fontSize * 1.3);
      for (const line of subtitleFit.lines) {
        cursorY += subtitleFit.fontSize;
        elements.push(`
          <text x="${margin}" y="${cursorY}" filter="url(#textLift)"
                font-family="${fontStack}" font-size="${subtitleFit.fontSize}" font-weight="400"
                fill="${subtitleColor}">${escapeXml(line)}</text>
        `);
        cursorY += lh - subtitleFit.fontSize;
      }
      cursorY += 26;
    } else {
      cursorY += 18;
    }

    // Cards Glassmorphism empilhados na metade inferior-esquerda (produto domina a direita!)
    let cardY = Math.max(cursorY + 12, 340);
    const cardGap = 16;
    for (let i = 0; i < cleanCards.length; i++) {
      const rendered = renderGlassCardSvg({
        x: margin,
        y: cardY,
        width: leftColW,
        card: cleanCards[i],
        index: i,
        cardStyle,
        accent,
        isLight,
        compact: cleanCards.length >= 3,
        fontStack,
      });
      elements.push(rendered.svg);
      cardY += rendered.height + cardGap;
    }

    if (cleanCallout && !calloutPlacedTop) {
      const c = renderCalloutPill(margin, Math.min(size - 88, cardY + 8), leftColW);
      elements.push(c.svg);
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${elements.join('\n')}</svg>`;
  }

  // =========================================================================
  // LAYOUT C: BOTTOM — Produto Centralizado no Topo + Deck Editorial Glassmorphism na Base
  // =========================================================================
  const margin = 44;
  const fullW = size - margin * 2;

  elements.push(`<rect x="0" y="0" width="${size}" height="${size}" fill="url(#scrimBottom)" />`);

  const headlineFit = cleanHeadline
    ? fitTextLines(cleanHeadline, fullW, 44, 30, 2, true, 0)
    : null;
  const subtitleFit = cleanSubtitle
    ? fitTextLines(cleanSubtitle, fullW, 21, 16, 2, false, 0)
    : null;

  // Calcula altura dos cards lado a lado (2 ou 3 colunas)
  const cardGapX = 16;
  const colCount = Math.max(1, cleanCards.length);
  const cardW = Math.floor((fullW - cardGapX * (colCount - 1)) / colCount);

  const preCards = cleanCards.map((card, idx) =>
    renderGlassCardSvg({
      x: margin + idx * (cardW + cardGapX),
      y: 0,
      width: cardW,
      card,
      index: idx,
      cardStyle,
      accent,
      isLight,
      compact: true,
      fontStack,
    })
  );
  const maxCardRowH = preCards.reduce((m, c) => Math.max(m, c.height), 0);

  const badgeRowH = cleanBadge || cleanCallout ? 44 : 0;
  const headlineLineH = headlineFit ? Math.round(headlineFit.fontSize * 1.18) : 0;
  const headlineH = headlineFit ? headlineFit.lines.length * headlineLineH : 0;
  const subtitleLineH = subtitleFit ? Math.round(subtitleFit.fontSize * 1.28) : 0;
  const subtitleH = subtitleFit ? subtitleFit.lines.length * subtitleLineH : 0;

  let deckH = 0;
  if (badgeRowH) deckH += badgeRowH + 16;
  if (headlineH) deckH += headlineH + (subtitleH ? 10 : 18);
  if (subtitleH) deckH += subtitleH + 20;
  if (maxCardRowH) deckH += maxCardRowH;

  let cursorY = Math.max(660, size - margin - deckH);

  // Badge (esquerda) + Callout (direita)
  if (cleanBadge || cleanCallout) {
    if (cleanBadge) {
      const b = renderBadgePill(margin, cursorY, 540);
      elements.push(b.svg);
    }
    if (cleanCallout) {
      const c = renderCalloutPill(0, cursorY, 460, size - margin);
      elements.push(c.svg);
    }
    cursorY += badgeRowH + 16;
  }

  // Headline
  if (headlineFit) {
    for (const line of headlineFit.lines) {
      cursorY += headlineFit.fontSize;
      elements.push(`
        <text x="${margin}" y="${cursorY}" filter="url(#textLift)"
              font-family="${fontStack}" font-size="${headlineFit.fontSize}" font-weight="700"
              fill="${headlineColor}">${escapeXml(line)}</text>
      `);
      cursorY += headlineLineH - headlineFit.fontSize;
    }
    cursorY += subtitleH ? 10 : 18;
  }

  // Subtitle
  if (subtitleFit) {
    for (const line of subtitleFit.lines) {
      cursorY += subtitleFit.fontSize;
      elements.push(`
        <text x="${margin}" y="${cursorY}" filter="url(#textLift)"
              font-family="${fontStack}" font-size="${subtitleFit.fontSize}" font-weight="400"
              fill="${subtitleColor}">${escapeXml(line)}</text>
      `);
      cursorY += subtitleLineH - subtitleFit.fontSize;
    }
    cursorY += 20;
  }

  // Side-by-side Glassmorphism Cards
  for (let i = 0; i < cleanCards.length; i++) {
    const rendered = renderGlassCardSvg({
      x: margin + i * (cardW + cardGapX),
      y: cursorY,
      width: cardW,
      card: cleanCards[i],
      index: i,
      cardStyle,
      accent,
      isLight,
      compact: true,
      fontStack,
    });
    elements.push(rendered.svg);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${elements.join('\n')}</svg>`;
}

/**
 * Compõe a camada tipográfica PT-BR Híbrido 2.0 sobre qualquer buffer de imagem limpa 1200x1200.
 */
export async function composeHybridOverlay(
  baseSceneBuffer: Buffer,
  overlay: HybridOverlaySpec
): Promise<Buffer> {
  const normalizedBase = await sharp(baseSceneBuffer)
    .resize(1200, 1200, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  if (overlay.slotNumber === 1 || overlay.textPosition === 'none') {
    return normalizedBase;
  }

  const svg = buildHybridOverlaySvg(overlay, 1200);
  return sharp(normalizedBase)
    .composite([{ input: Buffer.from(svg, 'utf8'), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

/**
 * Carrega uma imagem real do produto (URL remota da Nuvemshop ou caminho local em /public) para Buffer + mimeType.
 */
export async function loadSourceImageBuffer(
  urlOrPath: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const clean = (urlOrPath || '').split('?')[0].trim();
  if (!clean) {
    throw new Error('Nenhuma URL ou caminho de imagem fonte foi informado.');
  }

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    const res = await axios.get(clean, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: { 'User-Agent': '123Mart ArtDirector/3.0' },
    });
    const ct = typeof res.headers['content-type'] === 'string'
      ? res.headers['content-type'].split(';')[0]
      : 'image/jpeg';
    return { buffer: Buffer.from(res.data), mimeType: ct };
  }

  const rel = clean.replace(/^\//, '');
  const candidates = [
    path.join(process.cwd(), 'public', rel),
    path.join(process.cwd(), rel),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      const ext = path.extname(p).toLowerCase();
      const mimeType =
        ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      return { buffer: fs.readFileSync(p), mimeType };
    }
  }

  throw new Error(`Imagem fonte não encontrada no disco: ${clean}`);
}

/**
 * Otimiza o buffer final 1200x1200 para Marketplace: JPG (< 90 KB) e WebP (< 75 KB).
 */
async function saveMarketplaceAssets(
  pngBuffer: Buffer,
  sku: string,
  slotNumber: number,
  cleanSceneBuffer?: Buffer
): Promise<{
  jpgUrl: string;
  webpUrl: string;
  cleanSceneUrl?: string;
  jpgBytes: number;
  webpBytes: number;
}> {
  const outputDir = path.join(process.cwd(), 'public', 'assets', 'generated');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const safeSku = sku.replace(/[^a-zA-Z0-9_-]/g, '');
  const ts = Date.now();
  const baseName = `${safeSku}_slot_${slotNumber}_v${ts}`;

  let cleanSceneUrl: string | undefined;
  if (cleanSceneBuffer) {
    const cleanFile = `${baseName}_clean.png`;
    fs.writeFileSync(path.join(outputDir, cleanFile), cleanSceneBuffer);
    cleanSceneUrl = `/assets/generated/${cleanFile}`;
  }

  // Compressão adaptativa JPG (< 90 KB)
  let jpgQ = 86;
  let jpgBuf = await sharp(pngBuffer)
    .resize(1200, 1200, { fit: 'cover' })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: jpgQ, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toBuffer();

  while (jpgBuf.length > 89 * 1024 && jpgQ > 34) {
    jpgQ -= 6;
    jpgBuf = await sharp(pngBuffer)
      .resize(1200, 1200, { fit: 'cover' })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: jpgQ, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer();
  }

  const jpgFile = `${baseName}.jpg`;
  fs.writeFileSync(path.join(outputDir, jpgFile), jpgBuf);

  // Compressão adaptativa WebP (< 75 KB)
  let webpQ = 82;
  let webpBuf = await sharp(pngBuffer)
    .resize(1200, 1200, { fit: 'cover' })
    .webp({ quality: webpQ, effort: 5 })
    .toBuffer();

  while (webpBuf.length > 74 * 1024 && webpQ > 32) {
    webpQ -= 6;
    webpBuf = await sharp(pngBuffer)
      .resize(1200, 1200, { fit: 'cover' })
      .webp({ quality: webpQ, effort: 5 })
      .toBuffer();
  }

  const webpFile = `${baseName}.webp`;
  fs.writeFileSync(path.join(outputDir, webpFile), webpBuf);

  return {
    jpgUrl: `/assets/generated/${jpgFile}`,
    webpUrl: `/assets/generated/${webpFile}`,
    cleanSceneUrl,
    jpgBytes: jpgBuf.length,
    webpBytes: webpBuf.length,
  };
}

/**
 * Chama o modelo real de geração/edição de imagem do Gemini (Nano Banana 2.1 -> fallback Flash Lite Image).
 * Se `sourceBuffer` for `null`, gera um cenário fotográfico limpo puro (para composição de recorte pixel-original).
 */
async function callGeminiImageModel(
  sourceBuffer: Buffer | null,
  sourceMimeType: string,
  promptText: string
): Promise<{ imageBuffer: Buffer; modelUsed: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err: any = new Error(
      'GEMINI_API_KEY não configurada no servidor. Selecione uma chave de API paga no AI Studio para gerar imagens com Nano Banana 2.1.'
    );
    err.code = 'MISSING_API_KEY';
    throw err;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  const contents: any[] = [];
  if (sourceBuffer) {
    const normalizedInput = await sharp(sourceBuffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 92 })
      .toBuffer();

    contents.push({
      inlineData: {
        data: normalizedInput.toString('base64'),
        mimeType: 'image/jpeg',
      },
    });
  }
  contents.push({ text: promptText });

  const modelsToTry: Array<{ model: string; imageConfig: Record<string, string> }> = [
    { model: 'gemini-nano-banana-2.1', imageConfig: { aspectRatio: '1:1', imageSize: '1K' } },
    { model: 'gemini-3.1-flash-lite-image', imageConfig: { aspectRatio: '1:1' } },
  ];

  let lastError: any = null;

  for (const candidate of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: candidate.model,
        contents,
        config: {
          imageConfig: candidate.imageConfig,
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          return {
            imageBuffer: Buffer.from(part.inlineData.data, 'base64'),
            modelUsed: candidate.model,
          };
        }
      }
      lastError = new Error(`Modelo ${candidate.model} respondeu sem dados de imagem (inlineData vazio).`);
    } catch (err: any) {
      console.warn(`[ArtComposer] Falha no modelo ${candidate.model}:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Falha ao gerar imagem nos modelos Gemini.');
}

/**
 * Pipeline completa HÍBRIDO 2.0 de produção visual de 1 slot:
 * - Slot 1: tenta recorte real pixel-original sobre #FFFFFF puro com sombra de estúdio (100% fidelidade do rótulo);
 *   fallback para Gemini Strict Compositing com trava de integridade da embalagem.
 * - Slots 2-8 (Modo Híbrido 2.0):
 *   1) Se a foto base for um packshot limpo em fundo branco, gera o CENÁRIO PURO fotográfico no Gemini Nano Banana 2.1,
 *      compõe o recorte 100% pixel-original do produto com sombra realista de estúdio (salvo como *_clean.png),
 *      e aplica a camada editorial Glassmorphism Híbrido 2.0 em PT-BR (Badge + Headline + Subtítulo + Cards ✓/1-2-3 + Callout).
 *   2) Se a foto base for ambientada/sem fundo branco isolável, usa Gemini Strict Compositing com travas de Zona Segura
 *      e aplica a camada editorial Glassmorphism Híbrido 2.0 por cima.
 * - Slots 2-8 (Modo IA Integrada): Gemini renderiza cena + produto + texto integrado.
 */
export async function generateArtSlotImage(
  input: ComposeArtSlotInput
): Promise<ComposeArtSlotResult> {
  const {
    sku,
    slotNumber,
    sourceImageUrlOrPath,
    renderMode,
    hybridScenePrompt,
    integratedImagePrompt,
    overlay,
    overlayOnly,
    cachedCleanScenePath,
    forceSolidAiCompositing,
  } = input;

  // Modo rápido: usuário editou apenas o texto no Modo Híbrido 2.0 sobre uma cena já gerada!
  if (overlayOnly && renderMode === 'hybrid' && cachedCleanScenePath && slotNumber > 1) {
    const cleanLoaded = await loadSourceImageBuffer(cachedCleanScenePath);
    const composedPng = await composeHybridOverlay(cleanLoaded.buffer, overlay);
    const saved = await saveMarketplaceAssets(composedPng, sku, slotNumber);
    return {
      jpgUrl: saved.jpgUrl,
      webpUrl: saved.webpUrl,
      cleanSceneUrl: cachedCleanScenePath,
      jpgSizeKb: `${(saved.jpgBytes / 1024).toFixed(1)} KB`,
      webpSizeKb: `${(saved.webpBytes / 1024).toFixed(1)} KB`,
      jpgBytes: saved.jpgBytes,
      webpBytes: saved.webpBytes,
      modelUsed: 'Híbrido 2.0 (Tipografia PT-BR Instantânea)',
      renderMode: 'hybrid',
      width: 1200,
      height: 1200,
    };
  }

  // 1. Carrega foto real do produto da Nuvemshop (ou fallback local)
  const source = await loadSourceImageBuffer(sourceImageUrlOrPath);

  // 2. Tenta extrair recorte 100% pixel-original (quando a foto fonte é um packshot limpo e íntegro, sem vazamento em embalagem branca)
  const shouldAttemptCutout =
    !forceSolidAiCompositing && (slotNumber === 1 || renderMode === 'hybrid');
  const realCutout = shouldAttemptCutout
    ? await extractRealProductCutout(source.buffer, { isSlot1: slotNumber === 1 })
    : null;

  let finalPngBuffer: Buffer;
  let cleanSceneToPersist: Buffer | undefined;
  let finalModelLabel = '';

  // 3A. SLOT 1 COM RECORTE PIXEL-ORIGINAL (Fidelidade absoluta 100% sem distorção de rótulo pela IA!)
  if (slotNumber === 1 && realCutout) {
    finalPngBuffer = await composeSlot1StudioCover(realCutout);
    finalModelLabel = 'Estúdio Real #FFFFFF (Recorte Pixel-Original)';
  }
  // 3B. SLOTS 2-8 HÍBRIDO 2.0 COM RECORTE PIXEL-ORIGINAL + PALCO FOTOGRÁFICO NANO BANANA 2.1
  else if (slotNumber > 1 && renderMode === 'hybrid' && realCutout) {
    const stagePrompt = buildEmptyStagePrompt(hybridScenePrompt, overlay.textPosition);
    const { imageBuffer: stageRawBuffer, modelUsed } = await callGeminiImageModel(
      null,
      'image/jpeg',
      stagePrompt
    );

    // Compõe produto real pixel-original + sombra realista sobre o cenário gerado -> salva como *_clean.png
    cleanSceneToPersist = await composeProductOntoStage(
      stageRawBuffer,
      realCutout,
      overlay.textPosition
    );

    // Aplica camada editorial Glassmorphism Híbrido 2.0 PT-BR por cima
    finalPngBuffer = await composeHybridOverlay(cleanSceneToPersist, overlay);
    finalModelLabel = `${modelUsed} + Recorte Real + Híbrido 2.0`;
  }
  // 3C. STRICT COMPOSITING SÓLIDO VIA GEMINI (para embalagens brancas/com reflexo, fotos ambientadas ou Modo IA Integrada)
  else {
    const basePrompt =
      slotNumber === 1 || renderMode === 'hybrid'
        ? hybridScenePrompt
        : integratedImagePrompt;

    const safeZoneLock: Record<TextPlacement, string> = {
      bottom:
        'CRITICAL FRAMING SAFE ZONE: Place the ENTIRE product packaging completely inside the UPPER 55% of the square frame with comfortable breathing margin at the very top (never crop the top edge of the bag/bottle) and ending ABOVE the lower 40% of the image. Leave the ENTIRE BOTTOM 40% completely free of the product so a bottom editorial deck will NEVER cover any part of the packaging.',
      top:
        'CRITICAL FRAMING SAFE ZONE: Place the ENTIRE product packaging completely inside the LOWER-RIGHT 50% of the square frame (starting below the top 34% and to the right of the left 50%). Leave the TOP 34% and LOWER-LEFT 50% completely free of the product so the editorial header and info cards NEVER cover any part of the packaging.',
      left:
        'CRITICAL FRAMING SAFE ZONE: Place the ENTIRE product packaging completely inside the RIGHT 46% of the square frame, leaving the ENTIRE LEFT 52% completely free of the product for the left editorial cards.',
      right:
        'CRITICAL FRAMING SAFE ZONE: Place the ENTIRE product packaging completely inside the LEFT 46% of the square frame, leaving the ENTIRE RIGHT 52% completely free of the product for the right editorial cards.',
      none: '',
    };

    const solidOpaqueRule =
      'SOLID OPAQUE PACKAGING & NO FLOOR-REFLECTION RULE (CRITICAL): Render the ENTIRE product packaging — including ALL white cylindrical tubes, white bottle necks/collars, white plastic walls, white corners, white pouches/bags, and white labels — 100% SOLID, OPAQUE, and PHYSICALLY REAL with crisp natural edges (ZERO white sticker cutout halo, NEVER semi-transparent, NEVER ghostly, NEVER let the scene background bleed through white plastic or label areas). Completely REMOVE any inverted white-floor mirror reflection from the bottom of the reference catalog photo and rest the true solid base of the packaging naturally onto the scene surface with a soft realistic contact shadow.';

    const activePrompt =
      slotNumber === 1
        ? `${basePrompt}\n\nABSOLUTE PACKAGING INTEGRITY RULE: Replicate the reference product packaging with 100% pixel-faithful fidelity — KEEP EVERY SINGLE printed word, brand logo, colored seal/badge, dosage number, weight, and graphic printed ON THE PACKAGING completely intact, crisp, and legible. ${solidOpaqueRule} Only the outer pure #FFFFFF white studio background surrounding the product must have zero added promotional banners, zero floating text, and zero watermarks.`
        : renderMode === 'hybrid'
          ? `${basePrompt}\n\nABSOLUTE PACKAGING & SAFE-ZONE RULES:\n1. KEEP 100% of ALL original printed text, colored seals, logos, and graphics ON THE PRODUCT PACKAGING completely intact and readable (never erase text that is printed on the product itself).\n2. ${solidOpaqueRule}\n3. ${safeZoneLock[overlay.textPosition]}\n4. DO NOT add any floating promotional text, headlines, callouts, badges, watermarks, or store names in the surrounding scene/background outside the product packaging.`
          : `${basePrompt}\n\nABSOLUTE PACKAGING INTEGRITY RULE: Keep 100% of original printed logos, seals, and labels on the product packaging intact. ${solidOpaqueRule} ${safeZoneLock[overlay.textPosition]}`;

    const { imageBuffer: aiRawBuffer, modelUsed } = await callGeminiImageModel(
      source.buffer,
      source.mimeType,
      activePrompt
    );

    if (slotNumber === 1) {
      finalPngBuffer = await sharp(aiRawBuffer)
        .resize(1200, 1200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .flatten({ background: '#ffffff' })
        .png()
        .toBuffer();
      finalModelLabel = `${modelUsed} (Estúdio Sólido #FFFFFF)`;
    } else if (renderMode === 'hybrid') {
      cleanSceneToPersist = await sharp(aiRawBuffer)
        .resize(1200, 1200, { fit: 'cover', position: 'centre' })
        .png()
        .toBuffer();
      finalPngBuffer = await composeHybridOverlay(cleanSceneToPersist, overlay);
      finalModelLabel = `${modelUsed} + Compositing Sólido + Híbrido 2.0`;
    } else {
      finalPngBuffer = await sharp(aiRawBuffer)
        .resize(1200, 1200, { fit: 'cover', position: 'centre' })
        .png()
        .toBuffer();
      finalModelLabel = modelUsed;
    }
  }

  // 4. Exporta JPG (< 90 KB) e WebP (< 75 KB) otimizados para Marketplaces
  const saved = await saveMarketplaceAssets(
    finalPngBuffer,
    sku,
    slotNumber,
    cleanSceneToPersist
  );

  return {
    jpgUrl: saved.jpgUrl,
    webpUrl: saved.webpUrl,
    cleanSceneUrl: saved.cleanSceneUrl,
    jpgSizeKb: `${(saved.jpgBytes / 1024).toFixed(1)} KB`,
    webpSizeKb: `${(saved.webpBytes / 1024).toFixed(1)} KB`,
    jpgBytes: saved.jpgBytes,
    webpBytes: saved.webpBytes,
    modelUsed: finalModelLabel,
    renderMode,
    width: 1200,
    height: 1200,
  };
}
