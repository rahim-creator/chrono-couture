import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const SECRET_NAMES = ['GEMINI_API_KEY', 'OPENAI_API_KEY'] as const;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { secret_name } = await req.json()
    
    // Validate secret name
    if (!SECRET_NAMES.includes(secret_name)) {
      return new Response(
        JSON.stringify({ error: 'Secret non autorisé' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const secretValue = Deno.env.get(secret_name)
    
    if (!secretValue) {
      return new Response(
        JSON.stringify({ error: 'Secret non configuré' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ value: secretValue }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})