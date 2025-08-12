// EdenAI utility wrapper for background removal
// Uses the Supabase Edge Function via lib/removeBgProviders

import { removeBackgroundPreferred } from '@/lib/removeBgProviders';

export type EdenProvider = 'clipdrop' | 'photoroom';

/**
 * Remove background using EdenAI (clipdrop → photoroom fallback).
 * Returns the resulting PNG blob and metadata.
 */
export async function removeBackground(file: Blob, signal?: AbortSignal) {
  return removeBackgroundPreferred(file, signal);
}
