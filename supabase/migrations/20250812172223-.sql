-- Vue pour les statistiques d'utilisation de la garde-robe
CREATE OR REPLACE VIEW public.wardrobe_stats AS
SELECT 
  user_id,
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE type = 'haut') as tops_count,
  COUNT(*) FILTER (WHERE type = 'bas') as bottoms_count,
  COUNT(*) FILTER (WHERE type = 'chaussures') as shoes_count,
  COUNT(*) FILTER (WHERE formality = 'casual') as casual_count,
  COUNT(*) FILTER (WHERE formality = 'business') as business_count,
  COUNT(*) FILTER (WHERE formality = 'sport') as sport_count,
  COUNT(*) FILTER (WHERE season = 'ete') as summer_count,
  COUNT(*) FILTER (WHERE season = 'hiver') as winter_count,
  COUNT(*) FILTER (WHERE season = 'mi-saison') as mid_season_count,
  COUNT(*) FILTER (WHERE season = 'toutes') as all_season_count,
  array_agg(DISTINCT color ORDER BY color) as colors_used,
  MAX(created_at) as last_added
FROM public.wardrobe_items
GROUP BY user_id;

-- Vue pour les statistiques d'historique
CREATE OR REPLACE VIEW public.outfit_stats AS
SELECT 
  user_id,
  COUNT(*) as total_outfits,
  AVG(rating) as avg_rating,
  COUNT(*) FILTER (WHERE rating >= 4) as high_rated_count,
  COUNT(*) FILTER (WHERE (context->>'event') = 'travail') as work_outfits,
  COUNT(*) FILTER (WHERE (context->>'event') = 'sport') as sport_outfits,
  COUNT(*) FILTER (WHERE (context->>'event') = 'soirée') as evening_outfits,
  MAX(worn_date) as last_outfit_date,
  COUNT(DISTINCT worn_date) as days_with_outfits
FROM public.outfit_history
GROUP BY user_id;

-- Activer RLS sur les vues
ALTER VIEW public.wardrobe_stats SET (security_invoker = true);
ALTER VIEW public.outfit_stats SET (security_invoker = true);