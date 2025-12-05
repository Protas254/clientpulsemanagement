import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { mockCustomers, mockPurchaseHistory, mockFollowUps } from '@/data/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  DollarSign,
  ShoppingBag,
  Edit2,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  vip: 'bg-caramel/10 text-caramel border-caramel/20',
};

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const customer = mockCustomers.find(c => c.id === id);
  const purchases = mockPurchaseHistory.filter(p => p.customerId === id);
  const followUps = mockFollowUps.filter(f => f.customerId === id);

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
        <Card className="lg:col-span-1 animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 border-4 border-caramel/20 mb-4">
                <AvatarImage src={customer.avatar} alt={customer.name} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
                  {customer.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                {customer.name}
              </h2>
              <Badge 
                variant="outline" 
                className={statusColors[customer.status]}
              >
                {customer.status.toUpperCase()}
              </Badge>

              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {customer.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {customer.phone}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {customer.location}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Customer since {format(new Date(customer.firstVisit), 'MMM yyyy')}
                </div>
              </div>

              <Button variant="chocolate" className="w-full mt-6">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="animate-fade-in">
              <CardContent className="pt-6 text-center">
                <DollarSign className="w-8 h-8 mx-auto text-caramel mb-2" />
                <p className="text-2xl font-display font-semibold text-foreground">
                  ${customer.totalSpent.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Spent</p>
              </CardContent>
            </Card>
            <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="pt-6 text-center">
                <ShoppingBag className="w-8 h-8 mx-auto text-chocolate-medium mb-2" />
                <p className="text-2xl font-display font-semibold text-foreground">
                  {customer.totalPurchases}
                </p>
                <p className="text-sm text-muted-foreground">Total Purchases</p>
              </CardContent>
            </Card>
            <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="pt-6 text-center">
                <Calendar className="w-8 h-8 mx-auto text-caramel mb-2" />
                <p className="text-2xl font-display font-semibold text-foreground">
                  {format(new Date(customer.lastPurchase), 'MMM d')}
                </p>
                <p className="text-sm text-muted-foreground">Last Purchase</p>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="font-display text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {customer.notes || 'No notes available.'}
              </p>
            </CardContent>
          </Card>

          {/* Purchase History */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="font-display text-lg">Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              {purchases.length > 0 ? (
                <div className="space-y-3">
                  {purchases.map((purchase) => (
                    <div 
                      key={purchase.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div>
                        <p className="font-medium text-foreground">{purchase.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(purchase.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <p className="font-semibold text-foreground">
                        ${purchase.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No purchase history available.</p>
              )}
            </CardContent>
          </Card>

          {/* Follow-ups */}
          <Card className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg">Follow-up Reminders</CardTitle>
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Add Reminder
              </Button>
            </CardHeader>
            <CardContent>
              {followUps.length > 0 ? (
                <div className="space-y-3">
                  {followUps.map((followUp) => (
                    <div 
                      key={followUp.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        followUp.completed ? 'bg-success/10' : 'bg-caramel/10'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-foreground">{followUp.note}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(followUp.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant={followUp.completed ? 'outline' : 'default'}>
                        {followUp.completed ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No follow-up reminders set.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
