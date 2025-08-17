import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/integrations/supabase/client";

class GeminiService {
  private static instance: GeminiService;
  private apiKey: string | null = null;

  private constructor() {}

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private async getApiKey(): Promise<string> {
    if (this.apiKey) {
      return this.apiKey;
    }

    // Récupération sécurisée via Edge Function avec authentification JWT
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required to access Gemini API');
    }

    const response = await fetch(`https://yrmvcqlyjuhnylmsihrr.supabase.co/functions/v1/get-secrets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: 'GEMINI_API_KEY' })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get API key: ${error.error || response.statusText}`);
    }

    const result = await response.json();
    if (!result.value) {
      throw new Error(`API key not available: ${result.error}`);
    }

    this.apiKey = result.value;
    return this.apiKey;
  }

  async analyzeClothing(imageBlob: Blob) {
    const apiKey = await this.getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
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
  }

  async generateRecommendations(context: any, wardrobe: any[]) {
    const apiKey = await this.getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
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
  }

  // Reset API key (utile pour tests ou changement de session)
  resetApiKey(): void {
    this.apiKey = null;
  }
}

export const geminiService = GeminiService.getInstance();

// Export des fonctions pour compatibilité avec l'existant
export const analyzeClothingWithGemini = (imageBlob: Blob) => 
  geminiService.analyzeClothing(imageBlob);

export const generateGeminiRecommendations = (context: any, wardrobe: any[]) => 
  geminiService.generateRecommendations(context, wardrobe);