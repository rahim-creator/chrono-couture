import { useEffect, useMemo, useState } from "react";
import type { UploadResult } from "@/components/UploadDropzone";
import { analyzeImage } from "@/lib/vision";

export type ImageInsights = Awaited<ReturnType<typeof analyzeImage>>;

export function useImageInsights(uploads: UploadResult[]) {
  const [insights, setInsights] = useState<ImageInsights | null>(null);
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
      setLoading(true); setError(null);
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.crossOrigin = "anonymous";
          el.onload = () => resolve(el);
          el.onerror = reject;
          el.src = targetUrl;
        });
        const res = await analyzeImage(img);
        if (!aborted) setInsights(res);
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
