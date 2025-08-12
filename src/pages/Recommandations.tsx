import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getPreferences, scoreGarment, updateWithLook } from "@/lib/preferences";
import { useWeather } from "@/hooks/useWeather";
import { supabase } from "@/integrations/supabase/client";

type Context = { city?: string; temp?: number | null; mood?: string; event?: string; date?: string };

type Garment = { 
  id: string; 
  type: "haut" | "bas" | "chaussures"; 
  color: string; 
  formality: "casual" | "business" | "sport";
  season: "toutes" | "ete" | "hiver" | "mi-saison";
};

type Look = { id: string; items: Garment[]; note: string };

// Fonction pour inférer la formalité depuis les tags existants
function inferFormality(tags: string[]): "casual" | "business" | "sport" {
  const tagStr = tags.join(' ').toLowerCase();
  if (tagStr.includes('costume') || tagStr.includes('chemise') || tagStr.includes('blazer') || tagStr.includes('business')) {
    return 'business';
  }
  if (tagStr.includes('sport') || tagStr.includes('jogging') || tagStr.includes('basket') || tagStr.includes('running')) {
    return 'sport';
  }
  return 'casual';
}

function generateLooks(ctx: Context, wardrobe: Garment[], n = 3): Look[] {
  if (wardrobe.length === 0) {
    return [{
      id: "empty",
      items: [],
      note: "Ajoutez des vêtements à votre garde-robe pour obtenir des recommandations personnalisées !"
    }];
  }

  const prefs = getPreferences();
  const filterByEvent = (g: Garment) => {
    if (ctx.event === "sport") return g.formality === "sport";
    if (ctx.event === "travail") return g.formality !== "sport";
    return true;
  };

  const filterBySeason = (g: Garment) => {
    if (!ctx.temp) return true;
    if (ctx.temp < 10) return g.season === "hiver" || g.season === "toutes";
    if (ctx.temp > 25) return g.season === "ete" || g.season === "toutes";
    return g.season === "mi-saison" || g.season === "toutes";
  };

  const pool = wardrobe.filter(g => filterByEvent(g) && filterBySeason(g));
  
  const pickBest = (type: Garment["type"]) => {
    const candidates = pool.filter((g) => g.type === type);
    if (candidates.length === 0) {
      // Fallback vers tous les vêtements si aucun ne correspond aux filtres
      const allOfType = wardrobe.filter((g) => g.type === type);
      return allOfType.length > 0 ? allOfType[0] : null;
    }
    return candidates.sort((a, b) => scoreGarment(b, prefs) - scoreGarment(a, prefs))[0];
  };

  const looks: Look[] = [];
  for (let i = 0; i < n; i++) {
    const top = pickBest("haut");
    const bottom = pickBest("bas");
    const shoes = pickBest("chaussures");

    // Vérifier qu'on a au moins quelques pièces
    const items = [top, bottom, shoes].filter(Boolean) as Garment[];
    if (items.length === 0) continue;

    const note = typeof ctx.temp === 'number'
      ? ctx.temp < 10
        ? "Couche chaude recommandée — teintes sobres"
        : ctx.temp > 25
          ? "Matières légères et respirantes"
          : "Confort mi-saison"
      : ctx.event === "travail" ? "Business casual confortable" : "Association harmonieuse et polyvalente";

    looks.push({ id: `${i}`, items, note });
  }
  
  return looks.length > 0 ? looks : [{
    id: "insufficient",
    items: [],
    note: "Ajoutez plus de vêtements variés pour obtenir de meilleures recommandations."
  }];
}

const Swatch = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: color }} aria-label={`Couleur ${label}`} />
    <span className="text-sm text-muted-foreground">{label}</span>
  </div>
);

const Recommandations = () => {
  const { ctx } = useWeather();
  const [userWardrobe, setUserWardrobe] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    const fetchWardrobe = async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        if (!userRes.user) {
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('wardrobe_items')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (data && !error) {
          const mapped: Garment[] = data.map(item => ({
            id: item.id,
            type: item.type as "haut" | "bas" | "chaussures",
            color: item.color,
            season: item.season as "toutes" | "ete" | "hiver" | "mi-saison",
            formality: (item.formality as "casual" | "business" | "sport") || inferFormality(item.tags || [])
          }));
          setUserWardrobe(mapped);
        } else if (error) {
          console.error('Erreur lors du chargement de la garde-robe:', error);
          toast.error("Impossible de charger votre garde-robe");
        }
      } catch (err) {
        console.error('Erreur:', err);
        toast.error("Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWardrobe();
  }, []);

  const looks = useMemo(() => generateLooks(ctx, userWardrobe, 3), [ctx, userWardrobe, seed]);

  if (loading) {
    return (
      <main className="container py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement de votre garde-robe...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-10">
      <SEO title="DressMe — Recommandations de tenues" description="Découvrez 1 à 3 looks proposés selon votre contexte du jour." canonical="/recommandations" />
      <h1 className="sr-only">Recommandations</h1>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted-foreground">
          Contexte: {ctx.city || "—"} {typeof ctx.temp === 'number' ? `• ${ctx.temp}°C` : ''} {ctx.mood ? `• ${ctx.mood}` : ''} {ctx.event ? `• ${ctx.event}` : ''}
          {userWardrobe.length > 0 && ` • ${userWardrobe.length} vêtement${userWardrobe.length > 1 ? 's' : ''}`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSeed((s) => s + 1)}>Alternatives</Button>
          {looks[0] && looks[0].items.length > 0 && (
            <Button variant="hero" onClick={() => { 
              updateWithLook(looks[0]); 
              toast.success("Préférences mises à jour"); 
            }}>
              Valider le 1er look
            </Button>
          )}
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
                    {look.items.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="mb-4">Aucun vêtement disponible</p>
                        <Button variant="outline" onClick={() => window.location.href = '/ajout'}>
                          Ajouter des vêtements
                        </Button>
                      </div>
                    ) : (
                      <>
                        {look.items.map((item, idx) => (
                          <Swatch 
                            key={item.id} 
                            color={item.color} 
                            label={item.type === "haut" ? "Haut" : item.type === "bas" ? "Bas" : "Chaussures"} 
                          />
                        ))}
                        <Button 
                          variant="secondary" 
                          onClick={() => { 
                            updateWithLook(look); 
                            toast.success("Préférences mises à jour"); 
                          }}
                        >
                          Valider ce look
                        </Button>
                      </>
                    )}
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