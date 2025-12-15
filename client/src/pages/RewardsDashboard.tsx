import { useState, useEffect } from 'react';
import { Gift, Award, CheckCircle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { RewardsStatCard } from '@/components/rewards/RewardsStatCard';
import { RewardUsageChart } from '@/components/rewards/RewardUsageChart';
import { MostRedeemedChart } from '@/components/rewards/MostRedeemedChart';
import { RedeemedRewardsTable } from '@/components/rewards/RedeemedRewardsTable';
import { RewardRulesCard } from '@/components/rewards/RewardRulesCard';
import { fetchRewardsStats, RewardsStats } from '@/services/api';
import { toast } from '@/hooks/use-toast';

export default function RewardsDashboard() {
  const [stats, setStats] = useState<RewardsStats>({
    total_rewards_created: 0,
    total_rewards_claimed: 0,
    active_rewards: 0,
    pending_redemptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await fetchRewardsStats();
      setStats(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load rewards statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Rewards Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Rewards Dashboard" subtitle="Overview of your loyalty rewards program">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <RewardsStatCard
          title="Total Rewards Created"
          value={stats.total_rewards_created}
          icon={Gift}
          trend={{ value: 12, isPositive: true }} // Mock trend for now
        />
        <RewardsStatCard
          title="Total Rewards Claimed"
          value={stats.total_rewards_claimed}
          icon={Award}
          trend={{ value: 8, isPositive: true }} // Mock trend for now
        />
        <RewardsStatCard
          title="Active Rewards"
          value={stats.active_rewards}
          icon={CheckCircle}
        />
        <RewardsStatCard
          title="Pending Redemptions"
          value={stats.pending_redemptions}
          icon={Clock}
          trend={{ value: 3, isPositive: false }} // Mock trend for now
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RewardUsageChart />
        <MostRedeemedChart />
      </div>

      {/* Rules Card */}
      <div className="mb-6">
        <RewardRulesCard />
      </div>

      {/* Redemptions Table */}
      <RedeemedRewardsTable />
    </AppLayout>
  );
}
