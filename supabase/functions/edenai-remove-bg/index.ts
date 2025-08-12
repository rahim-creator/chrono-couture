// Supabase Edge Function: edenai-remove-bg
// Proxy sécurisé vers EdenAI pour la suppression d’arrière-plan
// - Reçoit une image en data URL (base64)
// - Tente provider principal: api4ai (jusqu'à 3 retries)
// - Fallback automatique vers remove-bg (jusqu'à 3 retries)
// - Timeout de 30s max par requête (25s par appel EdenAI)
// - Valide l'input (data URL image, taille <= 5MB)
// - CORS activé, logs détaillés de performance
// - Réponse: { image: string(data URL ou URL), durationMs: number, provider: string, attempts: number, metrics }

// Deno runtime

// CORS allowlist & security helpers
const DEFAULT_ALLOWED_HOST_SUFFIXES = ['.lovable.app', '.lovable.dev', '.lovableproject.com'];
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
];
function parseAllowedOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_ORIGINS') || '';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
function isOriginAllowed(origin?: string | null): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    const configured = new Set<string>([...parseAllowedOrigins(), ...DEFAULT_ALLOWED_ORIGINS]);
    if (configured.has(origin)) return origin;
    if (DEFAULT_ALLOWED_HOST_SUFFIXES.some((sfx) => host.endsWith(sfx))) return origin;
  } catch (_) {
    // ignore
  }
  return null;
}
function corsHeaders(origin?: string | null): HeadersInit {
  const allowed = isOriginAllowed(origin);
  return {
    'Access-Control-Allow-Origin': allowed ?? 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Vary': 'Origin',
  };
}

// Best-effort, in-memory rate limiter (per IP+Origin)
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX = 20; // max requests per window
const rateMap = new Map<string, { count: number; resetAt: number }>();
function getClientKey(req: Request): string {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const origin = req.headers.get('origin') || 'unknown';
  return `${ip}|${origin}`;
}
function checkRateLimit(req: Request) {
  const key = getClientKey(req);
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    const resetAt = now + RATE_WINDOW_MS;
    rateMap.set(key, { count: 1, resetAt });
    return { allowed: true, retryAfter: 0, remaining: RATE_MAX - 1, resetAt };
  }
  if (entry.count >= RATE_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000), remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  return { allowed: true, retryAfter: 0, remaining: RATE_MAX - entry.count, resetAt: entry.resetAt };
}

// Global timeout budget for the whole function
const GLOBAL_TIMEOUT_MS = 28_000;

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), { ...init, headers });
}

function errorResponse(message: string, status = 400, origin?: string | null, extra?: Record<string, unknown>) {
  const body = extra ? { error: message, ...extra } : { error: message };
  return jsonResponse(body, { status, headers: corsHeaders(origin) });
}

