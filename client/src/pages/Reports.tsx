import { AppLayout } from '@/components/layout/AppLayout';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { CustomerGrowthChart } from '@/components/dashboard/CustomerGrowthChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchAnalytics } from '@/services/api';
import { useQuery } from '@tanstack/react-query';

export default function Reports() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
  });

  if (isLoading) {
    return (
      <AppLayout title="Reports" subtitle="Analytics and business insights">
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const { monthly_sales, customer_growth, summary, retention_stats } = analyticsData || {
    monthly_sales: [],
    customer_growth: [],
    summary: { total_annual_sales: 0, avg_monthly_sales: 0, total_customers_gained: 0 },
    retention_stats: { retention_rate: 0, avg_visits_per_client: 0, avg_visit_value: 0, customer_rating: 0 }
  };

  const totalAnnualSales = summary.total_annual_sales;
  const avgMonthlySales = summary.avg_monthly_sales;
  const totalCustomersGained = summary.total_customers_gained;

  return (
    <AppLayout title="Reports" subtitle="Analytics and business insights">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Select defaultValue="monthly">
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="chocolate">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Annual Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-semibold text-foreground">
              KES {totalAnnualSales.toLocaleString()}
            </p>
            <p className="text-sm text-success mt-1">↑ 23% vs last year</p>
          </CardContent>
        </Card>
        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Monthly Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-semibold text-foreground">
              KES {avgMonthlySales.toLocaleString()}
            </p>
            <p className="text-sm text-success mt-1">↑ 15% vs last year</p>
          </CardContent>
        </Card>
        <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-semibold text-foreground">
              {totalCustomersGained.toLocaleString()}
            </p>
            <p className="text-sm text-success mt-1">↑ 18% vs last year</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SalesChart data={monthly_sales} />
        <CustomerGrowthChart data={customer_growth} />
      </div>

      {/* Retention Stats */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="font-display text-lg">Customer Retention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-4xl font-display font-semibold text-caramel">{retention_stats.retention_rate}%</p>
              <p className="text-sm text-muted-foreground mt-1">Retention Rate</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-display font-semibold text-chocolate-medium">{retention_stats.avg_visits_per_client}</p>
              <p className="text-sm text-muted-foreground mt-1">Avg. Visits/Client</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-display font-semibold text-caramel">KES {retention_stats.avg_visit_value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Avg. Visit Value</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-display font-semibold text-chocolate-medium">{retention_stats.customer_rating || '-'}</p>
              <p className="text-sm text-muted-foreground mt-1">Customer Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
