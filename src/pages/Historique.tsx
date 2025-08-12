import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Star, Filter, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type OutfitHistoryItem = {
  id: string;
  worn_date: string;
  context: any; // JSON context object
  items: string[]; // IDs des wardrobe_items
  rating?: number | null;
  notes?: string | null;
  created_at: string;
  wardrobe_items?: Array<{
    id: string;
    type: string;
    color: string;
    signed_url?: string;
  }>;
};

type FilterState = {
  month: string;
  rating: string;
  event: string;
};

const Historique = () => {
  const [history, setHistory] = useState<OutfitHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<OutfitHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [needAuth, setNeedAuth] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    month: '',
    rating: '',
    event: ''
  });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        if (!userRes.user) {
          setNeedAuth(true);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('outfit_history')
          .select('*')
          .order('worn_date', { ascending: false })
          .limit(50);

        if (data && !error) {
          // Enrichir avec les détails des vêtements
          const enrichedHistory = await Promise.all(
            data.map(async (item) => {
              if (item.items && item.items.length > 0) {
                const { data: wardrobeItems } = await supabase
                  .from('wardrobe_items')
                  .select('id, type, color, image_path')
                  .in('id', item.items);

                if (wardrobeItems) {
                  // Générer les URLs signées
                  const itemsWithUrls = await Promise.all(
                    wardrobeItems.map(async (wardrobeItem) => {
                      const { data: signed } = await supabase.storage
                        .from('wardrobe')
                        .createSignedUrl(wardrobeItem.image_path, 3600);
                      return {
                        ...wardrobeItem,
                        signed_url: signed?.signedUrl || null
                      };
                    })
                  );
                  return { ...item, wardrobe_items: itemsWithUrls };
                }
              }
              return { ...item, wardrobe_items: [] };
            })
          );

          setHistory(enrichedHistory);
          setFilteredHistory(enrichedHistory);
        } else if (error) {
          console.error('Erreur lors du chargement de l\'historique:', error);
          toast.error("Impossible de charger l'historique");
        }
      } catch (err) {
        console.error('Erreur:', err);
        toast.error("Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Filtrage en temps réel
  useEffect(() => {
    let filtered = history;

    // Filtre par mois
    if (filters.month) {
      filtered = filtered.filter(item => 
        item.worn_date.startsWith(filters.month)
      );
    }

    // Filtre par note
    if (filters.rating) {
      const minRating = parseInt(filters.rating);
      filtered = filtered.filter(item => 
        item.rating && item.rating >= minRating
      );
    }

    // Filtre par événement
    if (filters.event) {
      filtered = filtered.filter(item => 
        item.context?.event === filters.event
      );
    }

    setFilteredHistory(filtered);
  }, [history, filters]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ month: '', rating: '', event: '' });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <main className="container py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement de votre historique...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-10">
      <SEO title="DressMe — Historique" description="Timeline des tenues portées avec filtres par date, humeur et événement." canonical="/historique" />
      <h1 className="sr-only">Historique</h1>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            {filteredHistory.length} tenue{filteredHistory.length > 1 ? 's' : ''} portée{filteredHistory.length > 1 ? 's' : ''}
            {history.length !== filteredHistory.length && ` sur ${history.length}`}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Effacer les filtres
            </Button>
          )}
        </div>
        <Button variant="hero" asChild>
          <Link to="/recommandations">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle tenue
          </Link>
        </Button>
      </div>

      {/* Barre de filtres */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filtres</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Select value={filters.month} onValueChange={(value) => updateFilter('month', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les mois</SelectItem>
              <SelectItem value="2025-01">Janvier 2025</SelectItem>
              <SelectItem value="2024-12">Décembre 2024</SelectItem>
              <SelectItem value="2024-11">Novembre 2024</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.rating} onValueChange={(value) => updateFilter('rating', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Note minimum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les notes</SelectItem>
              <SelectItem value="5">5 étoiles</SelectItem>
              <SelectItem value="4">4+ étoiles</SelectItem>
              <SelectItem value="3">3+ étoiles</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.event} onValueChange={(value) => updateFilter('event', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Événement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous événements</SelectItem>
              <SelectItem value="travail">Travail</SelectItem>
              <SelectItem value="rdv">Rendez-vous</SelectItem>
              <SelectItem value="soirée">Soirée</SelectItem>
              <SelectItem value="sport">Sport</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {needAuth && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-4">Connectez-vous pour voir votre historique de tenues</p>
          <Button variant="outline" asChild>
            <Link to="/auth">Se connecter</Link>
          </Button>
        </div>
      )}

      {/* Affichage de l'historique */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredHistory.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  {new Date(item.worn_date).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </CardTitle>
                {renderStars(item.rating)}
              </div>
              <CardDescription>
                {item.context?.city && `${item.context.city} • `}
                {item.context?.temp && `${item.context.temp}°C • `}
                {item.context?.event || 'Quotidien'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Aperçu des vêtements */}
              {item.wardrobe_items && item.wardrobe_items.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {item.wardrobe_items.map((wardrobeItem) => (
                    <div key={wardrobeItem.id} className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-md overflow-hidden bg-muted">
                        {wardrobeItem.signed_url ? (
                          <img 
                            src={wardrobeItem.signed_url} 
                            alt={wardrobeItem.type}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div 
                            className="h-full w-full border-2 border-dashed border-gray-300"
                            style={{ backgroundColor: wardrobeItem.color }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Contexte et humeur */}
              <div className="flex flex-wrap gap-1">
                {item.context?.mood && (
                  <Badge variant="secondary" className="text-xs">
                    {item.context.mood}
                  </Badge>
                )}
                {item.context?.event && (
                  <Badge variant="outline" className="text-xs">
                    {item.context.event}
                  </Badge>
                )}
              </div>

              {/* Notes si présentes */}
              {item.notes && (
                <p className="text-sm text-muted-foreground italic">
                  "{item.notes}"
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && !needAuth && filteredHistory.length === 0 && history.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-4">Aucune tenue ne correspond à vos filtres</p>
          <Button variant="outline" onClick={clearFilters}>
            Effacer les filtres
          </Button>
        </div>
      )}

      {!loading && !needAuth && history.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-4">Aucune tenue portée enregistrée pour le moment.</p>
          <Button variant="hero" asChild>
            <Link to="/recommandations">Porter votre première tenue</Link>
          </Button>
        </div>
      )}
    </main>
  );
};

export default Historique;