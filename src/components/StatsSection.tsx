import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Shirt, Calendar, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

type WardrobeStats = {
  total_items: number;
  tops_count: number;
  bottoms_count: number;
  shoes_count: number;
  casual_count: number;
  business_count: number;
  sport_count: number;
  summer_count: number;
  winter_count: number;
  mid_season_count: number;
  all_season_count: number;
  colors_used: string[];
  last_added: string;
};

type OutfitStats = {
  total_outfits: number;
  avg_rating: number;
  high_rated_count: number;
  work_outfits: number;
  sport_outfits: number;
  evening_outfits: number;
  last_outfit_date: string;
  days_with_outfits: number;
};

const StatsSection = () => {
  const [wardrobeStats, setWardrobeStats] = useState<WardrobeStats | null>(null);
  const [outfitStats, setOutfitStats] = useState<OutfitStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          setLoading(false);
          return;
        }

        // Récupérer les stats de garde-robe
        const { data: wardrobeData } = await supabase
          .from('wardrobe_stats')
          .select('*')
          .eq('user_id', user.user.id)
          .maybeSingle();

        // Récupérer les stats d'historique
        const { data: outfitData } = await supabase
          .from('outfit_stats')
          .select('*')
          .eq('user_id', user.user.id)
          .maybeSingle();

        setWardrobeStats(wardrobeData);
        setOutfitStats(outfitData);
      } catch (err) {
        console.error('Erreur lors du chargement des statistiques:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!wardrobeStats && !outfitStats) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold">Statistiques rapides</h2>
        <p className="text-muted-foreground mt-1">
          Ajoutez des vêtements et portez des tenues pour voir vos statistiques personnalisées.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Statistiques de garde-robe */}
      {wardrobeStats && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total vêtements</CardTitle>
              <Shirt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wardrobeStats.total_items}</div>
              <div className="flex gap-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {wardrobeStats.tops_count} hauts
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {wardrobeStats.bottoms_count} bas
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {wardrobeStats.shoes_count} chaussures
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Répartition style</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Décontracté</span>
                  <span className="text-sm font-medium">{wardrobeStats.casual_count}</span>
                </div>
                <Progress 
                  value={(wardrobeStats.casual_count / wardrobeStats.total_items) * 100} 
                  className="h-2"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Professionnel</span>
                  <span className="text-sm font-medium">{wardrobeStats.business_count}</span>
                </div>
                <Progress 
                  value={(wardrobeStats.business_count / wardrobeStats.total_items) * 100} 
                  className="h-2"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sport</span>
                  <span className="text-sm font-medium">{wardrobeStats.sport_count}</span>
                </div>
                <Progress 
                  value={(wardrobeStats.sport_count / wardrobeStats.total_items) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Couleurs utilisées</CardTitle>
              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-red-500 to-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wardrobeStats.colors_used?.length || 0}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {wardrobeStats.colors_used?.slice(0, 8).map((color, index) => (
                  <div
                    key={index}
                    className="h-4 w-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                {wardrobeStats.colors_used?.length > 8 && (
                  <div className="text-xs text-muted-foreground self-center">
                    +{wardrobeStats.colors_used.length - 8}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Statistiques d'historique */}
      {outfitStats && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenues portées</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outfitStats.total_outfits}</div>
            <div className="flex items-center gap-2 mt-2">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-muted-foreground">
                {outfitStats.avg_rating?.toFixed(1) || 'N/A'} moyenne
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {outfitStats.days_with_outfits} jours différents
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatsSection;