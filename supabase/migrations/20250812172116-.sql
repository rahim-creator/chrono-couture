-- Table pour l'historique des tenues portées
CREATE TABLE IF NOT EXISTS public.outfit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worn_date date NOT NULL DEFAULT CURRENT_DATE,
  context jsonb NOT NULL DEFAULT '{}', -- Stocke city, temp, mood, event
  items uuid[] NOT NULL DEFAULT '{}', -- Array des IDs des wardrobe_items
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_outfit_history_user_date ON public.outfit_history(user_id, worn_date DESC);
CREATE INDEX IF NOT EXISTS idx_outfit_history_user_rating ON public.outfit_history(user_id, rating DESC);

-- Activer RLS
ALTER TABLE public.outfit_history ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Users can view own outfit history"
  ON public.outfit_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfit history"
  ON public.outfit_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outfit history"
  ON public.outfit_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfit history"
  ON public.outfit_history FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE TRIGGER trg_outfit_history_updated_at
BEFORE UPDATE ON public.outfit_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();