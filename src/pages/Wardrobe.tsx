import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const Wardrobe = () => {
  return (
    <main className="container py-10">
      <SEO title="DressMe — Ma garde-robe" description="Gérez vos vêtements : ajout, édition, filtres par type, couleur, saison." canonical="/garde-robe" />
      <h1 className="sr-only">Ma garde-robe</h1>

      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">Ajoutez vos pièces pour des recommandations plus pertinentes.</p>
        <Button variant="hero"><PlusCircle className="mr-2" /> Ajouter un vêtement</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1,2,3,4,5,6].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-40 bg-gradient-to-tr from-[hsl(var(--brand)/.15)] to-[hsl(var(--brand-2)/.15)]" aria-hidden />
            <CardHeader>
              <CardTitle>Pièce #{i}</CardTitle>
              <CardDescription>Type, couleur, style…</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Aperçu visuel et métadonnées bientôt.</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
};

export default Wardrobe;