import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getPreferences, scoreGarment, updateWithLook } from "@/lib/preferences";
import { useWeather } from "@/hooks/useWeather";

type Context = { city?: string; temp?: number | null; mood?: string; event?: string; date?: string };

type Garment = { id: string; type: "haut" | "bas" | "chaussures"; color: string; formality: "casual" | "business" | "sport" };

type Look = { id: string; items: Garment[]; note: string };

const MOCK_WARDROBE: Garment[] = [
  { id: "t1", type: "haut", color: "#2E86DE", formality: "business" },
  { id: "t2", type: "haut", color: "#E67E22", formality: "casual" },
  { id: "t3", type: "haut", color: "#16A085", formality: "casual" },
  { id: "b1", type: "bas", color: "#2C3E50", formality: "business" },
  { id: "b2", type: "bas", color: "#7F8C8D", formality: "casual" },
  { id: "s1", type: "chaussures", color: "#1B1B1B", formality: "business" },
  { id: "s2", type: "chaussures", color: "#95A5A6", formality: "casual" },
];

function generateLooks(ctx: Context, wardrobe: Garment[], n = 3): Look[] {
  const prefs = getPreferences();
  const filterByEvent = (g: Garment) => {
    if (ctx.event === "sport") return g.formality === "sport"; // none in mock
    if (ctx.event === "travail") return g.formality !== "sport";
    return true;
  };

  const pool = wardrobe.filter(filterByEvent);
  const pickBest = (type: Garment["type"]) => {
    const candidates = pool.filter((g) => g.type === type);
    if (candidates.length === 0) return wardrobe.find((g) => g.type === type)!;
    return candidates.sort((a, b) => scoreGarment(b, prefs) - scoreGarment(a, prefs))[0];
  };

  const looks: Look[] = [];
  for (let i = 0; i < n; i++) {
    const top = pickBest("haut");
    const bottom = pickBest("bas");
    const shoes = pickBest("chaussures");

    const note = typeof ctx.temp === 'number'
      ? ctx.temp < 10
        ? "Couche chaude recommandée — teintes sobres"
        : ctx.temp > 25
          ? "Matières légères et respirantes"
          : "Confort mi-saison"
      : ctx.event === "travail" ? "Business casual confortable" : "Association harmonieuse et polyvalente";

    looks.push({ id: `${i}`, items: [top, bottom, shoes], note });
  }
  return looks;
}

const Swatch = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: color }} aria-label={`Couleur ${label}`} />
    <span className="text-sm text-muted-foreground">{label}</span>
  </div>
);

const Recommandations = () => {
  const { ctx } = useWeather();

  const [seed, setSeed] = useState(0);
  const looks = useMemo(() => generateLooks(ctx, MOCK_WARDROBE, 3), [ctx, seed]);

  return (
    <main className="container py-10">
      <SEO title="DressMe — Recommandations de tenues" description="Découvrez 1 à 3 looks proposés selon votre contexte du jour." canonical="/recommandations" />
      <h1 className="sr-only">Recommandations</h1>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted-foreground">Contexte: {ctx.city || "—"} {typeof ctx.temp === 'number' ? `• ${ctx.temp}°C` : ''} {ctx.mood ? `• ${ctx.mood}` : ''} {ctx.event ? `• ${ctx.event}` : ''}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSeed((s) => s + 1)}>Alternatives</Button>
          <Button variant="hero" onClick={() => { if (looks[0]) { updateWithLook(looks[0]); toast.success("Préférences mises à jour"); } }}>Valider le 1er look</Button>
        </div>
      </div>

      <div className="relative">
        <Carousel className="w-full">
          <CarouselContent>
            {looks.map((look) => (
              <CarouselItem key={look.id} className="md:basis-1/2 lg:basis-1/3">
                <Card>
                  <CardHeader>
                    <CardTitle>Look #{Number(look.id) + 1}</CardTitle>
                    <CardDescription>{look.note}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Swatch color={look.items[0].color} label="Haut" />
                    <Swatch color={look.items[1].color} label="Bas" />
                    <Swatch color={look.items[2].color} label="Chaussures" />
                    <Button variant="secondary" onClick={() => { updateWithLook(look); toast.success("Préférences mises à jour"); }}>Valider ce look</Button>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </main>
  );
};

export default Recommandations;