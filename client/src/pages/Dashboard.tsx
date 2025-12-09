import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { CustomerGrowthChart } from '@/components/dashboard/CustomerGrowthChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { mockDashboardStats } from '@/data/mockData';
import { Users, UserPlus, DollarSign, Clock } from 'lucide-react';

export default function Dashboard() {
  return (
    <AppLayout title="Dashboard" subtitle="Welcome back! Here's your business overview.">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Customers"
          value={mockDashboardStats.totalCustomers}
          icon={<Users className="w-6 h-6 text-chocolate-medium" />}
          trend={{ value: 12, isPositive: true }}
          variant="primary"
        />
        <StatCard
          title="New Today"
          value={mockDashboardStats.newCustomersToday}
          icon={<UserPlus className="w-6 h-6 text-caramel" />}
          trend={{ value: 8, isPositive: true }}
          variant="accent"
        />
        <StatCard
          title="Total Sales"
          value={`$${mockDashboardStats.totalSales.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6 text-chocolate-medium" />}
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Pending Follow-ups"
          value={mockDashboardStats.pendingFollowUps}
          icon={<Clock className="w-6 h-6 text-caramel" />}
          trend={{ value: 3, isPositive: false }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SalesChart />
        <CustomerGrowthChart />
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </AppLayout>
  );
}
