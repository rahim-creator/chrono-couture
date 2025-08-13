import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getPreferences, scoreGarment, updateWithLook } from "@/lib/preferences";
import { useWeather } from "@/hooks/useWeather";
import { supabase } from "@/integrations/supabase/client";
import { generateEnhancedLooks as generateEnhancedLooksLib } from "@/lib/enhancedRecommendations";
import type { EnhancedWardrobeItem, EnhancedLook } from "@/types/enhanced-wardrobe";
import { Badge } from "@/components/ui/badge";

type Context = { city?: string; temp?: number | null; mood?: string; event?: string; date?: string };

type Look = { id: string; items: EnhancedWardrobeItem[]; note: string };

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

function generateEnhancedLooks(ctx: Context, wardrobe: EnhancedWardrobeItem[], n = 3): Look[] {
  if (wardrobe.length === 0) {
    return [{
      id: "empty",
      items: [],
      note: "Ajoutez des vêtements à votre garde-robe pour obtenir des recommandations personnalisées !"
    }];
  }
  
  const prefs = getPreferences();
    
  // Filtres avancés
  const filterByMaterial = (g: EnhancedWardrobeItem) => {
    if (!ctx.temp) return true;
    if (ctx.temp < 10) return ['laine', 'cachemire'].includes(g.material);
    if (ctx.temp > 25) return ['coton', 'lin', 'soie'].includes(g.material);
    return true;
  };
  
  const filterByCondition = (g: EnhancedWardrobeItem) => {
    if (ctx.event === 'travail') return g.condition !== 'usé';
    return true;
  };
  
  const filterByFreshness = (g: EnhancedWardrobeItem) => {
    if (!g.last_worn) return true;
    const daysSince = (Date.now() - new Date(g.last_worn).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 3; // Éviter les vêtements portés récemment
  };

  const filterByEvent = (g: EnhancedWardrobeItem) => {
    if (ctx.event === "sport") return g.formality === "sport";
    if (ctx.event === "travail") return g.formality !== "sport";
    return true;
  };

  const filterBySeason = (g: EnhancedWardrobeItem) => {
    if (!ctx.temp) return true;
    if (ctx.temp < 10) return g.season === "hiver" || g.season === "toutes";
    if (ctx.temp > 25) return g.season === "ete" || g.season === "toutes";
    return g.season === "mi-saison" || g.season === "toutes";
  };
  
  // Score sophistiqué
  const scoreGarmentEnhanced = (g: EnhancedWardrobeItem) => {
    let score = scoreGarment(g, prefs); // Score de base existant
      
    // Bonus pour l'état
    if (g.condition === 'neuf') score += 20;
    else if (g.condition === 'bon') score += 10;
      
    // Bonus pour la polyvalence
    score += g.versatility_score * 0.3;
      
    // Bonus pour la fraîcheur
    if (g.last_worn) {
      const daysSince = (Date.now() - new Date(g.last_worn).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.min(daysSince * 2, 30);
    }
      
    return score;
  };
  
  const pool = wardrobe.filter(g =>   
    filterByEvent(g) &&   
    filterBySeason(g) &&   
    filterByMaterial(g) &&   
    filterByCondition(g) &&   
    filterByFreshness(g)  
  );
  
  const pickBestEnhanced = (type: EnhancedWardrobeItem["type"]) => {
    const candidates = pool.filter((g) => g.type === type);
    if (candidates.length === 0) {
      const allOfType = wardrobe.filter((g) => g.type === type);
      return allOfType.length > 0 ? allOfType[0] : null;
    }
    return candidates.sort((a, b) => scoreGarmentEnhanced(b) - scoreGarmentEnhanced(a))[0];
  };
  
  // Génération des looks avec cohérence stylistique
  const looks: Look[] = [];
  for (let i = 0; i < n; i++) {
    const top = pickBestEnhanced("haut");
    const bottom = pickBestEnhanced("bas");
    const shoes = pickBestEnhanced("chaussures");

    const items = [top, bottom, shoes].filter(Boolean) as EnhancedWardrobeItem[];
    if (items.length === 0) continue;

    // Note contextuelle améliorée
    const note = generateContextualNote(ctx, items);
    looks.push({ id: `${i}`, items, note });
  }

  return looks.length > 0 ? looks : [{
    id: "insufficient",
    items: [],
    note: "Ajoutez plus de vêtements variés pour obtenir de meilleures recommandations."
  }];
}

function generateContextualNote(ctx: Context, items: EnhancedWardrobeItem[]): string {
  const materials = items.map(i => i.material);
  const hasWool = materials.includes('laine') || materials.includes('cachemire');
  const hasLight = materials.includes('coton') || materials.includes('lin');
    
  if (typeof ctx.temp === 'number') {
    if (ctx.temp < 10 && hasWool) return "Parfait pour le froid — matières chaudes";
    if (ctx.temp > 25 && hasLight) return "Idéal pour la chaleur — matières respirantes";
  }
    
  if (ctx.event === "travail") {
    const businessItems = items.filter(i => i.formality === 'business');
    return businessItems.length > 1 ? "Look professionnel cohérent" : "Business casual adapté";
  }
    
  return "Association harmonieuse et confortable";
}

const Swatch = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: color }} aria-label={`Couleur ${label}`} />
    <span className="text-sm text-muted-foreground">{label}</span>
  </div>
);

