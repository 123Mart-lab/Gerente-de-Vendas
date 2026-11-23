import type { GoogleGenAI, GenerateContentResponse } from '@google/genai';

export interface GeminiRetryOptions {
  /** Nome legível da etapa para logs no terminal */
  label?: string;
  /** Número máximo de retentativas por modelo em caso de 429/503 (padrão: 4) */
  maxRetries?: number;
  /** Lista explícita de modelos de fallback. Se omitido, usa fallback padrão do modelo primário. Passe [] para desativar fallback. */
  fallbackModels?: string[];
  /** Espaçamento mínimo global entre chamadas Gemini em ms para evitar rajadas de RPM (padrão: 1400ms) */
  minPacingMs?: number;
}

const DEFAULT_FALLBACK_MAP: Record<string, string[]> = {
  'gemini-4-hydrogen': ['gemini-3.1-flash-lite'],
  'gemini-3.1-flash-lite': ['gemini-4-hydrogen'],
  'gemini-nano-banana-2.1': ['gemini-3.1-flash-lite-image'],
  'gemini-3.1-flash-lite-image': ['gemini-nano-banana-2.1'],
};

const BACKOFF_SCHEDULE_MS = [5000, 12000, 24000, 45000];

// Fila global de cadenciamento (RPM pacing) + cooldown compartilhado em caso de 429
let pacingQueue: Promise<void> = Promise.resolve();
let lastCallCompletedOrStartedAt = 0;
let globalCooldownUntil = 0;

export function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function getErrorStatus(err: any): number | null {
  const candidates = [err?.status, err?.code, err?.error?.code, err?.response?.status];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
    if (typeof c === 'string' && /^\d{3}$/.test(c)) return Number(c);
  }
  return null;
}

function getErrorText(err: any): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  const parts: string[] = [];
  if (err.message) parts.push(String(err.message));
  if (err.statusText) parts.push(String(err.statusText));
  if (err.error?.message) parts.push(String(err.error.message));
  if (err.error?.status) parts.push(String(err.error.status));
  try {
    if (err.details) parts.push(JSON.stringify(err.details));
  } catch {}
  return parts.join(' | ');
}

export function isRateLimitError(err: any): boolean {
  const status = getErrorStatus(err);
  if (status === 429) return true;
  const msg = getErrorText(err);
  return /\b429\b|RESOURCE_EXHAUSTED|Too Many Requests|rate.?limit|quota.?exceeded|exceeded your current quota|Quota exceeded/i.test(msg);
}

export function isTransientServerError(err: any): boolean {
  const status = getErrorStatus(err);
  if (status !== null && [500, 502, 503, 504].includes(status)) return true;
  const msg = getErrorText(err);
  return /\b(500|502|503|504)\b|UNAVAILABLE|OVERLOADED|INTERNAL|DEADLINE_EXCEEDED|ECONNRESET|ETIMEDOUT|socket hang up|fetch failed/i.test(msg);
}

export function isModelNotFoundError(err: any): boolean {
  const status = getErrorStatus(err);
  if (status === 404) return true;
  const msg = getErrorText(err);
  return /\b404\b|NOT_FOUND|is not found|not supported for generateContent/i.test(msg);
}