// Parse et valide une data URL image, retourne sa taille en octets
function getDataUrlInfo(dataUrl: string): { isDataUrl: boolean; mime?: string; bytes?: number } {
  const m = /^data:([^;,]+);base64,(.*)$/.exec(dataUrl);
  if (!m) return { isDataUrl: false };
  const mime = m[1];
  const b64 = m[2];
  // Taille base64 -> bytes ~= (len * 3) / 4 - padding
  const padding = (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
  const bytes = Math.floor((b64.length * 3) / 4) - padding;
  return { isDataUrl: true, mime, bytes };
}

function isSupportedImageMime(mime?: string) {
  if (!mime) return false;
  const allowed = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
  return allowed.has(mime.toLowerCase());
}

function dataUrlToBase64(dataUrl: string): { mime: string; b64: string } | null {
  const m = /^data:([^;,]+);base64,(.*)$/.exec(dataUrl);
  if (!m) return null;
  return { mime: m[1], b64: m[2] };
}

function extractImageFromEden(provider: string, data: any): string | undefined {
  const p = data?.[provider] ?? data?.items?.find?.((i: any) => i?.provider === provider) ?? data?.result?.[provider];
  if (!p) return undefined;
  const val: string | undefined = p.image ?? p.image_base64 ?? p.image_resource_url ?? p.image_url ?? p.output;
  if (!val) return undefined;
  const looksLikeBase64 = /^[A-Za-z0-9+/=\n\r]+$/.test(val) && val.length > 200;
  if (looksLikeBase64 && !val.startsWith('data:')) return `data:image/png;base64,${val}`;
  return val;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function edenCall(provider: 'clipdrop'|'photoroom', image: string, apiKey: string, timeoutMs: number) {
  const parsed = dataUrlToBase64(image);
  if (!parsed) {
    throw Object.assign(new Error('Image invalide: data URL requise'), { provider });
  }
  const { mime, b64 } = parsed;
  // Décoder le base64 en binaire et construire un fichier pour multipart/form-data
  const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const ext = (mime?.split('/')?.[1] || 'png').toLowerCase();
  const blob = new Blob([binary], { type: mime || 'image/png' });

  const form = new FormData();
  form.append('providers', provider);
  form.append('file', blob, `image.${ext}`);
  form.append('response_as_dict', 'true');
  form.append('attributes_as_list', 'false');
  form.append('show_original_response', 'false');

  const started = Date.now();
  const res = await fetchWithTimeout('https://api.edenai.run/v2/image/background_removal', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` }, // ne pas définir Content-Type pour laisser le boundary
    body: form,
  }, timeoutMs);
  const durationMs = Date.now() - started;
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw Object.assign(new Error(`EdenAI error ${res.status}: ${txt}`), { status: res.status, provider, durationMs });
  }
  const data = await res.json();
  const out = extractImageFromEden(provider, data);
  if (!out) {
    throw Object.assign(new Error('Réponse EdenAI invalide: image manquante'), { provider, durationMs });
  }
  return { image: out, durationMs };
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3, backoffBaseMs = 250, label = 'retry'): Promise<{ result: T; attempts: number; totalMs: number }>
{
  const t0 = Date.now();
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      const result = await fn();
      return { result, attempts: i, totalMs: Date.now() - t0 };
    } catch (e) {
      lastErr = e;
      console.warn(`[edenai-remove-bg][${label}] tentative ${i}/${attempts} échouée`, e);
      if (i < attempts) await new Promise(r => setTimeout(r, backoffBaseMs * i));
    }
  }
  throw Object.assign(new Error(`Échec après ${attempts} tentatives`), { cause: lastErr });
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, origin);
  }

  // Enforce CORS allowlist
  if (!isOriginAllowed(origin)) {
    return errorResponse('Origin not allowed', 403, origin);
  }

  // Basic rate limiting
  const rl = checkRateLimit(req);
  if (!rl.allowed) {
    const headers = new Headers(corsHeaders(origin));
    headers.set('Retry-After', String(rl.retryAfter));
    headers.set('X-RateLimit-Limit', String(RATE_MAX));
    headers.set('X-RateLimit-Remaining', String(rl.remaining));
    headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)));
    return jsonResponse({ error: 'Too Many Requests' }, { status: 429, headers });
  }

  const functionStarted = Date.now();
  try {
    const apiKey = Deno.env.get('EDENAI_API_KEY');
    if (!apiKey) return errorResponse('Missing EDENAI_API_KEY secret', 500, origin);

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return errorResponse('Content-Type application/json requis', 415, origin);
    }

    const { image } = await req.json();

    if (!image || typeof image !== 'string') {
      return errorResponse("'image' (data URL) est requis", 400, origin);
    }

    // Contraintes: data URL uniquement (sécurité et contrôle de taille)
    const info = getDataUrlInfo(image);
    if (!info.isDataUrl) {
      return errorResponse('Seules les images en data URL (base64) sont acceptées', 400, origin);
    }
    if (!isSupportedImageMime(info.mime)) {
      return errorResponse(`Type d\u2019image non supporté: ${info.mime ?? 'inconnu'}`, 415, origin);
    }
    const MAX_BYTES = 5 * 1024 * 1024; // 5MB
    if ((info.bytes ?? 0) > MAX_BYTES) {
      return errorResponse('Image trop volumineuse (max 5MB)', 413, origin, { maxBytes: MAX_BYTES, bytes: info.bytes });
    }

// Politique providers: d'abord clipdrop, fallback photoroom
const providers: Array<'clipdrop'|'photoroom'> = ['clipdrop', 'photoroom'];

    // Remaining time budget for the whole function
    const remainingMs = () => Math.max(0, GLOBAL_TIMEOUT_MS - (Date.now() - functionStarted));

let finalImage: string | undefined;
let usedProvider: 'clipdrop'|'photoroom' | undefined;
let providerAttempts = 0;
    const metrics: Record<string, unknown> = { attempts: [] };

    for (const provider of providers) {
      const label = `edenai:${provider}`;

      // Ensure we still have time left
      const remBefore = remainingMs();
      if (remBefore < 2000) {
        console.warn('[edenai-remove-bg] Global timeout budget exceeded before calling provider', { provider, remBefore });
        break;
      }

      // Derive a safe per-call timeout from the remaining budget
      const perCallTimeoutMs = Math.max(3000, Math.min(12_000, remBefore - 1000));
      const maxAttempts = perCallTimeoutMs >= 10_000 ? 2 : 1; // keep total under global budget

      try {
        const { result, attempts, totalMs } = await withRetry(
          () => edenCall(provider, image, apiKey, perCallTimeoutMs),
          maxAttempts,
          300,
          label,
        );
        finalImage = result.image;
        usedProvider = provider;
        providerAttempts += attempts;
        (metrics.attempts as any[]).push({ provider, attempts, totalMs, perCallTimeoutMs });
        console.log(`[edenai-remove-bg] SUCCÈS provider=${provider} attempts=${attempts} apiTimeMs=${result.durationMs} totalBlockMs=${totalMs}`);
        break; // succès
      } catch (e: any) {
        providerAttempts += maxAttempts;
        (metrics.attempts as any[]).push({ provider, error: String(e?.message ?? e), perCallTimeoutMs });
        console.warn(`[edenai-remove-bg] ECHEC provider=${provider}`, e);
        // continue to next provider
      }
    }

    if (!finalImage || !usedProvider) {
      const totalMs = Date.now() - functionStarted;
      const headers = corsHeaders(origin);
      if (remainingMs() <= 0) {
        console.error('[edenai-remove-bg] ECHEC global: timeout budget exceeded', { totalMs });
        return jsonResponse({ error: 'Gateway Timeout' }, { status: 504, headers });
      }
      console.error('[edenai-remove-bg] ECHEC global: aucun provider n\'a réussi', { totalMs });
      return jsonResponse({ error: 'Impossible de nettoyer l\'arrière-plan pour le moment', totalMs }, { status: 502, headers });
    }

    const durationMs = Date.now() - functionStarted;
    const body = {
      image: finalImage,
      durationMs,
      provider: usedProvider,
      attempts: providerAttempts,
      metrics,
    };

    console.log('[edenai-remove-bg] FIN OK', { provider: usedProvider, durationMs, attempts: providerAttempts });
    return jsonResponse(body, { status: 200, headers: corsHeaders(origin) });
  } catch (e) {
    const totalMs = Date.now() - functionStarted;
    console.error('[edenai-remove-bg] Exception', e);
    return errorResponse('Erreur interne', 500, origin, { totalMs });
  }
});
