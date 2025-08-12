import React, { useState, useEffect } from "react";
import { X, Settings, Check } from "lucide-react";

export const openCookieSettings = () => {
  window.dispatchEvent(new CustomEvent('openCookieBanner'));
};

const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consents, setConsents] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setIsVisible(true);
    }
    const handler = () => setIsVisible(true);
    window.addEventListener('openCookieBanner', handler);
    return () => window.removeEventListener('openCookieBanner', handler);
  }, []);

  const saveConsent = (type: "all" | "necessary" | "custom") => {
    const consentData = {
      date: new Date().toISOString(),
      consents:
        type === "all"
          ? { necessary: true, analytics: true, marketing: true, preferences: true }
          : type === "necessary"
          ? { necessary: true, analytics: false, marketing: false, preferences: false }
          : consents,
    };

    localStorage.setItem("cookieConsent", JSON.stringify(consentData));

    if ((window as any).gtag) {
      (window as any).gtag("consent", "update", {
        analytics_storage: consentData.consents.analytics ? "granted" : "denied",
        ad_storage: consentData.consents.marketing ? "granted" : "denied",
        functionality_storage: "granted",
        personalization_storage: consentData.consents.preferences ? "granted" : "denied",
        security_storage: "granted",
      });
    }

    if ((window as any).fbq) {
      if (consentData.consents.marketing) {
        (window as any).fbq("consent", "grant");
      } else {
        (window as any).fbq("consent", "revoke");
      }
    }

    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card text-card-foreground shadow-2xl border-t border-border p-6 animate-enter">
      <div className="container">
        {!showDetails ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">🍪 Gestion des cookies</h3>
              <p className="text-sm text-muted-foreground">
                Nous utilisons des cookies pour améliorer votre expérience, analyser notre trafic et personnaliser le contenu.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => saveConsent("necessary")}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition"
              >
                Refuser tout
              </button>
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted flex items-center gap-2 transition"
                aria-expanded={showDetails}
              >
                <Settings className="w-4 h-4" />
                Personnaliser
              </button>
              <button
                onClick={() => saveConsent("all")}
                className="px-6 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Tout accepter
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Personnaliser les cookies</h3>
              <button onClick={() => setShowDetails(false)} aria-label="Fermer le panneau de personnalisation">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <div>
                  <h4 className="font-medium">Cookies essentiels</h4>
                  <p className="text-sm text-muted-foreground">Nécessaires au fonctionnement du site</p>
                </div>
                <input type="checkbox" checked disabled className="w-5 h-5" aria-label="Cookies essentiels activés" />
              </div>

              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <div>
                  <h4 className="font-medium">Cookies analytiques</h4>
                  <p className="text-sm text-muted-foreground">Google Analytics, Hotjar</p>
                </div>
                <input
                  type="checkbox"
                  checked={consents.analytics}
                  onChange={(e) => setConsents({ ...consents, analytics: e.target.checked })}
                  className="w-5 h-5"
                  aria-label="Activer les cookies analytiques"
                />
              </div>

              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <div>
                  <h4 className="font-medium">Cookies marketing</h4>
                  <p className="text-sm text-muted-foreground">Facebook Pixel, Google Ads</p>
                </div>
                <input
                  type="checkbox"
                  checked={consents.marketing}
                  onChange={(e) => setConsents({ ...consents, marketing: e.target.checked })}
                  className="w-5 h-5"
                  aria-label="Activer les cookies marketing"
                />
              </div>

              <div className="flex justify-between items-center p-3 bg-muted rounded">
                <div>
                  <h4 className="font-medium">Cookies de préférences</h4>
                  <p className="text-sm text-muted-foreground">Langue, devise, thème</p>
                </div>
                <input
                  type="checkbox"
                  checked={consents.preferences}
                  onChange={(e) => setConsents({ ...consents, preferences: e.target.checked })}
                  className="w-5 h-5"
                  aria-label="Activer les cookies de préférences"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => saveConsent("custom")}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Sauvegarder mes préférences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieBanner;
