import React, { useCallback, useMemo, useRef, useState } from 'react';

import { Progress } from '@/components/ui/progress';
import { loadImage, removeBackground } from '@/lib/background';
import { Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export type UploadResult = {
  id: string;
  file: File;
  originalUrl: string;
  processedUrl?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number; // 0-100
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

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const filesArr = Array.from(files);
    const isImage = (f: File) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name);
    const accepted = filesArr.filter(isImage);
    const rejected = filesArr.filter((f) => !isImage(f));
    if (rejected.length) {
      toast.error(`Format non supporté: ${rejected.slice(0, 3).map((f) => f.name).join(", ")}${rejected.length > 3 ? "…" : ""}`);
    }
    if (!accepted.length) return;

    // Initialize items with previews
    const newItems: UploadResult[] = accepted.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      originalUrl: URL.createObjectURL(file),
      status: autoRemoveBackground ? ('processing' as const) : ('pending' as const),
      processedUrl: undefined,
      progress: autoRemoveBackground ? 5 : 0,
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
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'processing' as const, progress: 10 } : it)));

    const current = items.find((i) => i.id === id);
    if (!current) return;

    try {
      const img = await loadImage(current.file);
      // Simulate staged progress while loading model
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, progress: 40 } : it)));
      const blob = await removeBackground(img);
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, progress: 85 } : it)));
      const url = URL.createObjectURL(blob);
      setItems((prev) => {
        const next = prev.map((it) => (it.id === id ? { ...it, processedUrl: url, status: 'done' as const, progress: 100 } : it));
        onChange?.(next);
        return next;
      });
    } catch (e: any) {
      setItems((prev) => {
        const next = prev.map((it) => (it.id === id ? { ...it, status: 'error' as const, error: e?.message ?? 'Erreur inconnue' } : it));
        onChange?.(next);
        return next;
      });
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
                <div className="absolute inset-x-0 bottom-0 space-y-1 bg-background/70 p-2 backdrop-blur">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {it.status === 'processing' ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Nettoyage de l'arrière-plan…</span>
                      </>
                    ) : it.status === 'pending' ? (
                      <span>En attente</span>
                    ) : (
                      <span className="text-destructive">Erreur</span>
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
