import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Star, Gift, Lock, History, CheckCircle2 } from 'lucide-react';
import { rewards, customerPoints, customerRewards } from '@/data/rewardsData';
import { mockCustomers } from '@/data/mockData';
import { Reward } from '@/types/rewards';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CustomerRewardsWalletProps {
  customerId: string;
}

export function CustomerRewardsWallet({ customerId }: CustomerRewardsWalletProps) {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const customer = mockCustomers.find(c => c.id === customerId);
  const points = customerPoints.find(p => p.customerId === customerId);
  const history = customerRewards.filter(r => r.customerId === customerId);

  const currentPoints = points?.totalPoints || 0;
  const activeRewards = rewards.filter(r => r.status === 'active');

  const handleRedeem = (reward: Reward) => {
    setSelectedReward(reward);
    setShowConfirmation(true);
  };

  const confirmRedeem = () => {
    setShowConfirmation(false);
    setShowSuccess(true);
    toast.success(`${selectedReward?.name} has been redeemed!`);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedReward(null);
    }, 2000);
  };

  const nextReward = activeRewards.find(r => r.pointsRequired > currentPoints);
  const progressToNext = nextReward ? (currentPoints / nextReward.pointsRequired) * 100 : 100;

  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Points</p>
              <p className="text-4xl font-bold text-foreground">{currentPoints}</p>
            </div>
          </div>
          
          {nextReward && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to {nextReward.name}</span>
                <span className="text-foreground font-medium">{currentPoints} / {nextReward.pointsRequired}</span>
              </div>
              <Progress value={progressToNext} className="h-3" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{points?.lifetimePoints || 0}</p>
              <p className="text-xs text-muted-foreground">Lifetime Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{points?.totalVisits || 0}</p>
              <p className="text-xs text-muted-foreground">Total Visits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">KES {((points?.totalSpent || 0) / 1000).toFixed(0)}k</p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" /> Available Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {activeRewards.map((reward) => {
              const canRedeem = currentPoints >= reward.pointsRequired;
              return (
                <div
                  key={reward.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all",
                    canRedeem 
                      ? "border-primary/30 bg-primary/5 hover:bg-primary/10" 
                      : "border-border/50 bg-muted/30 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {canRedeem ? (
                      <Gift className="w-5 h-5 text-primary" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{reward.name}</p>
                      <p className="text-sm text-muted-foreground">{reward.pointsRequired} points</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={canRedeem ? "chocolate" : "outline"}
                    disabled={!canRedeem}
                    onClick={() => handleRedeem(reward)}
                  >
                    {canRedeem ? 'Redeem' : 'Locked'}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reward History */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-primary" /> Reward History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item) => {
                const reward = rewards.find(r => r.id === item.rewardId);
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <p className="font-medium text-foreground">{reward?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(item.redeemedAt), 'MMM dd, yyyy')} • -{item.pointsUsed} points
                      </p>
                    </div>
                    <Badge className={cn(
                      item.status === 'completed' && "bg-green-100 text-green-800",
                      item.status === 'pending' && "bg-yellow-100 text-yellow-800",
                      item.status === 'cancelled' && "bg-red-100 text-red-800"
                    )}>
                      {item.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">No rewards redeemed yet</p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Redeem Reward</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this reward?
            </DialogDescription>
          </DialogHeader>
          
          {selectedReward && (
            <div className="py-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reward:</span>
                <span className="font-medium text-foreground">{selectedReward.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Points to deduct:</span>
                <span className="font-medium text-primary">{selectedReward.pointsRequired} ⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining points:</span>
                <span className="font-medium text-foreground">{currentPoints - selectedReward.pointsRequired}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="chocolate" onClick={confirmRedeem}>
              Confirm Redemption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-[350px] bg-card border-border text-center">
          <div className="py-6 space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Reward Successfully Redeemed!</h3>
            <p className="text-muted-foreground">{selectedReward?.name} has been added to your account.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
