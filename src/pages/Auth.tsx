import React, { useEffect, useState } from "react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/lib/auth";

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login'|'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Keep session in sync and redirect if already authed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Force clean navigation after auth
        window.location.href = "/";
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const redirectUrl = `${window.location.origin}/`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Connexion réussie');
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err?.message || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
      if (data?.user) {
        toast.success("Vérifiez votre email pour confirmer l'inscription");
      } else {
        toast.success('Inscription initiée, vérifiez votre email');
      }
    } catch (err: any) {
      toast.error(err?.message || "Inscription impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-10">
      <SEO title="DressMe — Authentification" description="Connectez-vous ou créez un compte pour sauvegarder vos vêtements." canonical="/auth" />
      <h1 className="sr-only">Authentification</h1>

      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{mode === 'login' ? 'Se connecter' : 'Créer un compte'}</CardTitle>
            <CardDescription>
              {mode === 'login' ? 'Accédez à votre garde-robe sécurisée.' : 'Créez un compte pour sauvegarder vos vêtements.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Veuillez patienter…' : (mode === 'login' ? 'Se connecter' : "S'inscrire")}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full">
                {mode === 'login' ? "Créer un compte" : 'Déjà un compte ? Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Auth;
