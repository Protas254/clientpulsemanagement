import { mockCustomers, mockPurchaseHistory } from '@/data/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function RecentActivity() {
  const recentPurchases = mockPurchaseHistory.slice(0, 5).map(purchase => {
    const customer = mockCustomers.find(c => c.id === purchase.customerId);
    return { ...purchase, customer };
  });

  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="mb-6">
        <h3 className="font-display text-lg font-semibold text-foreground">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Latest purchases and interactions</p>
      </div>
      <div className="space-y-4">
        {recentPurchases.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <Avatar className="h-10 w-10 border-2 border-caramel/20">
              <AvatarImage src={item.customer?.avatar} alt={item.customer?.name} />
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {item.customer?.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {item.customer?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                ${item.amount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
