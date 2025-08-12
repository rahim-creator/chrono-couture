-- Ajouter le champ formality à la table wardrobe_items
ALTER TABLE public.wardrobe_items 
ADD COLUMN IF NOT EXISTS formality text CHECK (formality IN ('casual', 'business', 'sport')) DEFAULT 'casual';

-- Mettre à jour les éléments existants avec une valeur par défaut intelligente
UPDATE public.wardrobe_items 
SET formality = CASE 
  WHEN 'costume' = ANY(tags) OR 'chemise' = ANY(tags) OR 'blazer' = ANY(tags) THEN 'business'
  WHEN 'sport' = ANY(tags) OR 'jogging' = ANY(tags) OR 'baskets' = ANY(tags) THEN 'sport'
  ELSE 'casual'
END
WHERE formality IS NULL;