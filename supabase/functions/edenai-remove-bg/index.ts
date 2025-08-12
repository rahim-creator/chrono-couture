// Supabase Edge Function: edenai-remove-bg
// Proxifie EdenAI Background Removal avec providers api4ai | remove-bg
// Entrée: { provider: 'api4ai'|'remove-bg', image: string(data URL ou URL http) }
// Sortie: { image: string(data URL ou URL), durationMs: number }
// Déploiement recommandé: --no-verify-jwt (publique depuis le client)

// Deno runtime

function corsHeaders(origin?: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), { ...init, headers });
}

function errorResponse(message: string, status = 400, origin?: string | null) {
  return jsonResponse({ error: message }, { status, headers: corsHeaders(origin) });
}

function extractImageFromEden(provider: string, data: any): string | undefined {
  const p = data?.[provider] ?? data?.items?.find?.((i: any) => i?.provider === provider) ?? data?.result?.[provider];
  if (!p) return undefined;
  // champs possibles: image (data url ou base64), image_resource_url, image_url, output
  const val: string | undefined = p.image ?? p.image_base64 ?? p.image_resource_url ?? p.image_url ?? p.output;
  if (!val) return undefined;
  // Si c'est du base64 sans préfixe, ajouter un mime par défaut PNG
  const looksLikeBase64 = /^[A-Za-z0-9+/=\n\r]+$/.test(val) && val.length > 200; // heuristique
  if (looksLikeBase64 && !val.startsWith('data:')) return `data:image/png;base64,${val}`;
  return val;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, origin);
  }

  try {
    const apiKey = Deno.env.get('EDENAI_API_KEY');
    if (!apiKey) return errorResponse('Missing EDENAI_API_KEY secret', 500, origin);

    const { provider, image } = await req.json();
    if (!provider || (provider !== 'api4ai' && provider !== 'remove-bg')) {
      return errorResponse("'provider' doit être 'api4ai' ou 'remove-bg'", 400, origin);
    }
    if (!image || typeof image !== 'string') {
      return errorResponse("'image' (data URL ou URL) est requis", 400, origin);
    }

    const isHttpUrl = image.startsWith('http://') || image.startsWith('https://');
    const body: Record<string, unknown> = {
      providers: provider,
      response_as_dict: true,
      attributes_as_list: false,
      show_original_response: false,
      fallback_providers: '',
    };
    if (isHttpUrl) body.file_url = image;
    else body.file = image; // data URL accepté par EdenAI dans la plupart des cas

    const started = Date.now();
    const edenRes = await fetch('https://api.edenai.run/v2/image/background_removal', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const durationMs = Date.now() - started;
    if (!edenRes.ok) {
      const txt = await edenRes.text().catch(() => '');
      console.error('[edenai-remove-bg] EdenAI error', edenRes.status, txt);
      return errorResponse(`EdenAI error ${edenRes.status}: ${txt}`, edenRes.status, origin);
    }

    const data = await edenRes.json();
    const out = extractImageFromEden(provider, data);
    if (!out) {
      console.error('[edenai-remove-bg] Réponse EdenAI sans image exploitable', data);
      return errorResponse('Réponse EdenAI invalide: image manquante', 502, origin);
    }

    console.log('[edenai-remove-bg] provider:', provider, 'durationMs:', durationMs);
    return jsonResponse({ image: out, durationMs }, { status: 200, headers: corsHeaders(origin) });
  } catch (e) {
    console.error('[edenai-remove-bg] Exception', e);
    return errorResponse('Erreur interne', 500, origin);
  }
});
