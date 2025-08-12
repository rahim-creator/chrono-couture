# Supabase Edge Function: edenai-remove-bg

Proxy sécurisé vers EdenAI pour la suppression d’arrière-plan.

- Entrée: `POST` JSON `{ provider: 'api4ai' | 'remove-bg', image: string }`
  - `image`: data URL (base64) ou URL publique
- Sortie: `{ image: string(data URL ou URL), durationMs: number }`
- Auth: déployer en « no-verify-jwt » (publique) pour permettre l’appel direct depuis le navigateur

## Déploiement (via interface Supabase dans Lovable)
1) Ouvrez le panneau Supabase (bouton vert en haut à droite) → Secrets → Add secret
   - Key: `EDENAI_API_KEY`
   - Value: votre clé EdenAI
2) Edge Functions → New Function (ou Import depuis repo si disponible)
   - Name: `edenai-remove-bg`
   - Collez le contenu de `supabase/functions/edenai-remove-bg/index.ts`
   - Désactivez « Verify JWT » (no-verify-jwt)
   - Deploy

## Déploiement (CLI alternatif)
```bash
supabase secrets set EDENAI_API_KEY=xxxxxxxxxxxxxxxx
supabase functions deploy edenai-remove-bg --no-verify-jwt
```

## Test rapide (curl)
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "api4ai",
    "image": "data:image/png;base64,......"
  }' \
  https://<YOUR-PROJECT-REF>.functions.supabase.co/edenai-remove-bg
```

## Notes
- Aucune table de base de données n’est requise pour cette fonction.
- Les logs (durée, provider) sont visibles dans les logs d’Edge Functions.
- Le front appelle l’URL `/functions/v1/edenai-remove-bg` automatiquement via `removeBgProviders.ts`.
