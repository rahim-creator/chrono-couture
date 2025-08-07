import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Profil = () => {
  return (
    <main className="container py-10">
      <SEO title="DressMe — Profil & réglages" description="Gérez vos informations, tailles et préférences de style et de couleurs." canonical="/profil" />
      <h1 className="sr-only">Profil & réglages</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Préférences</CardTitle>
          <CardDescription>Ces paramètres affineront les recommandations</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Nom</Label>
            <Input placeholder="Votre nom" />
          </div>
          <div className="grid gap-2">
            <Label>Palette préférée (couleur clé)</Label>
            <Input type="color" aria-label="Couleur préférée" />
          </div>
          <div className="grid gap-2">
            <Label>Seuil froid (°C)</Label>
            <Input type="number" placeholder="10" />
          </div>
          <Button variant="hero">Enregistrer</Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default Profil;