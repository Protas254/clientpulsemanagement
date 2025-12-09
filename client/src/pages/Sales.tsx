import { AppLayout } from '@/components/layout/AppLayout';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockCustomers, mockPurchaseHistory, monthlySalesData } from '@/data/mockData';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';

export default function Sales() {
  const recentSales = mockPurchaseHistory.map(purchase => {
    const customer = mockCustomers.find(c => c.id === purchase.customerId);
    return { ...purchase, customer };
  });

  const currentMonthSales = monthlySalesData[monthlySalesData.length - 1].sales;
  const lastMonthSales = monthlySalesData[monthlySalesData.length - 2].sales;
  const salesGrowth = ((currentMonthSales - lastMonthSales) / lastMonthSales * 100).toFixed(1);

  return (
    <AppLayout title="Sales" subtitle="Track your revenue and transactions">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-display font-semibold text-foreground">
                  ${currentMonthSales.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-caramel/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-caramel" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-success">
              <TrendingUp className="w-4 h-4" />
              <span>{salesGrowth}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Month</p>
                <p className="text-2xl font-display font-semibold text-foreground">
                  ${lastMonthSales.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-chocolate-medium" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-display font-semibold text-foreground">
                  {mockPurchaseHistory.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-chocolate-dark/10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-chocolate-medium" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order</p>
                <p className="text-2xl font-display font-semibold text-foreground">
                  ${Math.round(mockPurchaseHistory.reduce((acc, p) => acc + p.amount, 0) / mockPurchaseHistory.length)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-caramel/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-caramel" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <div className="mb-8">
        <SalesChart />
      </div>

      {/* Recent Transactions */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="font-display text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div 
                key={sale.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full gradient-chocolate flex items-center justify-center text-primary-foreground font-medium">
                    {sale.customer?.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{sale.customer?.name}</p>
                    <p className="text-sm text-muted-foreground">{sale.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">${sale.amount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(sale.date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
