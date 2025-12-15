import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Percent, Banknote, Sparkles, Pencil, Trash2, Pause, Play } from 'lucide-react';
import { Reward } from '@/types/rewards';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RewardCardProps {
  reward: Reward;
  onEdit: (reward: Reward) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number) => void;
}

export function RewardCard({ reward, onEdit, onDelete, onToggleStatus }: RewardCardProps) {
  const getTypeIcon = () => {
    switch (reward.type) {
      case 'gift': return <Gift className="w-6 h-6" />;
      case 'discount': return <Percent className="w-6 h-6" />;
      case 'cashback': return <Banknote className="w-6 h-6" />;
      case 'free_service': return <Sparkles className="w-6 h-6" />;
    }
  };

  const getStatusColor = () => {
    switch (reward.status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'disabled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  return (
    <Card className={cn(
      "bg-card border-border/50 hover:shadow-lg transition-all",
      reward.status === 'disabled' && "opacity-60"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {getTypeIcon()}
          </div>
          <Badge className={getStatusColor()}>{reward.status}</Badge>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-1">{reward.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Points Required:</span>
            <span className="font-semibold text-primary">{reward.points_required} ⭐</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Value:</span>
            <span className="font-medium text-foreground">{reward.value}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expires:</span>
            <span className="text-foreground">{reward.expiry_date ? format(new Date(reward.expiry_date), 'MMM dd, yyyy') : 'No Expiry'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Times Redeemed:</span>
            <span className="text-foreground">{reward.times_redeemed}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(reward)}>
          <Pencil className="w-4 h-4 mr-1" /> Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => onToggleStatus(reward.id)}>
          {reward.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => onDelete(reward.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
