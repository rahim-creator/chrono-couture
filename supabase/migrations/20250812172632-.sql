-- Ajouter les colonnes pour les humeurs et événements personnalisés
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS custom_moods text[] DEFAULT ARRAY['neutre', 'énergique', 'calme', 'confiant'];

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS custom_events text[] DEFAULT ARRAY['travail', 'rdv', 'soirée', 'sport', 'voyage'];