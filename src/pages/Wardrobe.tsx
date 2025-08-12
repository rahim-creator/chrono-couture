import React from "react";
import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

 type WardrobeItem = {
  id: string;
  created_at: string;
  type: 'haut' | 'bas' | 'chaussures';
  color: string;
  season: 'toutes' | 'ete' | 'hiver' | 'mi-saison';
  tags: string[];
  image_path: string;
  signed_url?: string | null;
 };

const Wardrobe = () => {
  const [items, setItems] = React.useState<WardrobeItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [needAuth, setNeedAuth] = React.useState(false);

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
      }
      setLoading(false);
    })();
  }, []);

  return (
    <main className="container py-10">
      <SEO title="DressMe — Ma garde-robe" description="Vos vêtements enregistrés avec image et métadonnées." canonical="/garde-robe" />
      <h1 className="sr-only">Ma garde-robe</h1>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted-foreground">Ajoutez vos pièces pour des recommandations plus pertinentes.</p>
        <Button variant="hero"><PlusCircle className="mr-2" /> Ajouter un vêtement</Button>
      </div>

      {needAuth && <div className="text-sm text-muted-foreground">Connectez-vous pour voir votre garde-robe.</div>}
      {loading && <div className="text-sm text-muted-foreground">Chargement…</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Card key={it.id} className="overflow-hidden">
            <div className="h-40 overflow-hidden bg-muted">
              {it.signed_url ? (
                <img src={it.signed_url} alt={`Vêtement ${it.type}`} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="h-full w-full bg-gradient-to-tr from-[hsl(var(--brand)/.15)] to-[hsl(var(--brand-2)/.15)]" aria-hidden />
              )}
            </div>
            <CardHeader>
              <CardTitle className="capitalize">{it.type}</CardTitle>
              <CardDescription>
                Couleur {it.color} — Saison {it.season}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {it.tags?.length ? (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {it.tags.map((t) => <span key={t} className="rounded border px-2 py-0.5">{t}</span>)}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Aucun tag</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && !needAuth && items.length === 0 && (
        <div className="text-sm text-muted-foreground">Aucun vêtement enregistré pour le moment.</div>
      )}
    </main>
  );
};

export default Wardrobe;