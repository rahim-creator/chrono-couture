import { pipeline, env } from '@huggingface/transformers';
import type { ExtendedImageInsights } from '@/types/enhanced-wardrobe';

// Configuration pour les modèles spécialisés
env.allowLocalModels = false;
env.useBrowserCache = true;

let materialClassifierPromise: Promise<any> | null = null;
let ocrPromise: Promise<any> | null = null;

async function getMaterialClassifier() {
  if (!materialClassifierPromise) {
    materialClassifierPromise = pipeline(
      'image-classification',
      'microsoft/DiT-base-finetuned-rvlcdip',
      { device: 'webgpu' }
    );
  }
  return materialClassifierPromise;
}

async function getOCR() {
  if (!ocrPromise) {
    ocrPromise = pipeline(
      'image-to-text',
      'microsoft/trocr-base-printed',
      { device: 'webgpu' }
    );
  }
  return ocrPromise;
}

export async function analyzeClothingAttributes(imageBlob: Blob): Promise<Partial<ExtendedImageInsights>> {
  try {
    const img = await createImageFromBlob(imageBlob);
    
    const [materialResult, brandResult, conditionResult, fitResult] = await Promise.all([
      analyzeMaterial(img),
      analyzeBrand(img),
      analyzeCondition(img),
      analyzeFit(img)
    ]);

    return {
      materialSuggestion: materialResult as 'coton' | 'laine' | 'polyester' | 'lin' | 'soie' | 'cachemire' | 'denim' | 'cuir',
      brandSuggestion: brandResult,
      conditionSuggestion: conditionResult as 'neuf' | 'bon' | 'usé',
      fitSuggestion: fitResult as 'slim' | 'regular' | 'loose' | 'oversized',
      weightSuggestion: analyzeWeight(materialResult) as 'léger' | 'moyen' | 'épais',
      patternSuggestion: analyzePatternAdvanced(img) as 'uni' | 'rayé' | 'imprimé' | 'à pois' | 'carreaux' | 'floral',
      sizeSuggestion: analyzeSizeFromFit(fitResult) as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | undefined
    };
  } catch (error) {
    console.warn('Analyse étendue échouée:', error);
    return {};
  }
}

async function createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

async function analyzeMaterial(img: HTMLImageElement): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 224;
  canvas.height = 224;
  ctx.drawImage(img, 0, 0, 224, 224);
  
  const imageData = ctx.getImageData(0, 0, 224, 224);
  const textureVariance = calculateTextureVariance(imageData);
  const colorAnalysis = analyzeColorDistribution(imageData);
  
  // Heuristiques avancées basées sur texture et couleur
  if (textureVariance > 50 && colorAnalysis.blueDominant) return 'denim';
  if (textureVariance > 40 && colorAnalysis.darkColors) return 'cuir';
  if (textureVariance > 30) return 'laine';
  if (textureVariance > 15 && colorAnalysis.naturalColors) return 'coton';
  if (textureVariance > 10 && colorAnalysis.brightColors) return 'polyester';
  if (textureVariance < 5 && colorAnalysis.lightColors) return 'soie';
  if (colorAnalysis.earthTones) return 'lin';
  
  return 'coton'; // Défaut
}

