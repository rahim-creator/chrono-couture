import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EnhancedWardrobeItem } from "@/types/enhanced-wardrobe";
import { supabase } from "@/integrations/supabase/client";

type Context = { city?: string; temp?: number | null; mood?: string; event?: string; date?: string };

export const generateGeminiRecommendations = async (
  context: Context, 
  wardrobe: EnhancedWardrobeItem[]
) => {
  // Récupération sécurisée de la clé API via Supabase
  const { data } = await supabase.functions.invoke('get-secrets', {
    body: { secret_name: 'GEMINI_API_KEY' }
  });
  
  if (!data?.value) {
    throw new Error('Clé API Gemini non configurée');
  }
  
  const genAI = new GoogleGenerativeAI(data.value);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `Contexte: ${JSON.stringify(context)}
  Garde-robe: ${JSON.stringify(wardrobe)}
  
  Créez 3 looks cohérents en tenant compte de la météo, l'événement et les préférences.
  Retournez un JSON avec un tableau de looks, chaque look ayant:
  - id: string
  - items: array d'IDs des vêtements sélectionnés
  - note: string explicative du choix stylistique`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};