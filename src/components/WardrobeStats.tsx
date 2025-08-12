import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EnhancedWardrobeItem } from '@/types/enhanced-wardrobe';

interface WardrobeStatsProps {
  items: EnhancedWardrobeItem[];
}

export function WardrobeStats({ items }: WardrobeStatsProps) {
  const stats = useMemo(() => {
    const totalItems = items.length;
    const byMaterial = items.reduce((acc, item) => {
      acc[item.material] = (acc[item.material] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byCondition = items.reduce((acc, item) => {
      acc[item.condition] = (acc[item.condition] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const underutilized = items.filter(item => {
      if (!item.last_worn) return true;
      const daysSince = (Date.now() - new Date(item.last_worn).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 30;
    });
    
    const avgVersatility = items.reduce((sum, item) => sum + item.versatility_score, 0) / totalItems;
    
    return {
      totalItems,
      byMaterial,
      byCondition,
      underutilized: underutilized.length,
      avgVersatility: Math.round(avgVersatility || 0)
    };
  }, [items]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
          <p className="text-xs text-muted-foreground">vêtements</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Polyvalence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgVersatility}%</div>
          <p className="text-xs text-muted-foreground">moyenne</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sous-utilisés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.underutilized}</div>
          <p className="text-xs text-muted-foreground">non portés 30j+</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">État général</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 flex-wrap">
            {Object.entries(stats.byCondition).map(([condition, count]) => (
              <Badge key={condition} variant="outline" className="text-xs">
                {condition}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}