import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type UserPreferences = {
  first_name: string;
  last_name: string;
  preferred_color: string;
  cold_threshold: number;
  warm_threshold: number;
  preferred_formality: "casual" | "business" | "sport";
};

const Profil = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    first_name: "",
    last_name: "",
    preferred_color: "#d946ef",
    cold_threshold: 10,
    warm_threshold: 25,
    preferred_formality: "casual"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.user.id)
          .maybeSingle();

        if (data && !error) {
          setPreferences({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            preferred_color: data.preferred_color || "#d946ef",
            cold_threshold: data.cold_threshold || 10,
            warm_threshold: data.warm_threshold || 25,
            preferred_formality: (data.preferred_formality as "casual" | "business" | "sport") || "casual"
          });
        }
      } catch (err) {
        console.error('Erreur lors du chargement des préférences:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error("Vous devez être connecté");
        return;
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        toast.error("Erreur lors de la sauvegarde");
      } else {
        toast.success("Préférences sauvegardées avec succès !");
      }
    } catch (err) {
      console.error('Erreur:', err);
      toast.error("Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="container py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement de vos préférences...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-10">
      <SEO title="DressMe — Profil & réglages" description="Gérez vos informations, tailles et préférences de style et de couleurs." canonical="/profil" />
      <h1 className="sr-only">Profil & réglages</h1>

      <div className="max-w-2xl space-y-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>Ces informations vous aideront à personnaliser votre expérience</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  value={preferences.first_name}
                  onChange={(e) => setPreferences(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Votre prénom"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  value={preferences.last_name}
                  onChange={(e) => setPreferences(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Votre nom"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Préférences de style */}
        <Card>
          <CardHeader>
            <CardTitle>Préférences de style</CardTitle>
            <CardDescription>Ces paramètres affineront les recommandations</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="preferred_color">Couleur préférée</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="preferred_color"
                  type="color"
                  value={preferences.preferred_color}
                  onChange={(e) => setPreferences(prev => ({ ...prev, preferred_color: e.target.value }))}
                  className="w-16 h-10"
                />
                <span className="text-sm text-muted-foreground">
                  Cette couleur sera privilégiée dans les recommandations
                </span>
              </div>
            </div>

            <div className="grid gap-3">
              <Label>Style préféré</Label>
              <RadioGroup
                value={preferences.preferred_formality}
                onValueChange={(value: "casual" | "business" | "sport") => 
                  setPreferences(prev => ({ ...prev, preferred_formality: value }))
                }
                className="grid grid-cols-3 gap-3"
              >
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-accent">
                  <RadioGroupItem value="casual" />
                  <span className="text-sm">Décontracté</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-accent">
                  <RadioGroupItem value="business" />
                  <span className="text-sm">Professionnel</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-accent">
                  <RadioGroupItem value="sport" />
                  <span className="text-sm">Sport</span>
                </label>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Préférences météo */}
        <Card>
          <CardHeader>
            <CardTitle>Seuils de température</CardTitle>
            <CardDescription>Définissez vos seuils de confort pour de meilleures recommandations</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cold_threshold">Seuil froid (°C)</Label>
                <Input
                  id="cold_threshold"
                  type="number"
                  value={preferences.cold_threshold}
                  onChange={(e) => setPreferences(prev => ({ ...prev, cold_threshold: parseInt(e.target.value) || 10 }))}
                  placeholder="10"
                  min="0"
                  max="30"
                />
                <p className="text-xs text-muted-foreground">En dessous de cette température, des vêtements chauds seront recommandés</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="warm_threshold">Seuil chaud (°C)</Label>
                <Input
                  id="warm_threshold"
                  type="number"
                  value={preferences.warm_threshold}
                  onChange={(e) => setPreferences(prev => ({ ...prev, warm_threshold: parseInt(e.target.value) || 25 }))}
                  placeholder="25"
                  min="15"
                  max="40"
                />
                <p className="text-xs text-muted-foreground">Au dessus de cette température, des vêtements légers seront recommandés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          variant="hero" 
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? "Sauvegarde..." : "Enregistrer mes préférences"}
        </Button>
      </div>
    </main>
  );
};

export default Profil;