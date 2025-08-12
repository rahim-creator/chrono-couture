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
      <div className="legal-content max-w-4xl mx-auto p-8">
        <h1>Mentions Légales</h1>
        
        <section>
          <h2>Éditeur du site</h2>
          <p>
            Raison sociale : [NOM ENTREPRISE]
            Forme juridique : [SAS/SARL/etc.]
            Capital social : [MONTANT]€
            Siège social : [ADRESSE COMPLÈTE]
            RCS : [VILLE + NUMÉRO]
            TVA Intracommunautaire : [NUMÉRO]
            Email : contact@chrono-couture.fr
            Téléphone : [NUMÉRO]
          </p>
        </section>
        
        <section>
          <h2>Directeur de publication</h2>
          <p>[NOM PRÉNOM] - [FONCTION]</p>
        </section>
        
        <section>
          <h2>Hébergement</h2>
          <p>
            Lovable.dev / Netlify
            2325 3rd Street, Suite 296
            San Francisco, CA 94107
            United States
          </p>
        </section>
        
        <section>
          <h2>Propriété intellectuelle</h2>
          <p>L'ensemble du contenu de ce site est protégé par le droit d'auteur...</p>
        </section>
      </div>
    </main>
  );
};

export default MentionsLegales;
