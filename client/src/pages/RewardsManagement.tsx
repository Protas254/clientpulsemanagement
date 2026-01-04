import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Gift } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { RewardCard } from '@/components/rewards/RewardCard';
import { RewardForm } from '@/components/rewards/RewardForm';
import { fetchRewards, createReward, updateReward, deleteReward, Reward, fetchCustomers, redeemReward } from '@/services/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RewardsManagement() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const data = await fetchRewards();
      setRewards(data);
    } catch (error) {
      toast.error('Failed to load rewards');
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReward(id);
      setRewards(rewards.filter(r => r.id !== id));
      toast.success('Reward deleted successfully');
    } catch (error) {
      toast.error('Failed to delete reward');
    }
  };

  const handleToggleStatus = async (id: string) => {
    const reward = rewards.find(r => r.id === id);
    if (!reward) return;

    const newStatus = reward.status === 'active' ? 'disabled' : 'active';
    try {
      await updateReward(id, { status: newStatus });
      setRewards(rewards.map(r =>
        r.id === id
          ? { ...r, status: newStatus }
          : r
      ));
      toast.success('Reward status updated');
    } catch (error) {
      toast.error('Failed to update reward status');
    }
  };

  const handleSave = async (rewardData: Partial<Reward>) => {
    try {
      if (editingReward) {
        // Edit existing
        const updatedReward = await updateReward(editingReward.id, rewardData);
        setRewards(rewards.map(r =>
          r.id === editingReward.id
            ? updatedReward
            : r
        ));
        toast.success('Reward updated successfully');
      } else {
        // Create new
        const newReward = await createReward(rewardData as Omit<Reward, 'id' | 'created_at' | 'times_redeemed'>);
        setRewards([...rewards, newReward]);
        toast.success('Reward created successfully');
      }
      setIsFormOpen(false);
      setEditingReward(null);
    } catch (error) {
      toast.error('Failed to save reward');
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingReward(null);
  };

  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [selectedCustomerForRedemption, setSelectedCustomerForRedemption] = useState<string | null>(null);
  const [selectedRewardForRedemption, setSelectedRewardForRedemption] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (redeemDialogOpen) {
      loadCustomers();
    }
  }, [redeemDialogOpen]);

  const loadCustomers = async () => {
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  const handleAdminRedeem = async () => {
    if (!selectedCustomerForRedemption || !selectedRewardForRedemption) {
      toast.error('Please select both a customer and a reward');
      return;
    }

    try {
      await redeemReward({
        customer: selectedCustomerForRedemption,
        reward: selectedRewardForRedemption,
        date_claimed: new Date().toISOString()
      });
      toast.success('Reward redeemed successfully for customer');
      setRedeemDialogOpen(false);
      setSelectedCustomerForRedemption(null);
      setSelectedRewardForRedemption(null);
      loadRewards(); // Refresh to update counts
    } catch (error) {
      toast.error('Failed to redeem reward');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <AppLayout
      title="Rewards Management"
      subtitle="Create and manage loyalty rewards"
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRedeemDialogOpen(true)}>
            <Gift className="w-4 h-4 mr-2" /> Redeem for Customer
          </Button>
          <Button variant="chocolate" onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Reward
          </Button>
        </div>
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

      <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Reward for Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Customer</Label>
              <Input
                placeholder="Search customer by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    className={`p-2 cursor-pointer hover:bg-accent ${selectedCustomerForRedemption === customer.id ? 'bg-accent' : ''}`}
                    onClick={() => setSelectedCustomerForRedemption(customer.id)}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">{customer.phone} - {customer.points} pts</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Reward</Label>
              <Select onValueChange={(val) => setSelectedRewardForRedemption(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a reward..." />
                </SelectTrigger>
                <SelectContent>
                  {rewards.filter(r => r.status === 'active').map(reward => (
                    <SelectItem key={reward.id} value={reward.id}>
                      {reward.name} ({reward.points_required} pts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedeemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdminRedeem}>Redeem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
