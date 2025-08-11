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

const formSchema = z.object({
  type: z.enum(["haut", "bas", "chaussures"], { required_error: "Type requis" }),
  color: z.string().min(1, "Couleur requise"),
  season: z.enum(["toutes", "ete", "hiver", "mi-saison"], { required_error: "Saison requise" }),
});

type FormValues = z.infer<typeof formSchema>;

const AddItemWizard = () => {
  const [uploads, setUploads] = React.useState<UploadResult[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: { type: undefined as unknown as FormValues["type"], color: "#d946ef", season: "toutes" },
  });

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
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader>
            <CardTitle>Catégorie & détails</CardTitle>
            <CardDescription>Structure en une colonne, champs clairs, validation en direct</CardDescription>
          </CardHeader>
          <CardContent>
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
                      <div className="flex items-center gap-3">
                        <Input type="color" aria-label="Choisir une couleur" className="h-10 w-14 p-1" value={field.value} onChange={field.onChange} />
                        <Input placeholder="#112233" value={field.value} onChange={field.onChange} />
                      </div>
                      <FormDescription>Utilisez le sélecteur ou saisissez un code HEX.</FormDescription>
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