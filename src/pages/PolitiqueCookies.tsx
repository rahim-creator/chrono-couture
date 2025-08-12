import SEOHead from "@/components/SEOHead";

const PolitiqueCookies = () => {
  const reopen = () => {
    // Signale au bandeau d'ouvrir la modale de consentement
    window.dispatchEvent(new CustomEvent('openCookieBanner'));
  };

  return (
    <main className="container py-10">
      <SEOHead
        title="Politique de cookies - Chrono Couture"
        description="Informations sur l'utilisation des cookies et gestion des consentements."
        url="https://chrono-couture.lovable.app/politique-cookies"
      />

      <div className="max-w-4xl mx-auto p-8 bg-card text-card-foreground border rounded-lg">
        <h1 className="text-3xl font-bold mb-6">Politique de cookies</h1>
        <p className="text-muted-foreground mb-6">
          Nous utilisons des cookies pour assurer le bon fonctionnement du site, mesurer l'audience, personnaliser votre expérience et proposer des contenus adaptés.
        </p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Catégories de cookies</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li><strong>Essentiels</strong> : nécessaires au fonctionnement du site (non optionnels)</li>
            <li><strong>Analytiques</strong> : mesure d'audience (Google Analytics, Hotjar)</li>
            <li><strong>Marketing</strong> : personnalisation publicitaire (Facebook Pixel, Google Ads)</li>
            <li><strong>Préférences</strong> : langue, devise, thème</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Gérer vos préférences</h2>
          <p className="text-muted-foreground mb-3">
            Vous pouvez modifier vos préférences de consentement à tout moment.
          </p>
          <button onClick={reopen} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition">
            Ouvrir les paramètres cookies
          </button>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Durée de conservation</h2>
          <p className="text-muted-foreground">
            Les cookies sont conservés pour une durée maximale de 13 mois, conformément aux recommandations de la CNIL.
          </p>
        </section>
      </div>
    </main>
  );
};

export default PolitiqueCookies;
