import type { EnhancedWardrobeItem, EnhancedLook } from '@/types/enhanced-wardrobe';

interface Context {
  temp?: number;
  event?: string;
  mood?: string;
  weather?: string;
}

interface UserPreferences {
  favoriteColors: string[];
  preferredBrands: string[];
  stylePreference: 'casual' | 'business' | 'sport';
}

export function generateEnhancedLooks(
  ctx: Context, 
  wardrobe: EnhancedWardrobeItem[], 
  preferences: UserPreferences,
  n = 3
): EnhancedLook[] {
  if (wardrobe.length === 0) return getEmptyState();
  
  // Filtres avancés basés sur les nouveaux attributs
  const filterByMaterial = (g: EnhancedWardrobeItem) => {
    if (!ctx.temp) return true;
    if (ctx.temp < 10) return ['laine', 'cachemire'].includes(g.material);
    if (ctx.temp > 25) return ['coton', 'lin', 'soie'].includes(g.material);
    return !['laine', 'cachemire'].includes(g.material) || ctx.temp >= 15;
  };
  
  const filterByCondition = (g: EnhancedWardrobeItem) => {
    if (ctx.event === 'travail') return g.condition !== 'usé';
    return true;
  };
  
  const filterByFreshness = (g: EnhancedWardrobeItem) => {
    if (!g.last_worn) return true;
    const daysSince = (Date.now() - new Date(g.last_worn).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 3; // Éviter les vêtements portés récemment
  };
  
  const filterByWeather = (g: EnhancedWardrobeItem) => {
    if (ctx.weather === 'rain' && g.material === 'soie') return false;
    if (ctx.weather === 'snow' && g.weight === 'léger') return false;
    return true;
  };
  
  // Score sophistiqué multi-critères
  const scoreGarmentEnhanced = (g: EnhancedWardrobeItem): number => {
    let score = 50; // Score de base

    // Score de condition
    if (g.condition === 'neuf') score += 20;
    else if (g.condition === 'bon') score += 10;
    else score -= 10;

    // Score de polyvalence
    score += g.versatility_score * 0.3;

    // Score de fraîcheur (éviter les vêtements portés récemment)
    if (g.last_worn) {
      const daysSince = (Date.now() - new Date(g.last_worn).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.min(daysSince * 2, 30);
    } else {
      score += 15; // Bonus pour les vêtements jamais portés
    }

    // Score de préférence utilisateur
    if (preferences.favoriteColors.includes(g.color)) score += 15;
    if (preferences.preferredBrands.includes(g.brand || '')) score += 10;
    if (preferences.stylePreference === g.formality) score += 20;

    // Score météo
    if (ctx.temp) {
      if (ctx.temp < 10 && ['laine', 'cachemire'].includes(g.material)) score += 25;
      if (ctx.temp > 25 && ['coton', 'lin', 'soie'].includes(g.material)) score += 25;
      if (ctx.temp >= 10 && ctx.temp <= 25 && g.weight === 'moyen') score += 15;
    }

    return Math.max(0, score);
  };
  
  // Pool filtré
  const pool = wardrobe.filter(g => 
    filterByMaterial(g) && 
    filterByCondition(g) && 
    filterByFreshness(g) &&
    filterByWeather(g)
  );
  
  const pickBestEnhanced = (type: EnhancedWardrobeItem["type"], excludeIds: string[] = []) => {
    const candidates = pool
      .filter((g) => g.type === type && !excludeIds.includes(g.id))
      .sort((a, b) => scoreGarmentEnhanced(b) - scoreGarmentEnhanced(a));
      
    return candidates.length > 0 ? candidates[0] : null;
  };
  
  // Génération des looks avec diversité
  const looks: EnhancedLook[] = [];
  const usedItems = new Set<string>();
  
  for (let i = 0; i < n; i++) {
    const top = pickBestEnhanced("haut", Array.from(usedItems));
    const bottom = pickBestEnhanced("bas", Array.from(usedItems));
    const shoes = pickBestEnhanced("chaussures", Array.from(usedItems));

    const items = [top, bottom, shoes].filter(Boolean) as EnhancedWardrobeItem[];
    if (items.length === 0) break;

    // Marquer les items comme utilisés pour éviter la répétition
    items.forEach(item => usedItems.add(item.id));

    // Calcul des scores de compatibilité
    const compatibilityScore = calculateCompatibilityScore(items);
    const weatherScore = calculateWeatherScore(items, ctx);
    const styleScore = calculateStyleScore(items);

    const note = generateContextualNote(ctx, items);
    
    looks.push({ 
      id: `enhanced-${i}`, 
      items, 
      note,
      compatibilityScore,
      weatherScore,
      styleScore
    });
  }
  
  return looks.length > 0 ? looks : getInsufficientItemsState();
}

function calculateCompatibilityScore(items: EnhancedWardrobeItem[]): number {
  let score = 100;
  
  // Vérifier la cohérence des marques
  const brands = items.map(i => i.brand).filter(Boolean);
  if (brands.length > 1) {
    const luxuryBrands = ['GUCCI', 'PRADA', 'LOUIS VUITTON', 'CHANEL', 'DIOR'];
    const casualBrands = ['ZARA', 'H&M', 'UNIQLO', 'GAP'];
    
    const hasLuxury = brands.some(b => luxuryBrands.includes(b!));
    const hasCasual = brands.some(b => casualBrands.includes(b!));
    
    if (hasLuxury && hasCasual) score -= 20; // Mélange incohérent
  }

  // Vérifier la cohérence des coupes
  const fits = items.map(i => i.fit);
  if (fits.includes('oversized') && fits.includes('slim')) score -= 15;

  // Vérifier la cohérence des motifs
  const patterns = items.map(i => i.pattern);
  const complexPatterns = patterns.filter(p => p !== 'uni').length;
  if (complexPatterns > 1) score -= 10; // Éviter trop de motifs

  return Math.max(0, score);
}

function calculateWeatherScore(items: EnhancedWardrobeItem[], ctx: Context): number {
  let score = 100;
  
  if (ctx.temp) {
    items.forEach(item => {
      if (ctx.temp! < 10) {
        if (item.weight === 'léger') score -= 20;
        if (['laine', 'cachemire'].includes(item.material)) score += 10;
      } else if (ctx.temp! > 25) {
        if (item.weight === 'épais') score -= 20;
        if (['coton', 'lin', 'soie'].includes(item.material)) score += 10;
      }
    });
  }

  return Math.max(0, score);
}

function calculateStyleScore(items: EnhancedWardrobeItem[]): number {
  let score = 100;
  
  // Vérifier la cohérence de formalité
  const formalities = items.map(i => i.formality);
  const uniqueFormalities = [...new Set(formalities)];
  
  if (uniqueFormalities.length > 2) score -= 25; // Trop de styles différents
  if (formalities.includes('sport') && formalities.includes('business')) score -= 30;

  return Math.max(0, score);
}

function generateContextualNote(ctx: Context, items: EnhancedWardrobeItem[]): string {
  const materials = items.map(i => i.material);
  const hasWool = materials.includes('laine') || materials.includes('cachemire');
  const hasLight = materials.includes('coton') || materials.includes('lin');
  const brands = items.map(i => i.brand).filter(Boolean);
  
  if (typeof ctx.temp === 'number') {
    if (ctx.temp < 10 && hasWool) {
      return `Parfait pour le froid — matières chaudes${brands.length > 0 ? ` (${brands.join(', ')})` : ''}`;
    }
    if (ctx.temp > 25 && hasLight) {
      return `Idéal pour la chaleur — matières respirantes${brands.length > 0 ? ` (${brands.join(', ')})` : ''}`;
    }
  }
  
  if (ctx.event === "travail") {
    const businessItems = items.filter(i => i.formality === 'business');
    return businessItems.length > 1 ? "Look professionnel cohérent" : "Business casual adapté";
  }
  
  const conditions = items.map(i => i.condition);
  if (conditions.every(c => c === 'neuf')) {
    return "Look impeccable avec vêtements neufs";
  }
  
  return "Association harmonieuse et confortable";
}

function getEmptyState(): EnhancedLook[] {
  return [{
    id: "empty",
    items: [],
    note: "Ajoutez des vêtements à votre garde-robe pour obtenir des recommandations personnalisées !",
    compatibilityScore: 0,
    weatherScore: 0,
    styleScore: 0
  }];
}

function getInsufficientItemsState(): EnhancedLook[] {
  return [{
    id: "insufficient",
    items: [],
    note: "Ajoutez plus de vêtements variés pour obtenir de meilleures recommandations.",
    compatibilityScore: 0,
    weatherScore: 0,
    styleScore: 0
  }];
}