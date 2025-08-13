import { VertexAI } from "@google-cloud/vertexai";
import { supabase } from "@/integrations/supabase/client";

export const analyzeClothingWithVertexAI = async (imageBlob: Blob) => {
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
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { 
          inlineData: { 
            data: Buffer.from(imageData).toString('base64'), 
            mimeType: imageBlob.type 
          } 
        }
      ]
    }]
  });
  
  return JSON.parse(result.response.candidates[0].content.parts[0].text);
};