import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { CustomerRewardsWallet } from '@/components/rewards/CustomerRewardsWallet';
import { RewardRulesCard } from '@/components/rewards/RewardRulesCard';
import { mockCustomers } from '@/data/mockData';

export default function CustomerWallet() {
  const [selectedCustomerId, setSelectedCustomerId] = useState(mockCustomers[0]?.id || '1');

  return (
    <AppLayout 
      title="Customer Rewards Wallet" 
      subtitle="View and manage customer reward points"
      action={
        <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {mockCustomers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CustomerRewardsWallet customerId={selectedCustomerId} />
        </div>
        <div>
          <RewardRulesCard />
        </div>
      </div>
    </AppLayout>
  );
}