export function extractRetryDelayMs(err: any): number | null {
  const msg = getErrorText(err);
  // Ex: "retryDelay":"18s" ou "Please retry in 14.23s" ou "retry after 20 seconds"
  const secMatch =
    msg.match(/retryDelay["']?\s*[:=]\s*["']?(\d+(?:\.\d+)?)s/i) ||
    msg.match(/retry\s+(?:in|after)\s+(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)/i);
  if (secMatch && secMatch[1]) {
    const secs = Number(secMatch[1]);
    if (Number.isFinite(secs) && secs > 0) {
      return Math.min(65000, Math.max(3500, Math.ceil(secs * 1000) + 1000));
    }
  }
  return null;
}

/**
 * Garante espaçamento mínimo entre chamadas consecutivas ao Gemini e respeita
 * qualquer janela global de cooldown ativada por um erro 429 recente.
 */
async function acquireGeminiPacingSlot(minPacingMs: number): Promise<void> {
  const run = async () => {
    const now = Date.now();
    const earliestAllowed = Math.max(
      lastCallCompletedOrStartedAt + minPacingMs,
      globalCooldownUntil
    );
    const waitMs = earliestAllowed - now;
    if (waitMs > 0) {
      await sleepMs(waitMs);
    }
    lastCallCompletedOrStartedAt = Date.now();
  };

  const next = pacingQueue.then(run, run);
  pacingQueue = next.catch(() => {});
  await next;
}

function adaptConfigForModel(model: string, config: any): any {
  if (!config || typeof config !== 'object') return config;
  const cloned = { ...config };
  const isGemini3Lite = model === 'gemini-3.1-flash-lite';
  const isGemini4 = /^gemini-4-/i.test(model);

  if (isGemini3Lite && cloned.thinkingConfig?.thinkingLevel) {
    const lvl = String(cloned.thinkingConfig.thinkingLevel).toUpperCase();
    // ThinkingLevel.XHIGH é exclusivo dos modelos gemini-4-*
    if (lvl === 'XHIGH') {
      cloned.thinkingConfig = { ...cloned.thinkingConfig, thinkingLevel: 'HIGH' };
    }
  }

  if (isGemini4) {
    delete cloned.temperature;
    delete cloned.topP;
    delete cloned.topK;
    delete cloned.candidateCount;
  }

  return cloned;
}

/**
 * Executa client.models.generateContent com:
 * 1) Cadenciamento global entre chamadas (evita picos de RPM);
 * 2) Retry automático com Exponential Backoff + Jitter (respeitando retryDelay do Google em 429/503);
 * 3) Fallback automático para modelo alternativo com cota independente quando o modelo primário persiste em 429/503/404.
 */
export async function generateContentWithRetry(
  client: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  options: GeminiRetryOptions = {}
): Promise<GenerateContentResponse> {
  const label = options.label || params.model;
  const maxRetries = options.maxRetries ?? 4;
  const minPacingMs = options.minPacingMs ?? 1400;

  const fallbackList =
    options.fallbackModels !== undefined
      ? options.fallbackModels
      : DEFAULT_FALLBACK_MAP[params.model] || [];

  const modelsToAttempt = [params.model, ...fallbackList.filter((m) => m && m !== params.model)];
  let lastError: any = null;

  for (let mIdx = 0; mIdx < modelsToAttempt.length; mIdx++) {
    const currentModel = modelsToAttempt[mIdx];
    const isFallback = mIdx > 0;

    if (isFallback) {
      console.warn(
        `[🔄 Gemini Fallback] (${label}) Alternando de "${modelsToAttempt[mIdx - 1]}" para "${currentModel}" devido a limite/indisponibilidade persistente.`
      );
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await acquireGeminiPacingSlot(minPacingMs);

        const adaptedConfig = adaptConfigForModel(currentModel, params.config);
        const response = await client.models.generateContent({
          model: currentModel,
          contents: params.contents,
          ...(adaptedConfig ? { config: adaptedConfig } : {}),
        });

        return response;
      } catch (err: any) {
        lastError = err;
        const rateLimited = isRateLimitError(err);
        const transient = isTransientServerError(err);
        const notFound = isModelNotFoundError(err);

        // Se o modelo não existe/não suporta (404), pula direto para o fallback sem gastar retries
        if (notFound) {
          console.warn(`[⚠️ Gemini 404] (${label}) Modelo "${currentModel}" indisponível (404).`);
          break;
        }

        if ((rateLimited || transient) && attempt < maxRetries) {
          const hintedMs = extractRetryDelayMs(err);
          const scheduleMs = BACKOFF_SCHEDULE_MS[Math.min(attempt, BACKOFF_SCHEDULE_MS.length - 1)];
          const jitterMs = Math.floor(Math.random() * 1500);
          const delayMs = Math.max(hintedMs || 0, scheduleMs) + jitterMs;

          if (rateLimited) {
            // Protege outras chamadas paralelas durante a janela de recuperação
            globalCooldownUntil = Math.max(globalCooldownUntil, Date.now() + Math.min(delayMs, 20000));
          }

          console.warn(
            `[⏳ Gemini Retry] (${label} | ${currentModel}) ${rateLimited ? '429 Limite de Requisições' : 'Erro Temporário 5xx'} — tentativa ${attempt + 1}/${maxRetries}. Aguardando ${(delayMs / 1000).toFixed(1)}s...`
          );
          await sleepMs(delayMs);
          continue;
        }

        // Se esgotou os retries neste modelo por 429/503 e existe fallback, avança para o próximo modelo
        if ((rateLimited || transient) && mIdx < modelsToAttempt.length - 1) {
          break;
        }

        // Erro não-retentável (400, 401, 403, etc.) ou último fallback esgotado
        throw err;
      }
    }
  }

  throw lastError || new Error(`Falha ao chamar Gemini (${label}) após retries e fallback.`);
}
