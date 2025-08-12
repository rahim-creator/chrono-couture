import SEOHead from "@/components/SEOHead";

const MentionsLegales = () => {
  return (
    <main className="container py-10">
      <SEOHead
        title="Mentions légales - Chrono Couture"
        description="Mentions légales et informations obligatoires du site Chrono Couture."
        url="https://chrono-couture.lovable.app/mentions-legales"
      />

      {/* Mentions légales complètes */}
      <div className="legal-content max-w-4xl mx-auto p-8 bg-card text-card-foreground border rounded-lg">
        <h1 className="text-3xl font-bold mb-6">Mentions Légales</h1>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Éditeur du site</h2>
          <p className="text-muted-foreground">
            Raison sociale : [NOM ENTREPRISE]<br />
            Forme juridique : [SAS/SARL/etc.]<br />
            Capital social : [MONTANT]€<br />
            Siège social : [ADRESSE COMPLÈTE]<br />
            RCS : [VILLE + NUMÉRO]<br />
            TVA Intracommunautaire : [NUMÉRO]<br />
            Email : contact@chrono-couture.fr<br />
            Téléphone : [NUMÉRO]
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Directeur de publication</h2>
          <p className="text-muted-foreground">[NOM PRÉNOM] - [FONCTION]</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Hébergement</h2>
          <p className="text-muted-foreground">
            Lovable.dev / Netlify<br />
            2325 3rd Street, Suite 296<br />
            San Francisco, CA 94107<br />
            United States
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Propriété intellectuelle</h2>
          <p className="text-muted-foreground">
            L'ensemble du contenu de ce site est protégé par le droit d'auteur...
          </p>
        </section>
      </div>
    </main>
  );
};

export default MentionsLegales;
