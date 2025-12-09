import { Gift, Award, CheckCircle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { RewardsStatCard } from '@/components/rewards/RewardsStatCard';
import { RewardUsageChart } from '@/components/rewards/RewardUsageChart';
import { MostRedeemedChart } from '@/components/rewards/MostRedeemedChart';
import { RedeemedRewardsTable } from '@/components/rewards/RedeemedRewardsTable';
import { RewardRulesCard } from '@/components/rewards/RewardRulesCard';
import { rewardsDashboardStats } from '@/data/rewardsData';

export default function RewardsDashboard() {
  return (
    <AppLayout title="Rewards Dashboard" subtitle="Overview of your loyalty rewards program">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <RewardsStatCard
          title="Total Rewards Created"
          value={rewardsDashboardStats.totalRewardsCreated}
          icon={Gift}
          trend={{ value: 12, isPositive: true }}
        />
        <RewardsStatCard
          title="Total Rewards Claimed"
          value={rewardsDashboardStats.totalRewardsClaimed}
          icon={Award}
          trend={{ value: 8, isPositive: true }}
        />
        <RewardsStatCard
          title="Active Rewards"
          value={rewardsDashboardStats.activeRewards}
          icon={CheckCircle}
        />
        <RewardsStatCard
          title="Pending Redemptions"
          value={rewardsDashboardStats.pendingRedemptions}
          icon={Clock}
          trend={{ value: 3, isPositive: false }}
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