const Recommandations = () => {
  const { ctx } = useWeather();
  const [userWardrobe, setUserWardrobe] = useState<EnhancedWardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    const fetchWardrobe = async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        if (!userRes.user) {
          setLoading(false);
          console.log('Utilisateur non connecté, redirection...');
          window.location.href = '/auth';
          return;
        }
        
        const { data, error } = await supabase
          .from('wardrobe_items')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (data && !error) {
          const mapped: EnhancedWardrobeItem[] = data.map(item => ({
            id: item.id,
            user_id: item.user_id,
            type: item.type as "haut" | "bas" | "chaussures",
            color: item.color,
            season: item.season as "toutes" | "ete" | "hiver" | "mi-saison",
            formality: (item.formality as "casual" | "business" | "sport") || inferFormality(item.tags || []),
            tags: item.tags || [],
            image_path: item.image_path,
            image_url: item.image_url || undefined,
            created_at: item.created_at,
            updated_at: item.updated_at,
            // Nouveaux champs avec valeurs par défaut
            brand: item.brand || undefined,
            size: item.size as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' || undefined,
            material: (item.material as 'coton' | 'laine' | 'polyester' | 'lin' | 'soie' | 'cachemire' | 'denim' | 'cuir') || 'coton',
            pattern: (item.pattern as 'uni' | 'rayé' | 'imprimé' | 'à pois' | 'carreaux' | 'floral') || 'uni',
            fit: (item.fit as 'slim' | 'regular' | 'loose' | 'oversized') || 'regular',
            condition: (item.condition as 'neuf' | 'bon' | 'usé') || 'bon',
            purchase_date: item.purchase_date || undefined,
            last_worn: item.last_worn || undefined,
            versatility_score: item.versatility_score || 50,
            weight: (item.weight as 'léger' | 'moyen' | 'épais') || 'moyen',
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

  const [looks, setLooks] = useState<Look[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    const generateLooks = async () => {
      if (userWardrobe.length === 0) {
        setLooks([{
          id: "empty",
          items: [],
          note: "Ajoutez des vêtements à votre garde-robe pour obtenir des recommandations personnalisées !"
        }]);
        return;
      }

      setLoadingRecommendations(true);
      try {
        const { generateGeminiRecommendations } = await import('@/lib/geminiRecommendations');
        const geminiLooks = await generateGeminiRecommendations(ctx, userWardrobe);
        const mappedLooks = geminiLooks.map((look: any) => ({
          ...look,
          items: look.items.map((id: string) => userWardrobe.find(item => item.id === id)).filter(Boolean)
        }));
        setLooks(mappedLooks);
      } catch (err) {
        console.warn('Gemini indisponible, fallback local', err);
        setLooks(generateEnhancedLooks(ctx, userWardrobe, 3));
      } finally {
        setLoadingRecommendations(false);
      }
    };

    generateLooks();
  }, [ctx, userWardrobe, seed]);

  if (loading || loadingRecommendations) {
    return (
      <main className="container py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {loading ? "Chargement de votre garde-robe..." : "Génération de vos recommandations..."}
            </p>
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