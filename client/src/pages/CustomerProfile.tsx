import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  Edit2,
  Bell,
  Gift,
  Wallet,
  Clock,
  Check,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fetchCustomerPortalDetails, Reward, Visit, Sale, CustomerReward } from '@/services/api';
import { useToast } from "@/hooks/use-toast";

const statusColors: any = {
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  vip: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [purchases, setPurchases] = useState<Sale[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<CustomerReward[]>([]);

  useEffect(() => {
    if (id) {
      loadCustomerData(parseInt(id));
    }
  }, [id]);

  const loadCustomerData = async (customerId: number) => {
    try {
      const data = await fetchCustomerPortalDetails(customerId);
      setCustomer(data.customer);
      setStatistics(data.statistics);
      setVisits(data.visits);
      setPurchases(data.purchases);
      setRewards(data.eligible_rewards);
      setRedemptions(data.redemptions);
    } catch (error) {
      console.error('Failed to load customer data', error);
      toast({
        title: "Error",
        description: "Failed to load customer profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!customer) {
    return (
      <AppLayout title="Customer Not Found">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground mb-4">Customer not found</p>
          <Button onClick={() => navigate('/customers')}>Back to Customers</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Customer Profile" subtitle={customer.name}>
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate('/customers')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Customers
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 animate-fade-in h-fit">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 border-4 border-caramel/20 mb-4">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
                  {customer.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                {customer.name}
              </h2>
              <Badge
                variant="outline"
                className={statusColors[customer.status] || statusColors.active}
              >
                {customer.status.toUpperCase()}
              </Badge>

              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {customer.email || 'No email provided'}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {customer.phone}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {customer.location || 'No location provided'}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Customer since {format(new Date(customer.created_at), 'MMM yyyy')}
                </div>
              </div>

              <div className="w-full mt-6 grid grid-cols-2 gap-4">
                <div className="bg-secondary/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Points</p>
                  <p className="text-xl font-bold text-primary">{customer.points}</p>
                </div>
                <div className="bg-secondary/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Visits</p>
                  <p className="text-xl font-bold text-primary">{customer.visit_count}</p>
                </div>
              </div>

              <Button variant="chocolate" className="w-full mt-6">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <DollarSign className="w-8 h-8 mx-auto text-caramel mb-2" />
                    <p className="text-2xl font-display font-semibold text-foreground">
                      KES{statistics?.total_spent?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <ShoppingBag className="w-8 h-8 mx-auto text-chocolate-medium mb-2" />
                    <p className="text-2xl font-display font-semibold text-foreground">
                      {statistics?.total_purchases || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Purchases</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Calendar className="w-8 h-8 mx-auto text-caramel mb-2" />
                    <p className="text-2xl font-display font-semibold text-foreground">
                      {customer.last_purchase ? format(new Date(customer.last_purchase), 'MMM d') : '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">Last Purchase</p>
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {customer.notes || 'No notes available.'}
                  </p>
                </CardContent>
              </Card>

              {/* Recent Activity (Visits) */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">Recent Visits</CardTitle>
                </CardHeader>
                <CardContent>
                  {visits.length > 0 ? (
                    <div className="space-y-4">
                      {visits.slice(0, 3).map((visit) => (
                        <div key={visit.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium">{format(new Date(visit.visit_date), 'MMM d, yyyy')}</p>
                            <p className="text-sm text-muted-foreground">
                              {visit.services_detail?.map(s => s.name).join(', ') || 'Service'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">KES{visit.total_amount}</p>
                            <Badge variant="outline" className="text-xs">
                              {visit.payment_status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No recent visits.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Eligible Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rewards.map((reward) => (
                      <div key={reward.id} className="border rounded-lg p-4 flex flex-col justify-between bg-card">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg">{reward.name}</h3>
                            <Badge variant="secondary" className="bg-caramel/10 text-caramel">
                              {reward.points_required} pts
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>
                        </div>
                        <Button disabled variant="outline" className="w-full">
                          {customer.points >= reward.points_required ? 'Eligible (Redeem in Portal)' : `Need KES{reward.points_required - customer.points} more pts`}
                        </Button>
                      </div>
                    ))}
                    {rewards.length === 0 && (
                      <p className="text-muted-foreground col-span-2 text-center py-8">No rewards available currently.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Redemption History</CardTitle>
                </CardHeader>
                <CardContent>
                  {redemptions.length > 0 ? (
                    <div className="space-y-4">
                      {redemptions.map((redemption) => (
                        <div key={redemption.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <Check className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">{redemption.reward_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Redeemed on {format(new Date(redemption.date_redeemed || redemption.date_claimed), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Redeemed
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No rewards redeemed yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-6">
              <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Current Balance</p>
                      <h2 className="text-4xl font-bold">{customer.points} <span className="text-lg font-normal text-gray-400">pts</span></h2>
                    </div>
                    <Wallet className="w-8 h-8 text-caramel" />
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white/10 rounded-lg p-3 flex-1">
                      <p className="text-xs text-gray-400 mb-1">Lifetime Earned</p>
                      <p className="font-semibold">{statistics?.total_spent || 0} pts</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 flex-1">
                      <p className="text-xs text-gray-400 mb-1">Lifetime Redeemed</p>
                      <p className="font-semibold">{redemptions.length} rewards</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visit History</CardTitle>
                </CardHeader>
                <CardContent>
                  {visits.length > 0 ? (
                    <div className="space-y-4">
                      {visits.map((visit) => (
                        <div key={visit.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{format(new Date(visit.visit_date), 'MMMM d, yyyy')}</p>
                              <p className="text-sm text-muted-foreground">
                                {visit.services_detail?.map(s => s.name).join(', ') || 'Service'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${visit.total_amount}</p>
                            <p className="text-xs text-muted-foreground">
                              {visit.staff_member_name || 'Staff'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No visit history available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