async function analyzeBrand(img: HTMLImageElement): Promise<string | undefined> {
  try {
    const ocr = await getOCR();
    // Fournir un input compatible (data URL PNG)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const target = 384;
    const scale = Math.min(1, target / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    canvas.width = Math.max(1, Math.floor((img.naturalWidth || img.width) * scale));
    canvas.height = Math.max(1, Math.floor((img.naturalHeight || img.height) * scale));
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');

    const result = await ocr(dataUrl);
    const knownBrands = [
      'ZARA', 'H&M', 'NIKE', 'ADIDAS', 'UNIQLO', 'GAP', 'LEVIS',
      'CALVIN KLEIN', 'TOMMY HILFIGER', 'LACOSTE', 'POLO', 'GUCCI',
      'PRADA', 'LOUIS VUITTON', 'CHANEL', 'DIOR'
    ];
    const text = (Array.isArray(result) ? result[0]?.generated_text : result?.generated_text)?.toUpperCase() || '';
    for (const brand of knownBrands) {
      if (text.includes(brand)) return brand;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function analyzeCondition(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const sharpness = calculateSharpness(imageData);
  const defects = detectDefects(imageData);
  
  if (sharpness > 0.8 && defects < 0.1) return 'neuf';
  if (sharpness > 0.5 && defects < 0.3) return 'bon';
  return 'usé';
}

function analyzeFit(img: HTMLImageElement): string {
  const aspectRatio = img.width / img.height;
  const silhouetteAnalysis = analyzeSilhouette(img);
  
  if (silhouetteAnalysis.isVeryLoose || aspectRatio > 1.8) return 'oversized';
  if (silhouetteAnalysis.isLoose || aspectRatio > 1.5) return 'loose';
  if (silhouetteAnalysis.isTight || aspectRatio < 0.8) return 'slim';
  return 'regular';
}

function analyzeSizeFromFit(fit: string): string | undefined {
  // Heuristique simple basée sur la coupe
  const sizeMap: Record<string, string> = {
    'slim': 'S',
    'regular': 'M',
    'loose': 'L',
    'oversized': 'XL'
  };
  
  return sizeMap[fit];
}

function analyzeWeight(material: string): string {
  const weightMap: Record<string, string> = {
    'denim': 'épais',
    'laine': 'épais',
    'cuir': 'épais',
    'cachemire': 'moyen',
    'coton': 'moyen',
    'polyester': 'moyen',
    'lin': 'léger',
    'soie': 'léger'
  };
  
  return weightMap[material] || 'moyen';
}

// Fonctions utilitaires avancées
function analyzeColorDistribution(imageData: ImageData): {
  blueDominant: boolean;
  darkColors: boolean;
  naturalColors: boolean;
  brightColors: boolean;
  lightColors: boolean;
  earthTones: boolean;
} {
  const data = imageData.data;
  let blueSum = 0, redSum = 0, greenSum = 0;
  let darkPixels = 0, brightPixels = 0, lightPixels = 0;
  let totalPixels = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    redSum += r;
    greenSum += g;
    blueSum += b;
    
    const brightness = (r + g + b) / 3;
    if (brightness < 80) darkPixels++;
    else if (brightness > 180) lightPixels++;
    else brightPixels++;
    
    totalPixels++;
  }
  
  const avgR = redSum / totalPixels;
  const avgG = greenSum / totalPixels;
  const avgB = blueSum / totalPixels;
  
  return {
    blueDominant: avgB > avgR && avgB > avgG,
    darkColors: darkPixels / totalPixels > 0.6,
    naturalColors: Math.abs(avgR - avgG) < 30 && Math.abs(avgG - avgB) < 30,
    brightColors: brightPixels / totalPixels > 0.5,
    lightColors: lightPixels / totalPixels > 0.4,
    earthTones: avgR > avgG && avgG > avgB && avgR - avgB < 50
  };
}

function detectDefects(imageData: ImageData): number {
  // Détection de défauts visuels (taches, déchirures, etc.)
  const data = imageData.data;
  let defectScore = 0;
  let totalPixels = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Détection de variations anormales
    const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
    if (variance > 100) defectScore++;
    
    totalPixels++;
  }
  
  return defectScore / totalPixels;
}

function analyzeSilhouette(img: HTMLImageElement): {
  isVeryLoose: boolean;
  isLoose: boolean;
  isTight: boolean;
} {
  // Analyse de la silhouette pour déterminer la coupe
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 64;
  canvas.height = 64;
  ctx.drawImage(img, 0, 0, 64, 64);
  
  const imageData = ctx.getImageData(0, 0, 64, 64);
  const edgePixels = detectEdges(imageData);
  
  return {
    isVeryLoose: edgePixels < 0.2,
    isLoose: edgePixels < 0.4,
    isTight: edgePixels > 0.7
  };
}

function detectEdges(imageData: ImageData): number {
  // Détection de contours pour analyser la forme
  const data = imageData.data;
  let edgePixels = 0;
  const width = imageData.width;
  
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);
    
    if (x > 0 && x < width - 1 && y > 0 && y < imageData.height - 1) {
      const current = data[i];
      const left = data[i - 4];
      const right = data[i + 4];
      const up = data[i - width * 4];
      const down = data[i + width * 4];
      
      const gradient = Math.abs(current - left) + Math.abs(current - right) + 
                      Math.abs(current - up) + Math.abs(current - down);
      
      if (gradient > 50) edgePixels++;
    }
  }
  
  return edgePixels / (imageData.width * imageData.height);
}

