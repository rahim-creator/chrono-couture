import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MapPin, Thermometer, RefreshCw } from "lucide-react";
import SEO from "@/components/SEO";
import { useWeather } from "@/hooks/useWeather";
import { toast } from "sonner";
import StatsSection from "@/components/StatsSection";

const moods = [
  { value: "neutre", label: "Neutre" },
  { value: "énergique", label: "Énergique" },
  { value: "calme", label: "Calme" },
  { value: "confiant", label: "Confiant" },
];

const events = [
  { value: "travail", label: "Travail" },
  { value: "rdv", label: "Rendez-vous" },
  { value: "soirée", label: "Soirée" },
  { value: "sport", label: "Sport" },
  { value: "voyage", label: "Voyage" },
];

const Index = () => {
  const navigate = useNavigate();
  const { ctx: weatherCtx, loading: weatherLoading, error: weatherError, refresh } = useWeather();
  
  // États pour les champs du formulaire
  const [city, setCity] = useState("");
  const [temp, setTemp] = useState<number | ''>('');
  const [mood, setMood] = useState("neutre");
  const [event, setEvent] = useState("travail");
  const [useAutoWeather, setUseAutoWeather] = useState(true);

  // Synchroniser avec les données météo automatiques
  useEffect(() => {
    if (weatherCtx && useAutoWeather) {
      if (weatherCtx.city) setCity(weatherCtx.city);
      if (typeof weatherCtx.temp === 'number') setTemp(weatherCtx.temp);
      if (weatherCtx.mood) setMood(weatherCtx.mood);
      if (weatherCtx.event) setEvent(weatherCtx.event);
    }
  }, [weatherCtx, useAutoWeather]);

  const handlePropose = () => {
    const context = { 
      city: city || weatherCtx?.city || "Local", 
      temp: temp === '' ? (weatherCtx?.temp || null) : Number(temp), 
      mood, 
      event, 
      date: new Date().toISOString() 
    };
    sessionStorage.setItem("dressme:context", JSON.stringify(context));
    navigate("/recommandations");
  };

  const refreshWeather = () => {
    if (refresh) {
      refresh();
    } else {
      window.location.reload(); // Fallback si refresh n'est pas disponible
    }
  };

  return (
    <main>
      <SEO title="DressMe — Dashboard quotidien" description="Déclarez votre humeur, météo et événement pour obtenir des recommandations de tenues instantanées." canonical="/" />

      <section className="bg-hero animate-fade-in">
        <div className="container py-14" onMouseMove={(e) => {
          const el = e.currentTarget as HTMLElement;
          const rect = el.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          el.style.setProperty('--x', x + '%');
          el.style.setProperty('--y', y + '%');
        }}>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Recommandations de tenues personnalisées</h1>
            <p className="mt-3 text-lg text-muted-foreground">Dites-nous votre humeur, la météo et votre contexte. DressMe s'occupe du look.</p>
            <div className="mt-6 flex justify-center">
              <Button variant="hero" size="lg" onClick={handlePropose} aria-label="Proposer une tenue maintenant">
                Proposer une tenue
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-6 py-10 md:grid-cols-3">
        {/* Carte Météo avec API automatique */}
        <Card className="group">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Météo
                </CardTitle>
                <CardDescription>Localisation et température</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshWeather}
                  disabled={weatherLoading}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${weatherLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-weather"
                checked={useAutoWeather}
                onCheckedChange={setUseAutoWeather}
              />
              <Label htmlFor="auto-weather" className="text-sm">
                Détection automatique
              </Label>
            </div>

            {weatherError && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {weatherError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="city">Ville</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="city" 
                  placeholder={useAutoWeather ? (weatherCtx?.city || "Détection...") : "Paris, Lyon..."} 
                  value={useAutoWeather ? (weatherCtx?.city || "") : city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={useAutoWeather}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="temp">Température (°C)</Label>
              <div className="relative">
                <Thermometer className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="temp" 
                  type="number" 
                  placeholder={useAutoWeather ? (weatherCtx?.temp?.toString() || "Auto") : "Auto"}
                  value={useAutoWeather ? (weatherCtx?.temp || '') : (temp ?? '')}
                  onChange={(e) => setTemp(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={useAutoWeather}
                  className="pl-9"
                />
              </div>
            </div>

            {weatherCtx?.mood && useAutoWeather && (
              <div className="text-xs text-muted-foreground bg-accent/50 p-2 rounded">
                Conditions détectées : {weatherCtx.mood}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carte Humeur */}
        <Card>
          <CardHeader>
            <CardTitle>Humeur</CardTitle>
            <CardDescription>Comment vous sentez-vous ?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Choisir</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger aria-label="Sélectionner une humeur">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {moods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Carte Événement */}
        <Card>
          <CardHeader>
            <CardTitle>Événement</CardTitle>
            <CardDescription>Le contexte du jour</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Choisir</Label>
            <Select value={event} onValueChange={setEvent}>
              <SelectTrigger aria-label="Sélectionner un événement">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {events.map((ev) => (
                  <SelectItem key={ev.value} value={ev.value}>{ev.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </section>

      <section className="container pb-14">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Statistiques rapides</h2>
          <p className="text-muted-foreground">Aperçu de votre garde-robe et utilisation</p>
        </div>
        <StatsSection />
      </section>
    </main>
  );
};

export default Index;