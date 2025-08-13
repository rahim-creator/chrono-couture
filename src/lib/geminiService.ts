import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY!);

export const analyzeClothingWithGemini = async (imageBlob: Blob) => {
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
};