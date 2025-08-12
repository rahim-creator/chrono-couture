import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import heroImg from "@/assets/hero-lifestyle.jpg";
import { Camera, Brain, Sparkles, CloudSun } from "lucide-react";

export default function Landing() {
  return (
    <>
      <SEO
        title="Transformez votre dressing – Consultant mode IA gratuit"
        description="Redécouvrez 40% de votre garde-robe et économisez 600€/an grâce à notre IA mode durable."
        canonical="/"
      />

      <aside className="w-full bg-accent text-accent-foreground text-center text-sm py-2">
        🌱 Application 100% gratuite — Parce que la mode durable doit être accessible à toutes !
      </aside>

      <main>
        {/* Hero */}
        <section className="bg-hero">
          <div className="container grid md:grid-cols-2 gap-8 py-14 md:py-20 items-center">
            <div className="space-y-6 animate-enter">
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
                Transformez votre dressing en consultant mode personnel
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-prose">
                L'IA gratuite qui vous fait redécouvrir 40% de votre garde-robe oubliée et économiser 600€/an.
              </p>
              <div className="flex items-center gap-4">
                <Button asChild size="lg" className="rounded-full px-8 py-6 text-base md:text-lg">
                  <a href="/bienvenue" aria-label="Commencer gratuitement">
                    Commencer gratuitement
                  </a>
                </Button>
                <div className="hidden md:flex items-center gap-2 text-muted-foreground">
                  <CloudSun className="h-5 w-5" aria-hidden />
                  <span>Looks adaptés à la météo</span>
                </div>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden shadow-xl animate-scale-in">
              <img
                src={heroImg}
                alt="Femme souriante devant une armoire ouverte, style lifestyle"
                className="w-full h-auto object-cover"
                loading="eager"
                width={1200}
                height={750}
              />
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-16 md:py-20">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-bold mb-10">Comment ça marche</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <article className="bg-card text-card-foreground rounded-lg p-6 border animate-fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <Camera aria-hidden />
                  </div>
                  <h3 className="font-semibold">Photographiez vos vêtements</h3>
                </div>
                <p className="text-muted-foreground">Ajoutez vos pièces en un clin d'œil depuis votre téléphone.</p>
              </article>

              <article className="bg-card text-card-foreground rounded-lg p-6 border animate-fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <Brain aria-hidden />
                  </div>
                  <h3 className="font-semibold">L'IA analyse et catégorise</h3>
                </div>
                <p className="text-muted-foreground">Organisation automatique par type, couleur et saison.</p>
              </article>

              <article className="bg-card text-card-foreground rounded-lg p-6 border animate-fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <Sparkles aria-hidden />
                  </div>
                  <h3 className="font-semibold">Recevez des looks personnalisés</h3>
                </div>
                <p className="text-muted-foreground">Des idées adaptées à la météo et à votre humeur.</p>
              </article>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="py-16 md:py-20 bg-secondary/50">
          <div className="container">
            <p className="text-sm text-muted-foreground mb-2">
              Rejoignez <strong>500+ utilisatrices</strong> qui économisent en moyenne <strong>600€/an</strong>
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {[{
                name: 'Marie, 28 ans', quote: "J'ai redécouvert 15 pièces que je ne portais plus !"
              }, {
                name: 'Sophie, 34 ans', quote: "Fini le syndrome 'je n'ai rien à me mettre'"
              }, {
                name: 'Clara, 26 ans', quote: 'Mon dressing optimisé, mon budget mode divisé par 2'
              }].map((t, i) => (
                <figure key={i} className="bg-card text-card-foreground rounded-lg p-6 border">
                  <div className="flex items-center gap-3 mb-3">
                    <img src="/placeholder.svg" alt={`Photo de ${t.name}`} className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                    <figcaption className="font-medium">{t.name}</figcaption>
                  </div>
                  <blockquote className="text-muted-foreground">“{t.quote}”</blockquote>
                </figure>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
