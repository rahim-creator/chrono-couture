export type CompressionResult = {
  blob: Blob;
  originalSize: number; // bytes
  compressedSize: number; // bytes
  format: 'image/webp' | 'image/jpeg';
  resized: boolean;
};

const MAX_DIMENSION_DEFAULT = 1920;
const MAX_BYTES_DEFAULT = 2_000_000; // 2MB

function canUseWebP(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const data = canvas.toDataURL('image/webp');
    return data.startsWith('data:image/webp');
  } catch {
    return false;
  }
}

function drawResized(image: HTMLImageElement, maxDimension: number) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context non disponible');

  const { naturalWidth: w, naturalHeight: h } = image;
  const scale = Math.min(1, maxDimension / Math.max(w, h));
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Échec de génération du blob'))),
      type,
      quality
    );
  });
}

export async function compressImageFile(
  file: File,
  { maxDimension = MAX_DIMENSION_DEFAULT, maxBytes = MAX_BYTES_DEFAULT }: { maxDimension?: number; maxBytes?: number } = {}
): Promise<CompressionResult> {
  // Charger l'image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = URL.createObjectURL(file);
  });

  // Redimensionner si nécessaire
  const needsResize = Math.max(img.naturalWidth, img.naturalHeight) > maxDimension;
  const canvas = drawResized(img, maxDimension);

  // Essayer WebP si supporté
  const webpSupported = canUseWebP();
  const tryTypes = webpSupported ? (['image/webp', 'image/jpeg'] as const) : (['image/jpeg'] as const);

  let best: { blob: Blob; type: 'image/webp' | 'image/jpeg' } | null = null;

  for (const type of tryTypes) {
    // Décrémenter la qualité jusqu'à passer sous la limite
    for (let q = 0.9; q >= 0.5; q -= 0.1) {
      // eslint-disable-next-line no-await-in-loop
      const blob = await canvasToBlob(canvas, type, Number(q.toFixed(2)));
      if (!best || blob.size < best.blob.size) best = { blob, type };
      if (blob.size <= maxBytes) {
        return {
          blob,
          originalSize: file.size,
          compressedSize: blob.size,
          format: type,
          resized: needsResize,
        };
      }
    }
  }

  if (best) {
    // Retourner le meilleur effort (même si > 2MB)
    return {
      blob: best.blob,
      originalSize: file.size,
      compressedSize: best.blob.size,
      format: best.type,
      resized: needsResize,
    };
  }

  throw new Error("Impossible de compresser l'image");
}
