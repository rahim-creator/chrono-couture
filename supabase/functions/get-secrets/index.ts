import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Simple rate limiting in memory (pour demo - en prod utiliser Redis/DB)
const rateLimiter = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 5 // 5 requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérification de l'authentification JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - JWT token required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Rate limiting par IP
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    const userLimit = rateLimiter.get(clientIP)

    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= RATE_LIMIT) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
            {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        userLimit.count++
      } else {
        rateLimiter.set(clientIP, { count: 1, resetTime: now + RATE_WINDOW })
      }
    } else {
      rateLimiter.set(clientIP, { count: 1, resetTime: now + RATE_WINDOW })
    }

    // Parse request body
    const { key } = await req.json()

    // Seules les clés autorisées (Gemini uniquement)
    const allowedKeys = ['GEMINI_API_KEY']

    if (!allowedKeys.includes(key)) {
      return new Response(
        JSON.stringify({ error: `Key "${key}" not allowed. Allowed: ${allowedKeys.join(', ')}` }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Récupérer la valeur depuis les variables d'environnement
    const value = Deno.env.get(key)

    if (!value) {
      return new Response(
        JSON.stringify({ error: `Environment variable "${key}" not found` }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log pour monitoring (sans exposer la clé)
    console.log(`API key requested: ${key} for IP: ${clientIP}`)

    return new Response(
      JSON.stringify({
        value,
        key,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in get-secrets function:', error)

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})