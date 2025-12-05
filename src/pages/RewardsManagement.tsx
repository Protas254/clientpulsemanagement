import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { RewardCard } from '@/components/rewards/RewardCard';
import { RewardForm } from '@/components/rewards/RewardForm';
import { rewards as initialRewards } from '@/data/rewardsData';
import { Reward } from '@/types/rewards';
import { toast } from 'sonner';

export default function RewardsManagement() {
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setRewards(rewards.filter(r => r.id !== id));
    toast.success('Reward deleted successfully');
  };

  const handleToggleStatus = (id: string) => {
    setRewards(rewards.map(r => 
      r.id === id 
        ? { ...r, status: r.status === 'active' ? 'disabled' : 'active' } 
        : r
    ));
    toast.success('Reward status updated');
  };

  const handleSave = (rewardData: Partial<Reward>) => {
    if (rewardData.id) {
      // Edit existing
      setRewards(rewards.map(r => 
        r.id === rewardData.id 
          ? { ...r, ...rewardData } as Reward
          : r
      ));
      toast.success('Reward updated successfully');
    } else {
      // Create new
      const newReward: Reward = {
        id: String(Date.now()),
        name: rewardData.name || '',
        description: rewardData.description || '',
        pointsRequired: rewardData.pointsRequired || 0,
        type: rewardData.type || 'gift',
        value: rewardData.value || '',
        expiryDate: rewardData.expiryDate || '',
        status: rewardData.status || 'active',
        createdAt: new Date().toISOString().split('T')[0],
        timesRedeemed: 0,
      };
      setRewards([...rewards, newReward]);
      toast.success('Reward created successfully');
    }
    setEditingReward(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingReward(null);
  };

  return (
    <AppLayout 
      title="Rewards Management" 
      subtitle="Create and manage loyalty rewards"
      action={
        <Button variant="chocolate" onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Reward
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>

      <RewardForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSave}
        reward={editingReward}
      />
    </AppLayout>
  );
}
