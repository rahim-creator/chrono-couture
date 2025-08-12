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
        <h1 className="text-3xl font-bold mb-8">Mentions Légales</h1>
        {/* TODO: URGENT - Remplacer tous les placeholders par les vraies données avant mise en production */}

        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-8">
          <p className="text-yellow-700">⚠️ <strong>ATTENTION :</strong> Informations légales incomplètes - À finaliser avant publication</p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Éditeur du site</h2>
          <p className="mb-2">
            <strong>Raison sociale :</strong> <span className="bg-yellow-200">[NOM ENTREPRISE - À COMPLÉTER]</span><br />
            <strong>Forme juridique :</strong> <span className="bg-yellow-200">[SAS/SARL/etc. - À COMPLÉTER]</span><br />
            <strong>Capital social :</strong> <span className="bg-yellow-200">[MONTANT - À COMPLÉTER]</span>€<br />
            <strong>Siège social :</strong> <span className="bg-yellow-200">[ADRESSE COMPLÈTE - À COMPLÉTER]</span><br />
            <strong>RCS :</strong> <span className="bg-yellow-200">[VILLE + NUMÉRO RCS - À COMPLÉTER]</span><br />
            <strong>TVA Intracommunautaire :</strong> <span className="bg-yellow-200">[NUMÉRO TVA - À COMPLÉTER]</span><br />
            <strong>Email :</strong> contact@chrono-couture.fr<br />
            <strong>Téléphone :</strong> <span className="bg-yellow-200">[NUMÉRO - À COMPLÉTER]</span>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Directeur de publication</h2>
          <p><span className="bg-yellow-200">[NOM PRÉNOM - À COMPLÉTER]</span> - <span className="bg-yellow-200">[FONCTION - À COMPLÉTER]</span></p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Hébergement</h2>
          <p>
            Lovable.dev / Netlify<br />
            2325 3rd Street, Suite 296<br />
            San Francisco, CA 94107<br />
            United States
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Propriété intellectuelle</h2>
          <p>L'ensemble du contenu de ce site (textes, images, vidéos, logos, graphismes, etc.) est protégé par le droit d'auteur, le droit des marques et/ou tous autres droits de propriété intellectuelle. Ces éléments sont la propriété exclusive de <span className="bg-yellow-200">[NOM ENTREPRISE - À COMPLÉTER]</span> ou de ses partenaires. Toute reproduction, représentation, adaptation ou exploitation, même partielle, est strictement interdite sans autorisation écrite préalable.</p>
        </section>
      </div>
    </main>
  );
};

export default MentionsLegales;
