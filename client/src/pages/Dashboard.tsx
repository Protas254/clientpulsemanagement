import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchDailyStats, fetchDashboardStats, DailyStats, DashboardStats } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Scissors, Sparkles, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [daily, dashboard] = await Promise.all([
        fetchDailyStats(),
        fetchDashboardStats(),
      ]);
      setDailyStats(daily);
      setDashboardStats(dashboard);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Dashboard" subtitle="Loading your salon overview...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </AppLayout>
    );
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const adminName = user.full_name || user.username || 'Admin';

  return (
    <AppLayout
      title="📊 Client Dashboard"
      subtitle={`Welcome back ${adminName}! Here's your business overview.`}
    >
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Button
          onClick={() => window.location.href = '/customers?add=true'}
          className="h-16 bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-3 rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <Users className="w-5 h-5" />
          <span className="font-semibold">Add New Customer</span>
        </Button>
        <Button
          onClick={() => window.location.href = '/bookings?add=true'}
          className="h-16 bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-3 rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <Calendar className="w-5 h-5" />
          <span className="font-semibold">New Booking</span>
        </Button>
        <Button
          onClick={() => window.location.href = '/services'}
          variant="outline"
          className="h-16 border-amber-200 text-amber-700 hover:bg-amber-50 flex items-center justify-center gap-3 rounded-xl shadow-sm transition-all"
        >
          <Scissors className="w-5 h-5" />
          <span className="font-semibold">Manage Services</span>
        </Button>
        <Button
          onClick={() => window.location.href = '/reports'}
          variant="outline"
          className="h-16 border-orange-200 text-orange-700 hover:bg-orange-50 flex items-center justify-center gap-3 rounded-xl shadow-sm transition-all"
        >
          <TrendingUp className="w-5 h-5" />
          <span className="font-semibold">View Reports</span>
        </Button>
      </div>
      {/* Today's Stats */}
      <div className="mb-6">
        <h2 className="text-2xl font-display font-semibold mb-4 text-amber-900">
          Today's Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Customers Served Today"
            value={dailyStats?.customers_served || 0}
            icon={<Users className="w-6 h-6 text-amber-600" />}
            variant="primary"
          />
          <StatCard
            title="Revenue Today"
            value={`KES ${(dailyStats?.revenue || 0).toLocaleString()}`}
            icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
            variant="accent"
          />
          <StatCard
            title="Total Customers"
            value={dashboardStats?.total_customers || 0}
            icon={<Sparkles className="w-6 h-6 text-amber-600" />}
          />
        </div>
      </div>

      {/* Popular Services Today */}
      {dailyStats && dailyStats.popular_services.length > 0 && (
        <div className="mb-6">
          <Card className="border-amber-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
              <CardTitle className="font-display text-amber-900 flex items-center gap-2">
                <Scissors className="w-5 h-5" />
                Popular Services Today
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {dailyStats.popular_services.map((service, index) => (
                  <div key={service.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-amber-900">{service.name}</p>
                        <p className="text-sm text-amber-600">KES {service.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-700">{service.times_booked}</p>
                      <p className="text-sm text-amber-600">bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Overview */}
      <div className="mb-6">
        <h2 className="text-2xl font-display font-semibold mb-4 text-amber-900">
          Monthly Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="This Month's Revenue"
            value={`KES ${(dashboardStats?.current_month_sales || 0).toLocaleString()}`}
            icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
            trend={{
              value: dashboardStats?.sales_growth || 0,
              isPositive: (dashboardStats?.sales_growth || 0) >= 0
            }}
          />
          <StatCard
            title="Total Visits"
            value={dashboardStats?.total_transactions || 0}
            icon={<Calendar className="w-6 h-6 text-orange-600" />}
          />
          <StatCard
            title="Active Customers"
            value={dashboardStats?.active_customers || 0}
            icon={<Users className="w-6 h-6 text-purple-600" />}
          />
          <StatCard
            title="Average Per Visit"
            value={`KES ${(dashboardStats?.avg_order || 0).toLocaleString()}`}
            icon={<Scissors className="w-6 h-6 text-orange-600" />}
          />
        </div>
      </div>

      {/* Staff Performance Today */}
      {dailyStats && dailyStats.staff_performance.length > 0 && (
        <div className="mb-6">
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="font-display text-amber-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Staff Performance Today
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dailyStats.staff_performance.map((staff) => (
                  <div key={staff.id} className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-amber-900 mb-2">{staff.name}</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-700">Customers: <strong>{staff.customers_served}</strong></span>
                      <span className="text-amber-700">Revenue: <strong>KES {staff.revenue_generated.toLocaleString()}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/visits"
          className="p-6 bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 cursor-pointer"
        >
          <h3 className="text-xl font-bold mb-2">New Walk-In</h3>
          <p className="text-amber-100">Record a visit</p>
        </a>
        <a
          href="/customers"
          className="p-6 bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 cursor-pointer"
        >
          <h3 className="text-xl font-bold mb-2">Customers</h3>
          <p className="text-orange-100">Manage clients</p>
        </a>
        <a
          href="/services"
          className="p-6 bg-gradient-to-br from-amber-600 to-orange-600 text-white rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 cursor-pointer"
        >
          <h3 className="text-xl font-bold mb-2">Services</h3>
          <p className="text-amber-100">Manage menu</p>
        </a>
      </div>
    </AppLayout>
  );
}
