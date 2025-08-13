import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/integrations/supabase/client";
import type { EnhancedWardrobeItem, EnhancedLook } from "@/types/enhanced-wardrobe";

type Context = { city?: string; temp?: number | null; mood?: string; event?: string; date?: string };

let genAI: GoogleGenerativeAI | null = null;

const getGeminiClient = async () => {
  if (!genAI) {
    try {
      const { data } = await supabase.functions.invoke('get-secrets', {
        body: { secret_name: 'GEMINI_API_KEY' }
      });
      
      if (!data?.value) {
        throw new Error('Clé API Gemini non configurée');
      }
      
      genAI = new GoogleGenerativeAI(data.value);
    } catch (error) {
      console.error('Erreur initialisation Gemini:', error);
      throw error;
    }
  }
  return genAI;
};

export const generateGeminiRecommendations = async (
  context: Context,
  wardrobe: EnhancedWardrobeItem[]
): Promise<EnhancedLook[]> => {
  try {
    const client = await getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `Contexte: ${JSON.stringify(context)}
Garde-robe: ${JSON.stringify(wardrobe)}

Créez 3 looks cohérents en tenant compte de la météo, l'événement et les préférences.
Retournez un JSON avec un tableau de looks, chaque look ayant:
- id: string
- items: array d'IDs des vêtements sélectionnés
- note: string explicative du choix stylistique
- compatibilityScore: number (0-100) de cohérence des pièces
- weatherScore: number (0-100) d'adaptation à la météo
- styleScore: number (0-100) de pertinence stylistique`;
    
    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.response.text());
    
    return response.map((look: any) => ({
      ...look,
      items: look.items.map((id: string) => wardrobe.find(item => item.id === id)).filter(Boolean)
    }));
  } catch (error) {
    console.error('Erreur recommandations Gemini:', error);
    throw error;
  }
};