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
  // Nouveaux champs enrichis
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

export interface ExtendedImageInsights {
  // Insights existants
  categorySuggestion?: 'haut' | 'bas' | 'chaussures';
  seasonSuggestion?: 'ete' | 'hiver' | 'mi-saison' | 'toutes';
  palette?: string[];
  tags?: string[];
  pattern?: string;
  
  // Nouveaux insights IA
  materialSuggestion?: 'coton' | 'laine' | 'polyester' | 'lin' | 'soie' | 'cachemire' | 'denim' | 'cuir';
  fitSuggestion?: 'slim' | 'regular' | 'loose' | 'oversized';
  brandSuggestion?: string;
  conditionSuggestion?: 'neuf' | 'bon' | 'usé';
  sizeSuggestion?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  weightSuggestion?: 'léger' | 'moyen' | 'épais';
  patternSuggestion?: 'uni' | 'rayé' | 'imprimé' | 'à pois' | 'carreaux' | 'floral';
}

export interface EnhancedLook {
  id: string;
  items: EnhancedWardrobeItem[];
  note: string;
  compatibilityScore: number;
  weatherScore: number;
  styleScore: number;
}