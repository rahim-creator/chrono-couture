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
import { useExtendedImageInsights } from "@/hooks/useExtendedImageInsights";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const enhancedFormSchema = z.object({
  type: z.enum(["haut", "bas", "chaussures"], { required_error: "Type requis" }),
  color: z.string().min(1, "Couleur requise"),
  season: z.enum(["toutes", "ete", "hiver", "mi-saison"], { required_error: "Saison requise" }),
  formality: z.enum(["casual", "business", "sport"], { required_error: "Formalité requise" }),
  tags: z.array(z.string()).optional(),
  // Nouveaux champs
  brand: z.string().optional(),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL"]).optional(),
  material: z.enum(["coton", "laine", "polyester", "lin", "soie", "cachemire", "denim", "cuir"]).default("coton"),
  pattern: z.enum(["uni", "rayé", "imprimé", "à pois", "carreaux", "floral"]).default("uni"),
  fit: z.enum(["slim", "regular", "loose", "oversized"]).default("regular"),
  condition: z.enum(["neuf", "bon", "usé"]).default("bon"),
  purchase_date: z.string().optional(),
  versatility_score: z.number().min(0).max(100).default(50),
  weight: z.enum(["léger", "moyen", "épais"]).default("moyen"),
});

type FormValues = z.infer<typeof enhancedFormSchema>;

