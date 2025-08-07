import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SEO from "@/components/SEO";

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
  const [city, setCity] = useState("");
  const [temp, setTemp] = useState<number | ''>('');
  const [mood, setMood] = useState("neutre");
  const [event, setEvent] = useState("travail");

  const handlePropose = () => {
    const context = { city, temp: temp === '' ? null : Number(temp), mood, event, date: new Date().toISOString() };
    sessionStorage.setItem("dressme:context", JSON.stringify(context));
    navigate("/recommandations");
  };

  return (
    <main>
      <SEO title="DressMe — Dashboard quotidien" description="Déclarez votre humeur, météo et événement pour obtenir des recommandations de tenues instantanées." canonical="/" />

      <section className="bg-hero">
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
              <Button variant="hero" size="lg" onClick={handlePropose} aria-label="Proposer une tenue maintenant">Proposer une tenue</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-6 py-10 md:grid-cols-3">
        <Card className="group">
          <CardHeader>
            <CardTitle>Météo</CardTitle>
            <CardDescription>Ville et température</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" placeholder="Paris, Lyon..." value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="temp">Température (°C)</Label>
              <Input id="temp" type="number" placeholder="Auto" value={temp ?? ''} onChange={(e) => setTemp(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </CardContent>
        </Card>

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
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">Statistiques rapides</h2>
          <p className="text-muted-foreground mt-1">À venir : fréquence d'utilisation des pièces et looks préférés.</p>
        </div>
      </section>
    </main>
  );
};

export default Index;
