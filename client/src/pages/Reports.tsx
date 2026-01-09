import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, FileText, Calendar, TrendingUp, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchRevenueAnalytics,
  fetchCustomerAnalytics,
  fetchOperationalMetrics,
  fetchAnalyticsDashboardStats
} from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';
import { toast } from 'sonner';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#D97706', '#059669', '#2563EB', '#DC2626', '#7C3AED', '#DB2777'];

export default function Reports() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Queries
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchAnalyticsDashboardStats,
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenueAnalytics', period],
    queryFn: () => fetchRevenueAnalytics(period),
  });

  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ['customerAnalytics'],
    queryFn: fetchCustomerAnalytics,
  });

  const { data: operationalData, isLoading: operationalLoading } = useQuery({
    queryKey: ['operationalMetrics'],
    queryFn: () => fetchOperationalMetrics(30),
  });

  const handleExportExcel = () => {
    if (!revenueData) {
      toast.error('No report data available to export');
      return;
    }
    toast.success('Preparing Excel report...');
    exportToExcel(revenueData, 'ClientPulse_Revenue_Report');
  };

  const handleExportPDF = () => {
    if (!revenueData) {
      toast.error('No report data available to export');
      return;
    }
    toast.success('Generating PDF report...');
    exportToPDF(revenueData, 'ClientPulse_Business_Report');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <AppLayout title="Analytics & Reports" subtitle="Comprehensive business insights and performance metrics">
      <div className="flex flex-col space-y-6">

        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Tabs defaultValue="overview" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="customers">Customers</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                {/* Period selector only for Revenue tab essentially, but we can keep it global or move inside */}
                <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
                  <SelectTrigger className="w-32">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Last 30 Days</SelectItem>
                    <SelectItem value="weekly">Last 12 Weeks</SelectItem>
                    <SelectItem value="monthly">Last 12 Months</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="default" size="sm" onClick={handleExportExcel}>
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>

            {/* Overview Content */}
            <TabsContent value="overview" className="space-y-6">
              {statsLoading ? (
                <div className="p-8 text-center">Loading stats...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(dashboardStats?.this_month.revenue || 0)}</div>
                        <p className="text-xs text-muted-foreground">
                          {dashboardStats?.this_month.growth_percentage && dashboardStats.this_month.growth_percentage > 0 ? '+' : ''}
                          {dashboardStats?.this_month.growth_percentage}% from last month
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Visits</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats?.this_month.visits || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          Completed services this month
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(dashboardStats?.today.revenue || 0)}</div>
                        <p className="text-xs text-muted-foreground">
                          From {dashboardStats?.today.bookings || 0} bookings today
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats?.pending_bookings || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          Requires confirmation
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Revenue Chart Preview */}
                  {revenueData && (
                    <Card className="col-span-4">
                      <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                      </CardHeader>
                      <CardContent className="pl-2">
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData.revenue_trend}
                              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.8} />
                                  <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="date" />
                              <YAxis tickFormatter={(val) => `KES ${val}`} />
                              <CartesianGrid strokeDasharray="3 3" />
                              <Tooltip formatter={(value) => formatCurrency(value as number)} />
                              <Area type="monotone" dataKey="revenue" stroke="#D97706" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Revenue Content */}
            <TabsContent value="revenue" className="space-y-6">
              {revenueLoading ? <div>Loading revenue data...</div> : revenueData && (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold">{formatCurrency(revenueData.total_stats.revenue)}</div></CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>Total Visits</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold">{revenueData.total_stats.visits}</div></CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>Avg Ticket Size</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold">{formatCurrency(revenueData.total_stats.avg_ticket)}</div></CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="col-span-2">
                      <CardHeader><CardTitle>Revenue Trend ({period})</CardTitle></CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueData.revenue_trend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(val) => formatCurrency(val as number)} />
                            <Area type="monotone" dataKey="revenue" stroke="#059669" fill="#059669" fillOpacity={0.2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle>Top Services by Revenue</CardTitle></CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueData.service_performance} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="service_name" type="category" width={100} fontSize={10} />
                            <Tooltip formatter={(val) => formatCurrency(val as number)} />
                            <Bar dataKey="revenue" fill="#2563EB" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle>Staff Performance</CardTitle></CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueData.staff_performance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="staff_name" />
                            <YAxis />
                            <Tooltip formatter={(val) => formatCurrency(val as number)} />
                            <Bar dataKey="revenue" fill="#7C3AED" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Customers Content */}
            <TabsContent value="customers" className="space-y-6">
              {customerLoading ? <div>Loading customer data...</div> : customerData && (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Total Customers</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold">{customerData.overview.total_customers}</div></CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-sm">New (30d)</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold text-green-600">+{customerData.overview.new_customers_30d}</div></CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Retention Rate</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold">{customerData.overview.retention_rate}%</div></CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Avg CLV</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold">{formatCurrency(customerData.lifetime_value.avg_clv)}</div></CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader><CardTitle>Peak Visit Days</CardTitle></CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={customerData.visit_patterns.peak_days}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="visits" fill="#DB2777" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>Peak Hours</CardTitle></CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={customerData.visit_patterns.peak_hours}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="visits" fill="#D97706" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader><CardTitle>Top Customers by Spend</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {customerData.top_customers.map((customer, i) => (
                          <div key={customer.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                            <div className="flex items-center gap-4">
                              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                {i + 1}
                              </div>
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-xs text-muted-foreground">{customer.visits} visits</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(customer.total_spent)}</p>
                              <p className="text-xs text-muted-foreground">Avg: {formatCurrency(customer.avg_per_visit)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Operations Content */}
            <TabsContent value="operations" className="space-y-6">
              {operationalLoading ? <div>Loading operational data...</div> : operationalData && (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Conversion Rate</CardTitle></CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{operationalData.rates.conversion_rate}%</div>
                        <p className="text-xs text-muted-foreground">Bookings that get confirmed</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Cancellation Rate</CardTitle></CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">{operationalData.rates.cancellation_rate}%</div>
                        <p className="text-xs text-muted-foreground">Bookings cancelled</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Completion Rate</CardTitle></CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{operationalData.rates.completion_rate}%</div>
                        <p className="text-xs text-muted-foreground">Successfully completed visits</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader><CardTitle>Booking Status Distribution</CardTitle></CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={operationalData.status_distribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {operationalData.status_distribution.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>Busiest Hours (Bookings)</CardTitle></CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={operationalData.busiest_hours}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="bookings" fill="#7C3AED" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
