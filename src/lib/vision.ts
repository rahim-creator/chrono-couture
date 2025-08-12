import { pipeline, env } from "@huggingface/transformers";

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

export type ClassificationLabel = { label: string; score: number };

export type VisionInsights = {
  labels: ClassificationLabel[];
  categorySuggestion: "haut" | "bas" | "chaussures" | null;
  tags: string[];
  palette: string[]; // hex colors
  dominant: string | null;
  pattern: "uni" | "motif" | "texture";
  seasonSuggestion: "toutes" | "ete" | "hiver" | "mi-saison" | null;
};

function imageToDataURL(img: HTMLImageElement, target = 256) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const { naturalWidth: w, naturalHeight: h } = img;
  const scale = Math.min(1, target / Math.max(w, h));
  canvas.width = Math.max(1, Math.floor(w * scale));
  canvas.height = Math.max(1, Math.floor(h * scale));
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

// Map classifier labels to our categories heuristically
const CATEGORY_KEYWORDS: Record<"haut" | "bas" | "chaussures", string[]> = {
  haut: ["shirt", "t-shirt", "blouse", "sweater", "hoodie", "coat", "jacket", "top", "cardigan"],
  bas: ["jeans", "pants", "trousers", "skirt", "shorts", "legging"],
  chaussures: ["shoe", "sneaker", "boot", "loafer", "heel", "sandal", "trainer"],
};

function pickCategory(labels: ClassificationLabel[]): VisionInsights["categorySuggestion"] {
  const text = labels.map((l) => l.label.toLowerCase()).join(", ");
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS) as [
    keyof typeof CATEGORY_KEYWORDS,
    string[]
  ][]) {
    if (kws.some((k) => text.includes(k))) return cat;
  }
  return null;
}

// Simple color quantization via 12-bit RGB bucketing
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

function suggestSeasonFromColor(hex: string): VisionInsights["seasonSuggestion"] {
  const { h, l } = hexToHsl(hex);
  if (l < 0.2) return "hiver"; // very dark
  if (h >= 200 && h <= 260) return "hiver"; // blues/purples
  if ((h >= 330 && h <= 360) || (h >= 0 && h < 40)) return "ete"; // reds/oranges
  if (h >= 40 && h < 80) return "ete"; // yellows
  if (h >= 80 && h < 170) return "mi-saison"; // greens
  if (h >= 170 && h < 200) return "mi-saison"; // teals
  if (h >= 260 && h < 330) return "mi-saison"; // pinks/magentas
  return "toutes";
}

export async function extractPaletteFromImage(img: HTMLImageElement, maxSize = 128): Promise<{ palette: string[]; dominant: string | null }>{
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { palette: [], dominant: null };
  const { naturalWidth: w, naturalHeight: h } = img;
  const scale = Math.min(1, maxSize / Math.max(w, h));
  canvas.width = Math.max(1, Math.floor(w * scale));
  canvas.height = Math.max(1, Math.floor(h * scale));
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const buckets = new Map<number, number>();
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue; // skip transparent
    const r = data[i] >> 4; // 4-bit
    const g = data[i + 1] >> 4;
    const b = data[i + 2] >> 4;
    const key = (r << 8) | (g << 4) | b; // 12-bit key
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const sorted = Array.from(buckets.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const palette = sorted.map(([key]) => {
    const r = ((key >> 8) & 0xf) * 17; // map 0-15 -> 0-255
    const g = ((key >> 4) & 0xf) * 17;
    const b = (key & 0xf) * 17;
    return rgbToHex(r, g, b);
  });

  return { palette, dominant: palette[0] ?? null };
}

export async function detectPattern(img: HTMLImageElement): Promise<VisionInsights["pattern"]> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "uni";
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(img, 0, 0, size, size);
  const { data, width } = ctx.getImageData(0, 0, size, size);
  let diffSum = 0;
  let count = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size - 1; x++) {
      const idx = (y * width + x) * 4;
      const idx2 = (y * width + (x + 1)) * 4;
      const dr = Math.abs(data[idx] - data[idx2]);
      const dg = Math.abs(data[idx + 1] - data[idx2 + 1]);
      const db = Math.abs(data[idx + 2] - data[idx2 + 2]);
      diffSum += (dr + dg + db) / 3;
      count++;
    }
  }
  const avgDiff = diffSum / count; // 0-255
  if (avgDiff > 20) return "motif"; // high detail
  if (avgDiff > 10) return "texture";
  return "uni";
}

let classifierPromise: Promise<any> | null = null;
async function getClassifier() {
  if (!classifierPromise) {
    classifierPromise = pipeline(
      "image-classification",
      "onnx-community/mobilenetv4_conv_small.e2400_r224_in1k",
      { device: "auto" }
    );
  }
  return classifierPromise;
}

export async function classifyImage(input: HTMLImageElement | string) : Promise<ClassificationLabel[]> {
  const classifier = await getClassifier();
  const prepared = typeof input === 'string' ? input : (imageToDataURL(input) || input);
  const result: ClassificationLabel[] = await classifier(prepared, { topk: 5 });
  // Normalize labels
  return result.map((r) => ({ label: r.label.toLowerCase(), score: r.score }))
}

export async function analyzeImage(img: HTMLImageElement): Promise<VisionInsights> {
  const [labels, { palette, dominant }, pattern] = await Promise.all([
    classifyImage(img),
    extractPaletteFromImage(img),
    detectPattern(img),
  ]);

  const categorySuggestion = pickCategory(labels);
  const tags = labels.map((l) => l.label);
  const seasonSuggestion = dominant ? suggestSeasonFromColor(dominant) : null;

  return {
    labels,
    categorySuggestion,
    tags,
    palette,
    dominant: dominant ?? null,
    pattern,
    seasonSuggestion,
  };
}
