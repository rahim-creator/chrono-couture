-- Migration complète pour enrichir le modèle de données des vêtements  
ALTER TABLE wardrobe_items   
ADD COLUMN IF NOT EXISTS brand TEXT,  
ADD COLUMN IF NOT EXISTS size TEXT CHECK (size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),  
ADD COLUMN IF NOT EXISTS material TEXT NOT NULL DEFAULT 'coton' CHECK (material IN ('coton', 'laine', 'polyester', 'lin', 'soie', 'cachemire', 'denim', 'cuir')),  
ADD COLUMN IF NOT EXISTS pattern TEXT NOT NULL DEFAULT 'uni' CHECK (pattern IN ('uni', 'rayé', 'imprimé', 'à pois', 'carreaux', 'floral')),  
ADD COLUMN IF NOT EXISTS fit TEXT NOT NULL DEFAULT 'regular' CHECK (fit IN ('slim', 'regular', 'loose', 'oversized')),  
ADD COLUMN IF NOT EXISTS condition TEXT NOT NULL DEFAULT 'bon' CHECK (condition IN ('neuf', 'bon', 'usé')),  
ADD COLUMN IF NOT EXISTS purchase_date DATE,  
ADD COLUMN IF NOT EXISTS last_worn DATE,  
ADD COLUMN IF NOT EXISTS versatility_score INTEGER DEFAULT 50 CHECK (versatility_score >= 0 AND versatility_score <= 100),  
ADD COLUMN IF NOT EXISTS weight TEXT DEFAULT 'moyen' CHECK (weight IN ('léger', 'moyen', 'épais'));  
  
-- Index pour optimiser les requêtes de recommandations  
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_material ON wardrobe_items(material);  
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_condition ON wardrobe_items(condition);  
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_last_worn ON wardrobe_items(last_worn DESC);