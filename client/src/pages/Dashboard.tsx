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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="📊 Client Dashboard"
      subtitle="Welcome back! Here's your business overview."
    >
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Button
          onClick={() => window.location.href = '/customers?add=true'}
          className="h-16 bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-3 rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <Users className="w-5 h-5" />
          <span className="font-semibold">Add New Customer</span>
        </Button>
        <Button
          onClick={() => window.location.href = '/bookings?add=true'}
          className="h-16 bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center gap-3 rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <Calendar className="w-5 h-5" />
          <span className="font-semibold">New Booking</span>
        </Button>
        <Button
          onClick={() => window.location.href = '/services'}
          variant="outline"
          className="h-16 border-purple-200 text-purple-700 hover:bg-purple-50 flex items-center justify-center gap-3 rounded-xl shadow-sm transition-all"
        >
          <Scissors className="w-5 h-5" />
          <span className="font-semibold">Manage Services</span>
        </Button>
        <Button
          onClick={() => window.location.href = '/reports'}
          variant="outline"
          className="h-16 border-pink-200 text-pink-700 hover:bg-pink-50 flex items-center justify-center gap-3 rounded-xl shadow-sm transition-all"
        >
          <TrendingUp className="w-5 h-5" />
          <span className="font-semibold">View Reports</span>
        </Button>
      </div>
      {/* Today's Stats */}
      <div className="mb-6">
        <h2 className="text-2xl font-display font-semibold mb-4 text-purple-900">
          Today's Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Customers Served Today"
            value={dailyStats?.customers_served || 0}
            icon={<Users className="w-6 h-6 text-purple-600" />}
            variant="primary"
          />
          <StatCard
            title="Revenue Today"
            value={`KES ${(dailyStats?.revenue || 0).toLocaleString()}`}
            icon={<TrendingUp className="w-6 h-6 text-pink-600" />}
            variant="accent"
          />
          <StatCard
            title="Total Customers"
            value={dashboardStats?.total_customers || 0}
            icon={<Sparkles className="w-6 h-6 text-purple-600" />}
          />
        </div>
      </div>

      {/* Popular Services Today */}
      {dailyStats && dailyStats.popular_services.length > 0 && (
        <div className="mb-6">
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="font-display text-purple-900 flex items-center gap-2">
                <Scissors className="w-5 h-5" />
                Popular Services Today
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {dailyStats.popular_services.map((service, index) => (
                  <div key={service.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900">{service.name}</p>
                        <p className="text-sm text-purple-600">KES {service.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-700">{service.times_booked}</p>
                      <p className="text-sm text-purple-600">bookings</p>
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
        <h2 className="text-2xl font-display font-semibold mb-4 text-purple-900">
          Monthly Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="This Month's Revenue"
            value={`KES ${(dashboardStats?.current_month_sales || 0).toLocaleString()}`}
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            trend={{
              value: dashboardStats?.sales_growth || 0,
              isPositive: (dashboardStats?.sales_growth || 0) >= 0
            }}
          />
          <StatCard
            title="Total Visits"
            value={dashboardStats?.total_transactions || 0}
            icon={<Calendar className="w-6 h-6 text-pink-600" />}
          />
          <StatCard
            title="Active Customers"
            value={dashboardStats?.active_customers || 0}
            icon={<Users className="w-6 h-6 text-purple-600" />}
          />
          <StatCard
            title="Average Per Visit"
            value={`KES ${(dashboardStats?.avg_order || 0).toLocaleString()}`}
            icon={<Scissors className="w-6 h-6 text-pink-600" />}
          />
        </div>
      </div>

      {/* Staff Performance Today */}
      {dailyStats && dailyStats.staff_performance.length > 0 && (
        <div className="mb-6">
          <Card className="border-pink-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50">
              <CardTitle className="font-display text-purple-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Staff Performance Today
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dailyStats.staff_performance.map((staff) => (
                  <div key={staff.id} className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                    <h4 className="font-semibold text-purple-900 mb-2">{staff.name}</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-700">Customers: <strong>{staff.customers_served}</strong></span>
                      <span className="text-purple-700">Revenue: <strong>KES {staff.revenue_generated.toLocaleString()}</strong></span>
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
          className="p-6 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 cursor-pointer"
        >
          <h3 className="text-xl font-bold mb-2">New Walk-In</h3>
          <p className="text-purple-100">Record a visit</p>
        </a>
        <a
          href="/customers"
          className="p-6 bg-gradient-to-br from-pink-500 to-pink-700 text-white rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 cursor-pointer"
        >
          <h3 className="text-xl font-bold mb-2">Customers</h3>
          <p className="text-pink-100">Manage clients</p>
        </a>
        <a
          href="/services"
          className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 cursor-pointer"
        >
          <h3 className="text-xl font-bold mb-2">Services</h3>
          <p className="text-purple-100">Manage menu</p>
        </a>
      </div>
    </AppLayout>
  );
}
