import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/integrations/supabase/client";

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

export const analyzeClothingWithGemini = async (imageBlob: Blob) => {
  try {
    const client = await getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Analysez ce vêtement et retournez un JSON avec:
- categorySuggestion: "haut" | "bas" | "chaussures"
- materialSuggestion: "coton" | "laine" | "polyester" | "lin" | "soie" | "cachemire" | "denim" | "cuir"
- seasonSuggestion: "ete" | "hiver" | "mi-saison" | "toutes"
- patternSuggestion: "uni" | "rayé" | "imprimé" | "à pois" | "carreaux" | "floral"
- fitSuggestion: "slim" | "regular" | "loose" | "oversized"
- conditionSuggestion: "neuf" | "bon" | "usé"
- brandSuggestion: string (si reconnaissable)
- tags: string[] (descriptifs du vêtement)
- palette: string[] (couleurs hexadécimales dominantes)`;
    
    const imageData = await imageBlob.arrayBuffer();
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: Buffer.from(imageData).toString('base64'), mimeType: imageBlob.type } }
    ]);
    
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Erreur Gemini:', error);
    throw error;
  }
};