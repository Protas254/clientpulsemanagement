import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Reward, RewardType } from '@/types/rewards';

interface RewardFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reward: Partial<Reward>) => void;
  reward?: Reward | null;
}

export function RewardForm({ isOpen, onClose, onSave, reward }: RewardFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsRequired: 50,
    type: 'gift' as RewardType,
    value: '',
    expiryDate: '',
    isActive: true,
  });

  useEffect(() => {
    if (reward) {
      setFormData({
        name: reward.name,
        description: reward.description,
        pointsRequired: reward.pointsRequired,
        type: reward.type,
        value: reward.value,
        expiryDate: reward.expiryDate,
        isActive: reward.status === 'active',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        pointsRequired: 50,
        type: 'gift',
        value: '',
        expiryDate: '',
        isActive: true,
      });
    }
  }, [reward, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: reward?.id,
      name: formData.name,
      description: formData.description,
      pointsRequired: formData.pointsRequired,
      type: formData.type,
      value: formData.value,
      expiryDate: formData.expiryDate,
      status: formData.isActive ? 'active' : 'disabled',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {reward ? 'Edit Reward' : 'Add New Reward'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Reward Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Free Coffee"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the reward..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points">Points Required</Label>
              <Input
                id="points"
                type="number"
                min={1}
                value={formData.pointsRequired}
                onChange={(e) => setFormData({ ...formData, pointsRequired: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Reward Type</Label>
              <Select value={formData.type} onValueChange={(value: RewardType) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gift">Gift</SelectItem>
                  <SelectItem value="discount">Discount</SelectItem>
                  <SelectItem value="cashback">Cashback</SelectItem>
                  <SelectItem value="free_service">Free Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Reward Value</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="e.g., 10%, KES 500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="active">Activate Reward</Label>
            <Switch
              id="active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="chocolate" className="flex-1">
              {reward ? 'Save Changes' : 'Create Reward'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
