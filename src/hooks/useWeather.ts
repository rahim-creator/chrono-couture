import { useEffect, useState } from "react";

type Ctx = { city?: string; temp?: number | null; mood?: string; event?: string; date?: string };

function codeToMood(code?: number): string | undefined {
  if (code == null) return undefined;
  if (code === 0) return "ensoleillé";
  if ([1, 2, 3].includes(code)) return "nuageux";
  if ([45, 48].includes(code)) return "brumeux";
  if ([51, 53, 55, 61, 63, 65].includes(code)) return "pluvieux";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "hivernal";
  return "variable";
}

export function useWeather() {
  const [ctx, setCtx] = useState<Ctx>(() => {
    try { return JSON.parse(sessionStorage.getItem("dressme:context") || "{}") } catch { return {} }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true); setError(null);
      try {
        const coords = await new Promise<GeolocationPosition | { coords: { latitude: number; longitude: number } }>((resolve) => {
          if (!navigator.geolocation) return resolve({ coords: { latitude: 48.8566, longitude: 2.3522 } });
          navigator.geolocation.getCurrentPosition(resolve, () => resolve({ coords: { latitude: 48.8566, longitude: 2.3522 } }), { enableHighAccuracy: true, timeout: 5000 });
        });
        const lat = (coords as any).coords.latitude;
        const lon = (coords as any).coords.longitude;
        const wx = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`).then(r => r.json());
        const temp = wx?.current?.temperature_2m ?? null;
        const code = wx?.current?.weather_code;
        let city: string | undefined = undefined;
        try {
          const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`).then(r => r.json());
          city = rev?.address?.city || rev?.address?.town || rev?.address?.village || rev?.address?.municipality || rev?.display_name?.split(',')[0];
        } catch {}
        const next: Ctx = { city: city || ctx.city || "Local", temp, mood: codeToMood(code), event: ctx.event || "quotidien", date: new Date().toISOString() };
        if (!cancelled) {
          setCtx(next);
          try { sessionStorage.setItem("dressme:context", JSON.stringify(next)); } catch {}
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Météo indisponible");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ctx, loading, error };
}