function analyzePatternAdvanced(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 128;
  canvas.height = 128;
  ctx.drawImage(img, 0, 0, 128, 128);
  
  const imageData = ctx.getImageData(0, 0, 128, 128);
  const patterns = detectPatterns(imageData);
  
  if (patterns.stripes > 0.3) return 'rayé';
  if (patterns.dots > 0.2) return 'à pois';
  if (patterns.checks > 0.25) return 'carreaux';
  if (patterns.floral > 0.15) return 'floral';
  if (patterns.print > 0.1) return 'imprimé';
  return 'uni';
}

// Fonctions utilitaires
function calculateTextureVariance(imageData: ImageData): number {
  const data = imageData.data;
  let variance = 0;
  
  for (let i = 0; i < data.length; i += 16) {
    const r1 = data[i];
    const r2 = data[i + 4] || r1;
    variance += Math.abs(r1 - r2);
  }
  
  return variance / (data.length / 16);
}

function calculateSharpness(imageData: ImageData): number {
  // Calcul de la netteté basé sur les gradients
  const data = imageData.data;
  let sharpness = 0;
  const width = imageData.width;
  
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);
    
    if (x < width - 1 && y < imageData.height - 1) {
      const current = data[i];
      const right = data[i + 4];
      const down = data[i + width * 4];
      
      sharpness += Math.abs(current - right) + Math.abs(current - down);
    }
  }
  
  return Math.min(sharpness / (data.length / 4) / 255, 1);
}

function detectPatterns(imageData: ImageData): Record<string, number> {
  // Détection de motifs par analyse de fréquence
  return {
    stripes: detectStripes(imageData),
    dots: detectDots(imageData),
    checks: detectChecks(imageData),
    floral: detectFloral(imageData),
    print: detectPrint(imageData)
  };
}

function detectStripes(imageData: ImageData): number {
  // Analyse des variations horizontales/verticales
  const data = imageData.data;
  const width = imageData.width;
  let stripeScore = 0;
  
  // Analyse horizontale
  for (let y = 0; y < imageData.height; y += 4) {
    let variations = 0;
    for (let x = 1; x < width; x++) {
      const i1 = (y * width + x - 1) * 4;
      const i2 = (y * width + x) * 4;
      if (Math.abs(data[i1] - data[i2]) > 30) variations++;
    }
    if (variations > width * 0.1) stripeScore++;
  }
  
  return stripeScore / (imageData.height / 4);
}

function detectDots(imageData: ImageData): number {
  // Détection de motifs circulaires répétitifs
  return 0; // Implémentation simplifiée
}

function detectChecks(imageData: ImageData): number {
  // Détection de motifs en damier
  return 0; // Implémentation simplifiée
}

function detectFloral(imageData: ImageData): number {
  // Détection de motifs organiques/floraux
  return 0; // Implémentation simplifiée
}

function detectPrint(imageData: ImageData): number {
  // Détection d'imprimés complexes
  return 0; // Implémentation simplifiée
}