const AddItemWizard = () => {
  const [uploads, setUploads] = React.useState<UploadResult[]>([]);
  const [newTag, setNewTag] = React.useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(enhancedFormSchema),
    defaultValues: {
      tags: [],
      material: "coton",
      pattern: "uni",
      fit: "regular",
      condition: "bon",
      versatility_score: 50,
      weight: "moyen",
    },
  });

  const { insights } = useExtendedImageInsights(uploads);

  const onSubmit = async (values: FormValues) => {
    try {
      if (!uploads.length) {
        toast.error("Add at least one photo");
        return;
      }

      // Require auth to keep wardrobe private
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) {
        toast.error("Please sign in to save your wardrobe items.");
        return;
      }

      const first = uploads[0];
      const src = first.processedUrl || first.originalUrl;
      const resp = await fetch(src);
      const blob = await resp.blob();
      const ext = (blob.type && blob.type.split('/')[1]) || 'png';
      const fileName = `item-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `${user.id}/${fileName}`;

      // Upload in private storage under user folder
      const { error: upErr } = await supabase.storage
        .from('wardrobe')
        .upload(path, blob, { contentType: blob.type || 'image/png', upsert: false });
      if (upErr) throw upErr;

      // Save metadata (no public URL stored since bucket is private)
      const { error: insErr } = await supabase.from('wardrobe_items').insert({
        user_id: user.id,
        type: values.type,
        color: values.color,
        season: values.season,
        formality: values.formality,
        tags: values.tags ?? [],
        image_path: path,
        // Nouveaux champs
        brand: values.brand,
        size: values.size,
        material: values.material,
        pattern: values.pattern,
        fit: values.fit,
        condition: values.condition,
        purchase_date: values.purchase_date,
        versatility_score: values.versatility_score,
        weight: values.weight,
      });
      if (insErr) throw insErr;

      toast.success("Item saved to your wardrobe");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Unable to save item");
    }
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
              <div className="mb-4 rounded-md border p-3 text-sm space-y-3">
                {/* Bouton de classification automatique complète */}
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => {
                    if (insights.categorySuggestion) form.setValue("type", insights.categorySuggestion);
                    if (insights.seasonSuggestion) form.setValue("season", insights.seasonSuggestion);
                    if (insights.materialSuggestion) form.setValue("material", insights.materialSuggestion);
                    if (insights.fitSuggestion) form.setValue("fit", insights.fitSuggestion);
                    if (insights.conditionSuggestion) form.setValue("condition", insights.conditionSuggestion);
                    if (insights.patternSuggestion) form.setValue("pattern", insights.patternSuggestion);
                    if (insights.weightSuggestion) form.setValue("weight", insights.weightSuggestion);
                    if (insights.brandSuggestion) form.setValue("brand", insights.brandSuggestion);
                    toast.success("Classification automatique appliquée");
                  }}
                >
                  🤖 Classification automatique complète
                </Button>

                {/* Suggestions individuelles */}
                <div className="grid grid-cols-1 gap-2">
                  {insights.categorySuggestion && (
                    <div className="flex items-center gap-2">
                      <span>Catégorie:</span>
                      <Badge variant="secondary">{insights.categorySuggestion}</Badge>
                      <Button type="button" size="sm" variant="outline" 
                        onClick={() => form.setValue("type", insights.categorySuggestion!)}>
                        Appliquer
                      </Button>
                    </div>
                  )}
                  
                  {insights.materialSuggestion && (
                    <div className="flex items-center gap-2">
                      <span>Matière:</span>
                      <Badge variant="secondary">{insights.materialSuggestion}</Badge>
                      <Button type="button" size="sm" variant="outline" 
                        onClick={() => form.setValue("material", insights.materialSuggestion!)}>
                        Appliquer
                      </Button>
                    </div>
                  )}
                  
                  {insights.brandSuggestion && (
                    <div className="flex items-center gap-2">
                      <span>Marque:</span>
                      <Badge variant="secondary">{insights.brandSuggestion}</Badge>
                      <Button type="button" size="sm" variant="outline" 
                        onClick={() => form.setValue("brand", insights.brandSuggestion!)}>
                        Appliquer
                      </Button>
                    </div>
                  )}
                  
                  {insights.conditionSuggestion && (
                    <div className="flex items-center gap-2">
                      <span>État:</span>
                      <Badge variant="secondary">{insights.conditionSuggestion}</Badge>
                      <Button type="button" size="sm" variant="outline" 
                        onClick={() => form.setValue("condition", insights.conditionSuggestion!)}>
                        Appliquer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, () => toast.error("Veuillez remplir les champs obligatoires"))} className="grid gap-5">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type <span aria-hidden className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <ColorPalettePicker palette={(insights?.palette && insights.palette.length > 0) ? insights.palette : ['#111827','#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#f5f5f5']} value={field.value} onChange={(hex) => field.onChange(hex)} />
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
                      {(field.value ?? []).length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {(field.value ?? []).map((tag) => (
                            <Badge key={tag} variant="secondary" className="pl-2">
                              {tag}
                              <button
                                type="button"
                                className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20"
                                aria-label={`Retirer ${tag}`}
                                onClick={() => field.onChange((field.value ?? []).filter((t) => t !== tag))}
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
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
                              className={`rounded-full border px-3 py-1 text-xs transition ${selected ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}
                              aria-pressed={selected}
                              aria-label={`Tag ${tag}`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Ajouter un tag…"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newTag.trim()) {
                              e.preventDefault();
                              const curr: string[] = field.value ?? [];
                              const next = curr.includes(newTag.trim()) ? curr : [...curr, newTag.trim()];
                              field.onChange(next);
                              setNewTag("");
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            if (!newTag.trim()) return;
                            const curr: string[] = field.value ?? [];
                            const next = curr.includes(newTag.trim()) ? curr : [...curr, newTag.trim()];
                            field.onChange(next);
                            setNewTag("");
                          }}
                        >
                          Ajouter
                        </Button>
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
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

                <FormField
                  control={form.control}
                  name="formality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style <span aria-hidden className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-3 gap-3">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-accent">
                            <RadioGroupItem value="casual" id="casual" />
                            <span className="text-sm">Décontracté</span>
                          </label>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-accent">
                            <RadioGroupItem value="business" id="business" />
                            <span className="text-sm">Professionnel</span>
                          </label>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-accent">
                            <RadioGroupItem value="sport" id="sport" />
                            <span className="text-sm">Sport</span>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>Définit le niveau de formalité du vêtement.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                 />

                {/* Section Détails physiques */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium">Détails physiques</h3>
                  
                  <FormField
                    control={form.control}
                    name="material"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Matière <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="coton">Coton</SelectItem>
                            <SelectItem value="laine">Laine</SelectItem>
                            <SelectItem value="polyester">Polyester</SelectItem>
                            <SelectItem value="lin">Lin</SelectItem>
                            <SelectItem value="soie">Soie</SelectItem>
                            <SelectItem value="cachemire">Cachemire</SelectItem>
                            <SelectItem value="denim">Denim</SelectItem>
                            <SelectItem value="cuir">Cuir</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pattern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motif</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="uni">Uni</SelectItem>
                              <SelectItem value="rayé">Rayé</SelectItem>
                              <SelectItem value="imprimé">Imprimé</SelectItem>
                              <SelectItem value="à pois">À pois</SelectItem>
                              <SelectItem value="carreaux">Carreaux</SelectItem>
                              <SelectItem value="floral">Floral</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coupe</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="slim">Slim</SelectItem>
                              <SelectItem value="regular">Regular</SelectItem>
                              <SelectItem value="loose">Loose</SelectItem>
                              <SelectItem value="oversized">Oversized</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Épaisseur</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="léger">Léger</SelectItem>
                            <SelectItem value="moyen">Moyen</SelectItem>
                            <SelectItem value="épais">Épais</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Section Informations complémentaires */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium">Informations complémentaires</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marque</FormLabel>
                          <FormControl>
                            <Input placeholder="Zara, H&M, Nike..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taille</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="XS, S, M..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="XS">XS</SelectItem>
                              <SelectItem value="S">S</SelectItem>
                              <SelectItem value="M">M</SelectItem>
                              <SelectItem value="L">L</SelectItem>
                              <SelectItem value="XL">XL</SelectItem>
                              <SelectItem value="XXL">XXL</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>État</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="neuf">Neuf</SelectItem>
                            <SelectItem value="bon">Bon état</SelectItem>
                            <SelectItem value="usé">Usé</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchase_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'achat</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            placeholder="YYYY-MM-DD"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="versatility_score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Score de polyvalence (0-100)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 50)}
                          />
                        </FormControl>
                        <FormDescription>
                          Évaluez la facilité d'association de ce vêtement (50 = moyen)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
