import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Bienvenue = () => {
  return (
    <main>
      <SEO title="DressMe — Bienvenue" description="Découvrez DressMe, votre assistant look friendly rose et intuitif." canonical="/bienvenue" />

      <section className="bg-hero animate-fade-in">
        <div className="container py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Bienvenue sur DressMe</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">Votre garde-robe, réinventée. Ajoutez vos pièces, indiquez votre contexte, recevez 1 à 3 looks en quelques secondes.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="hero" size="lg" asChild>
              <Link to="/ajout">Commencer par ajouter un vêtement</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/recommandations">Voir des recommandations</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container grid gap-6 py-12 md:grid-cols-3">
        {[{
          t: 'Ajout rapide', d: 'Assistant en étapes avec photo, catégorie, couleur et saison.'
        }, {
          t: 'Looks intelligents', d: 'Carrousel de tenues avec explications succinctes.'
        }, {
          t: 'Historique & stats', d: 'Suivez vos usages et découvrez des insights personnels.'
        }].map((c) => (
          <Card key={c.t} className="hover-scale animate-fade-in">
            <CardHeader>
              <CardTitle>{c.t}</CardTitle>
              <CardDescription>{c.d}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-24 rounded-md bg-gradient-to-tr from-[hsl(var(--brand)/.12)] to-[hsl(var(--brand-2)/.12)]" aria-hidden />
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
};

export default Bienvenue;