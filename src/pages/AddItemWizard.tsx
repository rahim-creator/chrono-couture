import React from "react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import UploadDropzone, { UploadResult } from "@/components/UploadDropzone";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sun, Snowflake, CloudSun, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ColorPalettePicker from "@/components/ColorPalettePicker";
import { useImageInsights } from "@/hooks/useImageInsights";
const formSchema = z.object({
  type: z.enum(["haut", "bas", "chaussures"], { required_error: "Type requis" }),
  color: z.string().min(1, "Couleur requise"),
  season: z.enum(["toutes", "ete", "hiver", "mi-saison"], { required_error: "Saison requise" }),
  tags: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AddItemWizard = () => {
  const [uploads, setUploads] = React.useState<UploadResult[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: { type: undefined as unknown as FormValues["type"], color: "#d946ef", season: "toutes", tags: [] },
  });

  const { insights, loading: aiLoading, error: aiError } = useImageInsights(uploads);

  const onSubmit = (values: FormValues) => {
    // For now, just log and simulate save
    console.log("Enregistrement", { values, uploads });
    alert("Vêtement enregistré localement (démo).");
  };

  return (
    <main className="container py-10">
      <SEO title="DressMe — Ajouter un vêtement" description="Ajoutez vos vêtements avec prévisualisation, nettoyage d'arrière-plan et formulaire clair." canonical="/ajout" />
      <h1 className="sr-only">Ajouter un vêtement</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover-scale">
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>Glissez-déposez, multi-upload, retrait d'arrière-plan auto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UploadDropzone autoRemoveBackground onChange={setUploads} />
            <Button variant="outline" type="button" className="w-full" onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]').click()}>
              Scanner l'étiquette (à venir)
            </Button>
            {insights?.pattern && (
              <div className="text-sm text-muted-foreground">
                Motif détecté: <span className="font-medium">{insights.pattern === "uni" ? "Uni" : insights.pattern === "motif" ? "Motif" : "Texturé"}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader>
            <CardTitle>Catégorie & détails</CardTitle>
            <CardDescription>Structure en une colonne, champs clairs, validation en direct</CardDescription>
          </CardHeader>
          <CardContent>
            {insights && (
              <div className="mb-4 rounded-md border p-3 text-sm">
                {insights.categorySuggestion && (
                  <div className="flex items-center gap-2">
                    <span>Catégorie suggérée:</span>
                    <Badge variant="secondary">{insights.categorySuggestion === "haut" ? "Haut" : insights.categorySuggestion === "bas" ? "Bas" : "Chaussures"}</Badge>
                    <Button type="button" size="sm" variant="outline" onClick={() => form.setValue("type", insights.categorySuggestion!)}>Appliquer</Button>
                  </div>
                )}
                {insights.seasonSuggestion && (
                  <div className="mt-2 flex items-center gap-2">
                    <span>Saison suggérée:</span>
                    <Badge variant="secondary">{insights.seasonSuggestion === "ete" ? "Été" : insights.seasonSuggestion === "hiver" ? "Hiver" : insights.seasonSuggestion === "mi-saison" ? "Mi-saison" : "Toutes"}</Badge>
                    <Button type="button" size="sm" variant="outline" onClick={() => form.setValue("season", insights.seasonSuggestion!)}>Appliquer</Button>
                  </div>
                )}
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type <span aria-hidden className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Haut, Bas, Chaussures…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="haut">Haut</SelectItem>
                          <SelectItem value="bas">Bas</SelectItem>
                          <SelectItem value="chaussures">Chaussures</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Choisissez la catégorie principale.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Couleur dominante <span aria-hidden className="text-destructive">*</span></FormLabel>
                      <ColorPalettePicker palette={insights?.palette ?? [field.value]} value={field.value} onChange={(hex) => field.onChange(hex)} />
                      <FormDescription>Choisissez depuis la palette détectée automatiquement.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags suggérés</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {(insights?.tags ?? []).slice(0, 8).map((tag) => {
                          const selected = (field.value ?? []).includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                const curr: string[] = field.value ?? [];
                                field.onChange(selected ? curr.filter((t) => t !== tag) : [...curr, tag]);
                              }}
                              className={`rounded-full border px-3 py-1 text-xs transition ${
                                selected ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"
                              }`}
                              aria-pressed={selected}
                              aria-label={`Tag ${tag}`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                      <FormDescription>Ajoutez des tags pour faciliter la recherche.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="season"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saison <span aria-hidden className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-accent">
                            <RadioGroupItem value="toutes" id="toutes" />
                            <Sparkles className="h-4 w-4" />
                            <span className="text-sm">Toutes</span>
                          </label>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-accent">
                            <RadioGroupItem value="ete" id="ete" />
                            <Sun className="h-4 w-4" />
                            <span className="text-sm">Été</span>
                          </label>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-accent">
                            <RadioGroupItem value="hiver" id="hiver" />
                            <Snowflake className="h-4 w-4" />
                            <span className="text-sm">Hiver</span>
                          </label>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-accent">
                            <RadioGroupItem value="mi-saison" id="mi-saison" />
                            <CloudSun className="h-4 w-4" />
                            <span className="text-sm">Mi-saison</span>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" variant="hero" className="w-full">Enregistrer</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AddItemWizard;