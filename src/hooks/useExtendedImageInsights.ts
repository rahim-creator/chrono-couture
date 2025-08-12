import { useEffect, useMemo, useState } from "react";
import type { UploadResult } from "@/components/UploadDropzone";
import { analyzeImage } from "@/lib/vision";
import { analyzeClothingAttributes } from "@/lib/clothingAnalysis";
import type { ExtendedImageInsights } from "@/types/enhanced-wardrobe";

export function useExtendedImageInsights(uploads: UploadResult[]) {
  const [insights, setInsights] = useState<ExtendedImageInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetUrl = useMemo(() => {
    const done = uploads.find((u) => u.status === "done" && (u.processedUrl || u.originalUrl));
    const any = uploads[0];
    return done?.processedUrl || done?.originalUrl || any?.processedUrl || any?.originalUrl || null;
  }, [uploads]);

  useEffect(() => {
    let aborted = false;
    async function run() {
      if (!targetUrl) {
        setInsights(null);
        return;
      }
      setLoading(true);
      setError(null);
      
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.crossOrigin = "anonymous";
          el.onload = () => resolve(el);
          el.onerror = reject;
          el.src = targetUrl;
        });

        // Analyse de base existante
        const basicAnalysis = await analyzeImage(img);
        
        // Nouvelle analyse étendue
        const response = await fetch(targetUrl);
        const blob = await response.blob();
        const extendedAnalysis = await analyzeClothingAttributes(blob);
        
        if (!aborted) {
          setInsights({
            ...basicAnalysis,
            ...extendedAnalysis
          });
        }
      } catch (e: any) {
        if (!aborted) setError(e?.message ?? "Analyse impossible");
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    void run();
    return () => { aborted = true; };
  }, [targetUrl]);

  return { insights, loading, error };
}