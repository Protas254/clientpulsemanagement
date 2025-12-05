import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, MapPin, Target } from 'lucide-react';
import { rewardRules } from '@/data/rewardsData';

export function RewardRulesCard() {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <ShoppingCart className="w-5 h-5" />;
      case 'visit': return <MapPin className="w-5 h-5" />;
      case 'spending_goal': return <Target className="w-5 h-5" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase': return 'Purchase';
      case 'visit': return 'Visit';
      case 'spending_goal': return 'Spending Goal';
      default: return type;
    }
  };

  return (
    <Card className="bg-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">How to Earn Points</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rewardRules.filter(r => r.isActive).map((rule) => (
            <div
              key={rule.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {getTypeIcon(rule.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">{rule.name}</p>
                  <Badge variant="outline" className="text-xs">{getTypeLabel(rule.type)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rule.description}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">+{rule.pointsAwarded}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
