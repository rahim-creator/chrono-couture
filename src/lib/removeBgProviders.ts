// EdenAI remove background client helpers
// This expects a Supabase Edge Function named "edenai-remove-bg" that uses the EDENAI_API_KEY secret.
// The function should accept: { provider: 'clipdrop'|'photoroom', image: string(base64 data url) }
// And return: { image: string(data url PNG), durationMs: number }

import { supabase } from "@/integrations/supabase/client";

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function callEdgeRemoveBG(provider: 'clipdrop' | 'photoroom', image: Blob, signal?: AbortSignal) {
  const body = {
    provider,
    image: await blobToDataURL(image),
  };
  const started = performance.now();

  // Optional auth: if a session exists, it will be sent automatically by supabase-js
  // This function is public (verify_jwt = false) and restricted by CORS + rate limiting server-side.
  // So we do not require an authenticated session to proceed.

  // Using Supabase client to invoke the Edge Function (handles full URL & headers)
  const { data, error } = await supabase.functions.invoke('edenai-remove-bg', {
    body,
  } as any);

  if (error) {
    const status = (error as any)?.context?.response?.status ?? (error as any)?.status ?? (error as any)?.context?.status;
    const err: any = new Error(
      typeof status === 'number'
        ? `EDGE_${status}: ${error.message || 'Erreur edge'}`
        : `EDGE_ERROR: ${error.message || 'Erreur edge'}`
    );
    err.status = status;
    throw err;
  }
  const { image: dataUrl, durationMs } = (data as any) || {};
  if (!dataUrl) throw new Error('Invalid response from edge function');

  // Convert data URL to Blob
  const r = await fetch(dataUrl);
  const blob = await r.blob();
  const elapsed = performance.now() - started;
  return { blob, durationMs: typeof durationMs === 'number' ? durationMs : elapsed };
}

async function retry<T>(fn: () => Promise<T>, attempts = 3, label = 'retry'): Promise<T> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      console.warn(`[${label}] tentative ${i}/${attempts} échouée`, e);
      if (i < attempts) await new Promise((r) => setTimeout(r, 300 * i));
    }
  }
  throw (lastErr instanceof Error ? lastErr : new Error('Échec après retries'));
}

export async function removeBackgroundPreferred(image: Blob, signal?: AbortSignal): Promise<{ blob: Blob; durationMs: number; provider: 'clipdrop'|'photoroom' }> {
  const t0 = performance.now();
  try {
    const res = await retry(() => callEdgeRemoveBG('clipdrop', image, signal), 3, 'clipdrop');
    const total = performance.now() - t0;
    console.info('[BG] clipdrop OK', { provider: 'clipdrop', apiTime: res.durationMs, totalMs: Math.round(total) });
    return { ...res, provider: 'clipdrop' };
  } catch (e) {
    console.warn('[BG] clipdrop a échoué, fallback photoroom', e);
    const res = await retry(() => callEdgeRemoveBG('photoroom', image, signal), 3, 'photoroom');
    const total = performance.now() - t0;
    console.info('[BG] photoroom OK', { provider: 'photoroom', apiTime: res.durationMs, totalMs: Math.round(total) });
    return { ...res, provider: 'photoroom' };
  }
}
