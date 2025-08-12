// Enhanced wardrobe item interface
export interface EnhancedWardrobeItem {
  id: string;
  user_id: string;
  type: 'haut' | 'bas' | 'chaussures';
  color: string;
  season: 'toutes' | 'ete' | 'hiver' | 'mi-saison';
  formality: 'casual' | 'business' | 'sport';
  tags: string[];
  image_path: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  // Nouveaux champs
  brand?: string;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  material: 'coton' | 'laine' | 'polyester' | 'lin' | 'soie' | 'cachemire' | 'denim' | 'cuir';
  pattern: 'uni' | 'rayé' | 'imprimé' | 'à pois' | 'carreaux' | 'floral';
  fit: 'slim' | 'regular' | 'loose' | 'oversized';
  condition: 'neuf' | 'bon' | 'usé';
  purchase_date?: string;
  last_worn?: string;
  versatility_score: number;
  weight: 'léger' | 'moyen' | 'épais';
}

// Legacy type for backwards compatibility
export type WardrobeItem = EnhancedWardrobeItem;