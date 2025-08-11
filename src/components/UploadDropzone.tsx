import React, { useCallback, useMemo, useRef, useState } from 'react';

import { Progress } from '@/components/ui/progress';
import { loadImage, removeBackground } from '@/lib/background';
import { compressImageFile } from '@/lib/imageCompression';
import { removeBackgroundPreferred } from '@/lib/removeBgProviders';
import { Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export type ProcessingStep = 'upload' | 'analyse' | 'suppression' | 'finalisation';

export type UploadResult = {
  id: string;
  file: File;
  originalUrl: string;
  processedUrl?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number; // 0-100
  step?: ProcessingStep;
  etaMs?: number;
  sizeInfo?: { originalKB: number; compressedKB: number; format: string; resized: boolean };
  error?: string;
};

type UploadDropzoneProps = {
  autoRemoveBackground?: boolean;
  onChange?: (items: UploadResult[]) => void;
};

const ACCEPTED_TYPES = ['image/*'];

export default function UploadDropzone({ autoRemoveBackground = true, onChange }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadResult[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const abortMapRef = useRef<Map<string, boolean>>(new Map());

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const filesArr = Array.from(files);
    const isImage = (f: File) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name);
    const accepted = filesArr.filter(isImage);
    const rejected = filesArr.filter((f) => !isImage(f));
    if (rejected.length) {
      toast.error(`Format non supporté: ${rejected.slice(0, 3).map((f) => f.name).join(", ")}${rejected.length > 3 ? "…" : ""}`);
    }
    if (!accepted.length) return;

      const newItems: UploadResult[] = accepted.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        originalUrl: URL.createObjectURL(file),
        status: autoRemoveBackground ? ('processing' as const) : ('pending' as const),
        processedUrl: undefined,
        progress: autoRemoveBackground ? 5 : 0,
        step: autoRemoveBackground ? 'upload' : undefined,
      }));

    setItems((prev) => {
      const merged = [...prev, ...newItems];
      onChange?.(merged);
      return merged;
    });

    if (autoRemoveBackground) {
      // Process sequentially to avoid heavy parallel GPU load
      for (const item of newItems) {
        await processItem(item.id);
      }
    }
  }, [autoRemoveBackground, onChange]);

  const processItem = useCallback(async (id: string) => {
    abortMapRef.current.set(id, false);

    const mark = (partial: Partial<UploadResult>) => {
      setItems((prev) => {
        const next = prev.map((it) => (it.id === id ? { ...it, ...partial } : it));
        onChange?.(next);
        return next;
      });
    };

    const findCurrent = () => items.find((i) => i.id === id);

    const estimate = (sizeBytes: number, step: 'upload' | 'analyse' | 'suppression' | 'finalisation') => {
      const mb = Math.max(0.1, sizeBytes / (1024 * 1024));
      const factors: Record<string, number> = { upload: 400, analyse: 900, suppression: 1400, finalisation: 300 };
      return Math.round(mb * factors[step]);
    };

    try {
      // Upload (compression)
      mark({ status: 'processing', step: 'upload', progress: 8 });
      const current0 = findCurrent();
      if (!current0) return;

      const comp = await compressImageFile(current0.file, { maxDimension: 1920, maxBytes: 2_000_000 });
      if (abortMapRef.current.get(id)) return;

      if (comp.compressedSize > 2_000_000) {
        mark({ status: 'error', error: 'Fichier trop volumineux après compression (>2MB)' });
        toast.error('Fichier trop volumineux après compression (>2MB)');
        return;
      }

      const newNameBase = current0.file.name.replace(/\.[^.]+$/, '');
      const newExt = comp.format === 'image/webp' ? 'webp' : 'jpg';
      const compressedFile = new File([comp.blob], `${newNameBase}.${newExt}`, { type: comp.format });
      const newUrl = URL.createObjectURL(comp.blob);
      const msg = `Image compressée de ${ (current0.file.size / (1024*1024)).toFixed(1) }MB à ${ (comp.blob.size / (1024*1024)).toFixed(1) }MB`;
      toast.success(msg);

      mark({
        file: compressedFile,
        originalUrl: newUrl,
        progress: 20,
        etaMs: estimate(comp.compressedSize, 'analyse') + estimate(comp.compressedSize, 'suppression') + estimate(comp.compressedSize, 'finalisation'),
        sizeInfo: {
          originalKB: Math.round(current0.file.size / 1024),
          compressedKB: Math.round(comp.blob.size / 1024),
          format: comp.format,
          resized: comp.resized,
        },
      });

      // Analyse (load image)
      mark({ step: 'analyse' });
      const img = await loadImage(compressedFile);
      if (abortMapRef.current.get(id)) return;
      mark({ progress: 45, etaMs: estimate(comp.compressedSize, 'suppression') + estimate(comp.compressedSize, 'finalisation') });

      // Suppression (background)
      mark({ step: 'suppression' });
      let bgBlob: Blob;
      const tBg0 = performance.now();
      try {
        const res = await removeBackgroundPreferred(comp.blob);
        bgBlob = res.blob;
        console.info('[BG] Provider utilisé:', res.provider, 'durée:', Math.round(res.durationMs), 'ms');
      } catch (err) {
        console.warn('[BG] EdenAI indisponible, fallback local', err);
        bgBlob = await removeBackground(img);
      }
      if (abortMapRef.current.get(id)) return;
      const tBg = performance.now() - tBg0;
      console.info('[BG] Temps total suppression:', Math.round(tBg), 'ms');
      mark({ progress: 85, etaMs: estimate(comp.compressedSize, 'finalisation') });

      // Finalisation
      mark({ step: 'finalisation' });
      const url = URL.createObjectURL(bgBlob);
      mark({ processedUrl: url, status: 'done', progress: 100, etaMs: 0 });
    } catch (e: any) {
      mark({ status: 'error', error: e?.message ?? 'Erreur inconnue' });
    }
  }, [items, onChange]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      onChange?.(next);
      return next;
    });
  }, [onChange]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [handleFiles]);

  const onBrowse = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' ? onBrowse() : undefined)}
        onClick={onBrowse}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={
          `flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
           ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/60'}
          `
        }
        aria-label="Zone de dépôt pour téléverser des images"
      >
        <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Glissez-déposez vos images ici, ou
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onBrowse(); }}
            className="mx-1 font-medium text-primary underline"
          >
            parcourir
          </button>
          vos fichiers
        </p>
        <p className="mt-1 text-xs text-muted-foreground/80">JPEG, PNG, WEBP — upload multiple autorisé</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((it) => (
            <div key={it.id} className="relative overflow-hidden rounded-md border bg-card">
              <div className="aspect-square w-full">
                <img
                  src={it.processedUrl ?? it.originalUrl}
                  alt="Prévisualisation du vêtement sans arrière-plan"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              {it.status !== 'done' && (
                <div className="absolute inset-x-0 bottom-0 space-y-2 bg-background/70 p-2 backdrop-blur animate-fade-in">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {(['upload','analyse','suppression','finalisation'] as const).map((s, idx) => {
                        const active = it.step === s || (idx === 0 && !it.step);
                        const label = s === 'upload' ? 'Upload' : s === 'analyse' ? 'Analyse' : s === 'suppression' ? 'Suppression' : 'Finalisation';
                        return (
                          <React.Fragment key={s}>
                            <span className={active ? 'text-foreground font-medium' : ''}>{label}</span>
                            {idx < 3 && <span>→</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="rounded px-2 py-1 hover:bg-accent"
                    >
                      Annuler
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>{Math.round(it.progress)}%</span>
                    {typeof it.etaMs === 'number' && it.etaMs > 0 && (
                      <span className="text-muted-foreground">~{Math.max(1, Math.round(it.etaMs / 1000))}s restantes</span>
                    )}
                  </div>
                  <Progress value={it.progress} />
                </div>
              )}

              <button
                type="button"
                onClick={() => removeItem(it.id)}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow hover:bg-background"
                aria-label="Supprimer cette image"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
