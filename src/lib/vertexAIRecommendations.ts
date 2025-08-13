import { VertexAI } from "@google-cloud/vertexai";
import type { EnhancedWardrobeItem } from "@/types/enhanced-wardrobe";
import { supabase } from "@/integrations/supabase/client";

type Context = { city?: string; temp?: number | null; mood?: string; event?: string; date?: string };

export const generateVertexAIRecommendations = async (
  context: Context, 
  wardrobe: EnhancedWardrobeItem[]
) => {
  // Récupération sécurisée des configurations via Supabase
  const { data: configData } = await supabase.functions.invoke('get-secrets', {
    body: { secret_name: 'VERTEX_AI_CONFIG' }
  });
  
  if (!configData?.value) {
    throw new Error('Configuration Vertex AI non trouvée');
  }
  
  const config = JSON.parse(configData.value);
  
  const vertex_ai = new VertexAI({
    project: config.projectId,
    location: config.location || 'us-central1',
    googleAuthOptions: {
      credentials: config.serviceAccountKey
    }
  });

  const model = vertex_ai.preview.getGenerativeModel({
    model: "gemini-1.5-flash",
  });
  
  const prompt = `Contexte: ${JSON.stringify(context)}
  Garde-robe: ${JSON.stringify(wardrobe)}
  
  Créez 3 looks cohérents en tenant compte de la météo, l'événement et les préférences.
  Retournez un JSON avec un tableau de looks, chaque look ayant:
  - id: string
  - items: array d'IDs des vêtements sélectionnés
  - note: string explicative du choix stylistique`;

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }]
  });
  
  return JSON.parse(result.response.candidates[0].content.parts[0].text);
};