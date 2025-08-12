-- Migration: Enrichir le modèle de données des vêtements  
ALTER TABLE wardrobe_items   
ADD COLUMN brand TEXT,  
ADD COLUMN size TEXT CHECK (size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),  
ADD COLUMN material TEXT NOT NULL DEFAULT 'coton' CHECK (material IN ('coton', 'laine', 'polyester', 'lin', 'soie', 'cachemire', 'denim', 'cuir')),  
ADD COLUMN pattern TEXT NOT NULL DEFAULT 'uni' CHECK (pattern IN ('uni', 'rayé', 'imprimé', 'à pois', 'carreaux', 'floral')),  
ADD COLUMN fit TEXT NOT NULL DEFAULT 'regular' CHECK (fit IN ('slim', 'regular', 'loose', 'oversized')),  
ADD COLUMN condition TEXT NOT NULL DEFAULT 'bon' CHECK (condition IN ('neuf', 'bon', 'usé')),  
ADD COLUMN purchase_date DATE,  
ADD COLUMN last_worn DATE,  
ADD COLUMN versatility_score INTEGER DEFAULT 50 CHECK (versatility_score >= 0 AND versatility_score <= 100),  
ADD COLUMN weight TEXT DEFAULT 'moyen' CHECK (weight IN ('léger', 'moyen', 'épais'));