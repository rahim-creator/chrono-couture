import React from "react";
import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Filter, Grid, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

type WardrobeItem = {
  id: string;
  created_at: string;
  type: 'haut' | 'bas' | 'chaussures';
  color: string;
  season: 'toutes' | 'ete' | 'hiver' | 'mi-saison';
  formality?: 'casual' | 'business' | 'sport';
  tags: string[];
  image_path: string;
  signed_url?: string | null;
};

type FilterState = {
  search: string;
  type: string;
  season: string;
  formality: string;
};

type ViewMode = 'grid' | 'list';

const Wardrobe = () => {
  const [items, setItems] = React.useState<WardrobeItem[]>([]);
  const [filteredItems, setFilteredItems] = React.useState<WardrobeItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [needAuth, setNeedAuth] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [filters, setFilters] = React.useState<FilterState>({
    search: '',
    type: 'all',
    season: 'all',
    formality: 'all'
  });

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) {
        setNeedAuth(true);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('wardrobe_items').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        // Generate signed URLs for private images
        const withUrls = await Promise.all(
          data.map(async (it: any) => {
            const { data: signed } = await supabase.storage.from('wardrobe').createSignedUrl(it.image_path, 3600);
            return { ...it, signed_url: signed?.signedUrl ?? null } as WardrobeItem;
          })
        );
        setItems(withUrls);
        setFilteredItems(withUrls);
      }
      setLoading(false);
    })();
  }, []);

  // Filtrage en temps réel
  React.useEffect(() => {
    let filtered = items;

    // Filtre par recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        item.type.toLowerCase().includes(searchLower) ||
        item.season.toLowerCase().includes(searchLower) ||
        (item.formality && item.formality.toLowerCase().includes(searchLower))
      );
    }

    // Filtre par type
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(item => item.type === filters.type);
    }

    // Filtre par saison
    if (filters.season && filters.season !== 'all') {
      filtered = filtered.filter(item => item.season === filters.season);
    }

    // Filtre par formalité
    if (filters.formality && filters.formality !== 'all') {
      filtered = filtered.filter(item => item.formality === filters.formality);
    }

    setFilteredItems(filtered);
  }, [items, filters]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', type: 'all', season: 'all', formality: 'all' });
  };

  const hasActiveFilters = filters.search !== '' || filters.type !== 'all' || filters.season !== 'all' || filters.formality !== 'all';

  return (
    <main className="container py-10">
      <SEO title="DressMe — Ma garde-robe" description="Vos vêtements enregistrés avec image et métadonnées." canonical="/garde-robe" />
      <h1 className="sr-only">Ma garde-robe</h1>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            {filteredItems.length} vêtement{filteredItems.length > 1 ? 's' : ''} 
            {items.length !== filteredItems.length && ` sur ${items.length}`}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Effacer les filtres
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="hero" asChild>
            <Link to="/ajout">
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un vêtement
            </Link>
          </Button>
        </div>
      </div>

      {/* Barre de filtres */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filtres</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par tags, type..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="haut">Haut</SelectItem>
              <SelectItem value="bas">Bas</SelectItem>
              <SelectItem value="chaussures">Chaussures</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.season} onValueChange={(value) => updateFilter('season', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Saison" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes saisons</SelectItem>
              <SelectItem value="ete">Été</SelectItem>
              <SelectItem value="hiver">Hiver</SelectItem>
              <SelectItem value="mi-saison">Mi-saison</SelectItem>
              <SelectItem value="toutes">Toutes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.formality} onValueChange={(value) => updateFilter('formality', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous styles</SelectItem>
              <SelectItem value="casual">Décontracté</SelectItem>
              <SelectItem value="business">Professionnel</SelectItem>
              <SelectItem value="sport">Sport</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {needAuth && <div className="text-sm text-muted-foreground">Connectez-vous pour voir votre garde-robe.</div>}
      {loading && <div className="text-sm text-muted-foreground">Chargement…</div>}

      {/* Affichage des articles */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((it) => (
            <Card key={it.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 overflow-hidden bg-muted">
                {it.signed_url ? (
                  <img src={it.signed_url} alt={`Vêtement ${it.type}`} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-tr from-[hsl(var(--brand)/.15)] to-[hsl(var(--brand-2)/.15)]" aria-hidden />
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="capitalize text-base">{it.type}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: it.color }} />
                  {it.season} • {it.formality || 'casual'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {it.tags?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {it.tags.slice(0, 3).map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                    {it.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{it.tags.length - 3}</Badge>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Aucun tag</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((it) => (
            <Card key={it.id} className="overflow-hidden">
              <div className="flex">
                <div className="h-20 w-20 overflow-hidden bg-muted flex-shrink-0">
                  {it.signed_url ? (
                    <img src={it.signed_url} alt={`Vêtement ${it.type}`} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-tr from-[hsl(var(--brand)/.15)] to-[hsl(var(--brand-2)/.15)]" aria-hidden />
                  )}
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium capitalize">{it.type}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: it.color }} />
                        {it.season} • {it.formality || 'casual'}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(it.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {it.tags?.length ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {it.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && !needAuth && filteredItems.length === 0 && items.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-4">Aucun vêtement ne correspond à vos filtres</p>
          <Button variant="outline" onClick={clearFilters}>
            Effacer les filtres
          </Button>
        </div>
      )}

      {!loading && !needAuth && items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-4">Aucun vêtement enregistré pour le moment.</p>
          <Button variant="hero" asChild>
            <Link to="/ajout">Ajouter votre premier vêtement</Link>
          </Button>
        </div>
      )}
    </main>
  );
};

export default Wardrobe;