// EdenAI remove background client helpers
// This expects a Supabase Edge Function named "edenai-remove-bg" that uses the EDENAI_API_KEY secret.
// The function should accept: { provider: 'api4ai'|'remove-bg', image: string(base64 data url) }
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

async function callEdgeRemoveBG(provider: 'api4ai' | 'remove-bg', image: Blob, signal?: AbortSignal) {
  const body = {
    provider,
    image: await blobToDataURL(image),
  };
  const started = performance.now();
  // Using Supabase client to invoke the Edge Function (handles full URL & headers)
  const { data, error } = await supabase.functions.invoke('edenai-remove-bg', {
    body,
    // signal is not currently supported by supabase-js for functions; kept for API parity
  } as any);

  if (error) {
    throw new Error(`Edge function error: ${error.message || 'unknown'}`);
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

export async function removeBackgroundPreferred(image: Blob, signal?: AbortSignal): Promise<{ blob: Blob; durationMs: number; provider: 'api4ai'|'remove-bg' }> {
  const t0 = performance.now();
  try {
    const res = await retry(() => callEdgeRemoveBG('api4ai', image, signal), 3, 'api4ai');
    const total = performance.now() - t0;
    console.info('[BG] api4ai OK', { provider: 'api4ai', apiTime: res.durationMs, totalMs: Math.round(total) });
    return { ...res, provider: 'api4ai' };
  } catch (e) {
    console.warn('[BG] api4ai a échoué, fallback remove-bg', e);
    const res = await retry(() => callEdgeRemoveBG('remove-bg', image, signal), 3, 'remove-bg');
    const total = performance.now() - t0;
    console.info('[BG] remove-bg OK', { provider: 'remove-bg', apiTime: res.durationMs, totalMs: Math.round(total) });
    return { ...res, provider: 'remove-bg' };
  }
}
