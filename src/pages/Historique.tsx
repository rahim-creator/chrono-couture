import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Historique = () => {
  return (
    <main className="container py-10">
      <SEO title="DressMe — Historique" description="Timeline des tenues portées avec filtres par date, humeur et événement." canonical="/historique" />
      <h1 className="sr-only">Historique</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Jour {i + 1}</CardTitle>
              <CardDescription>Contexte synthétique • Détails bientôt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-24 rounded-md bg-gradient-to-tr from-[hsl(var(--brand)/.12)] to-[hsl(var(--brand-2)/.12)]" aria-hidden />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
};

export default Historique;