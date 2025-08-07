import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AddItemWizard = () => {
  return (
    <main className="container py-10">
      <SEO title="DressMe — Ajouter un vêtement" description="Assistant d'ajout en étapes : photo, catégorie, détails, style, validation." canonical="/ajout" />
      <h1 className="sr-only">Ajouter un vêtement</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Photo</CardTitle>
            <CardDescription>Téléversez une image de la pièce</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" aria-label="Téléverser une photo" />
            <Button variant="outline">Scanner l'étiquette (à venir)</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catégorie & détails</CardTitle>
            <CardDescription>Type, couleur, saison</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Haut, Bas, Chaussures…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="haut">Haut</SelectItem>
                  <SelectItem value="bas">Bas</SelectItem>
                  <SelectItem value="chaussures">Chaussures</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Couleur dominante (HEX)</Label>
              <Input placeholder="#112233" />
            </div>
            <div className="grid gap-2">
              <Label>Saison</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes saisons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes</SelectItem>
                  <SelectItem value="ete">Été</SelectItem>
                  <SelectItem value="hiver">Hiver</SelectItem>
                  <SelectItem value="mi-saison">Mi-saison</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="hero">Enregistrer</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AddItemWizard;