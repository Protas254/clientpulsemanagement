import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchDailyStats, fetchDashboardStats, DailyStats, DashboardStats, fetchAnalytics, AnalyticsData } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Scissors, Sparkles, Calendar, Star, X } from 'lucide-react';
import { createReview } from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { OnboardingWizard } from '@/components/dashboard/OnboardingWizard';
import { fetchUserProfile } from '@/services/api';
import { CalendarView } from '@/components/dashboard/CalendarView';
import { AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWebSocket } from '@/contexts/WebSocketContext';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { lastMessage } = useWebSocket();
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      loadStats();
    }
  }, [lastMessage]);


  const loadStats = async () => {
    try {
      const [daily, dashboard, userProfileData, analytics] = await Promise.allSettled([
        fetchDailyStats(),
        fetchDashboardStats(),
        fetchUserProfile(),
        fetchAnalytics(),
      ]);

      if (daily.status === 'fulfilled') setDailyStats(daily.value);
      if (dashboard.status === 'fulfilled') setDashboardStats(dashboard.value);
      if (analytics.status === 'fulfilled') setAnalyticsData(analytics.value);

      // Check onboarding status from user profile
      if (userProfileData.status === 'fulfilled') {
        const profile = userProfileData.value;
        console.log("User Profile Data:", profile);
        if (profile.tenant) {
          console.log("Tenant Onboarding Status:", profile.tenant.onboarding_completed);
          if (!profile.tenant.onboarding_completed) {
            console.log("Showing Onboarding Wizard");
            setShowOnboarding(true);
          }
        }
      }
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

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    try {
      await createReview({
        rating: reviewRating,
        comment: reviewComment,
        reviewer_type: 'business_owner',
        is_public: true
      });
      toast({
        title: 'Thank you!',
        description: 'Your feedback has been shared on the landing page.',
      });
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  //   if (loading) {
  //     return (
  //       <AppLayout title="Dashboard" subtitle="Loading your salon overview...">
  //         <div className="flex items-center justify-center h-64">
  //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
  //         </div>
  //       </AppLayout>
  //     );
  //   }

  const adminName = user?.full_name || user?.username || 'Admin';

  return (
    <AppLayout
      title="📊 Client Dashboard"
      subtitle={`Welcome back ${adminName}! Here's your business overview.`}
    >
      {showOnboarding && (
        <OnboardingWizard onComplete={() => {
          setShowOnboarding(false);
          loadStats(); // Reload stats to refresh view
        }} />
      )}

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
          onClick={() => setShowReviewModal(true)}
          variant="outline"
          className="h-16 border-accent text-accent-foreground hover:bg-accent/10 flex items-center justify-center gap-3 rounded-xl shadow-sm transition-all"
        >
          <Star className="w-5 h-5 text-accent" />
          <span className="font-semibold">Share Experience</span>
        </Button>
      </div>

      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-amber-900">Share Your Experience</DialogTitle>
            <DialogDescription className="text-amber-700/60">
              Help us improve by sharing your feedback about the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="text-center">
              <Label className="text-lg font-medium mb-4 block">How are you enjoying ClientPulse?</Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`w-10 h-10 ${star <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-amber-200'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-comment">Your Feedback</Label>
              <Textarea
                id="review-comment"
                placeholder="Tell us what you think about the system..."
                className="min-h-[120px] rounded-xl border-amber-100 focus:ring-amber-500"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSubmitReview}
              disabled={submittingReview || !reviewComment}
              className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-lg transition-all"
            >
              {submittingReview ? 'Submitting...' : 'Post Review'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Retention & Churn Section */}
      <div className="mb-8">
        <Card className={`border-2 shadow-lg transition-all ${dashboardStats && dashboardStats.churned_customers > 0
          ? "border-red-200 bg-gradient-to-r from-red-50 to-orange-50 animate-pulse-subtle"
          : "border-green-100 bg-gradient-to-r from-green-50 to-emerald-50"
          }`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${dashboardStats && dashboardStats.churned_customers > 0 ? "bg-red-100" : "bg-green-100"
                }`}>
                {dashboardStats && dashboardStats.churned_customers > 0
                  ? <AlertCircle className="w-8 h-8 text-red-600" />
                  : <Sparkles className="w-8 h-8 text-green-600" />
                }
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold ${dashboardStats && dashboardStats.churned_customers > 0 ? "text-red-900" : "text-green-900"
                  }`}>
                  {dashboardStats && dashboardStats.churned_customers > 0 ? "Customer Churn Alert" : "Customer Retention: Healthy"}
                </h3>
                <p className={`${dashboardStats && dashboardStats.churned_customers > 0 ? "text-red-700" : "text-green-700"
                  } text-lg`}>
                  {dashboardStats && dashboardStats.churned_customers > 0
                    ? <><strong>{dashboardStats.churned_customers}</strong> customers who visited last month haven't booked this month.</>
                    : "All your customers from last month have returned or booked again! Your retention is at 100%."
                  }
                </p>
                <p className={`${dashboardStats && dashboardStats.churned_customers > 0 ? "text-red-600/80" : "text-green-600/80"
                  } text-sm mt-1 italic`}>
                  {dashboardStats && dashboardStats.churned_customers > 0
                    ? "💡 Pro-tip: Run a \"We miss you\" marketing campaign to bring them back!"
                    : "✨ Keep up the great service to maintain this perfect score."
                  }
                </p>
              </div>
              {dashboardStats && dashboardStats.churned_customers > 0 && (
                <Button
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-100"
                  onClick={() => window.location.href = '/customers?filter=churned'}
                >
                  View Customers
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Financial Breakdown */}
      <div className="mb-10">
        <h2 className="text-2xl font-display font-semibold mb-4 text-amber-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Monthly Financial Snapshot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/50 backdrop-blur-sm shadow-sm border-amber-100">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-amber-600">Monthly Revenue</p>
              <h3 className="text-2xl font-bold text-amber-900 font-display">KES {analyticsData?.summary.total_revenue.toLocaleString() || '0'}</h3>
              <p className="text-[10px] text-muted-foreground mt-1 underline cursor-pointer" onClick={() => window.location.href = '/reports'}>View Reports →</p>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm shadow-sm border-red-100">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-red-600">Operating Expenses</p>
              <h3 className="text-2xl font-bold text-red-900 font-display">KES {analyticsData?.summary.expenses.toLocaleString() || '0'}</h3>
              <p className="text-[10px] text-muted-foreground mt-1 underline cursor-pointer" onClick={() => window.location.href = '/expenses'}>Manage Expenses →</p>
            </CardContent>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm shadow-sm border-blue-100">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-blue-600">Stock on Hand</p>
              <h3 className="text-2xl font-bold text-blue-900 font-display">KES {analyticsData?.summary.inventory_value.toLocaleString() || '0'}</h3>
              <p className="text-[10px] text-muted-foreground mt-1 underline cursor-pointer" onClick={() => window.location.href = '/inventory'}>Check Stock →</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 shadow-md border-emerald-200">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-emerald-600">Estimated Net Profit</p>
              <h3 className="text-2xl font-bold text-emerald-900 font-display">KES {analyticsData?.summary.net_profit.toLocaleString() || '0'}</h3>
              <p className="text-[10px] text-emerald-600 mt-1 font-medium italic">Profit after all costs</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Interactive Calendar */}
      <div className="mb-10">
        <h2 className="text-2xl font-display font-semibold mb-4 text-amber-900">
          📅 Booking Schedule
        </h2>
        <CalendarView />
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
      {dailyStats && dailyStats.popular_services?.length > 0 && (
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
      {dailyStats && dailyStats.staff_performance?.length > 0 && (
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
