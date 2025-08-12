import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

const PolitiqueConfidentialite = () => {
  return (
    <main className="container py-10">
      <SEOHead
        title="Politique de confidentialité - Chrono Couture"
        description="Politique de confidentialité conforme RGPD de Chrono Couture."
        url="https://chrono-couture.lovable.app/politique-confidentialite"
      />

      {/* Politique de confidentialité RGPD complète */}
      <div className="privacy-policy max-w-4xl mx-auto p-8 bg-card text-card-foreground border rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Politique de Confidentialité</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Responsable du traitement</h2>
          <p className="text-muted-foreground">
            [NOM ENTREPRISE] est responsable du traitement de vos données personnelles...
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. Données collectées</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Données d'identité : nom, prénom, email</li>
            <li>Données de connexion : adresse IP, logs</li>
            <li>Données de commande : historique d'achats, adresse de livraison</li>
            <li>Données de navigation : pages visitées, interactions</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. Base légale et finalités</h2>
          <p className="text-muted-foreground">Conformément à l'article 6 du RGPD :</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Exécution du contrat : traitement des commandes</li>
            <li>Intérêt légitime : amélioration de nos services</li>
            <li>Consentement : envoi de newsletters</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">4. Durée de conservation</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Données clients : 3 ans après dernière commande</li>
            <li>Données prospects : 3 ans après collecte</li>
            <li>Cookies : 13 mois maximum</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5. Vos droits</h2>
          <p className="text-muted-foreground">Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Droit d'accès (Article 15 RGPD)</li>
            <li>Droit de rectification (Article 16 RGPD)</li>
            <li>Droit à l'effacement (Article 17 RGPD)</li>
            <li>Droit à la limitation (Article 18 RGPD)</li>
            <li>Droit à la portabilité (Article 20 RGPD)</li>
            <li>Droit d'opposition (Article 21 RGPD)</li>
          </ul>
          <p className="text-muted-foreground mt-2">Pour exercer vos droits : dpo@chrono-couture.fr</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">6. Cookies</h2>
          <p className="text-muted-foreground">
            Voir notre <Link to="/politique-cookies" className="underline">politique de cookies</Link>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. Contact DPO</h2>
          <p className="text-muted-foreground">
            Délégué à la Protection des Données<br />
            Email : dpo@chrono-couture.fr<br />
            Adresse : [ADRESSE]
          </p>
        </section>
      </div>
    </main>
  );
};

export default PolitiqueConfidentialite;
