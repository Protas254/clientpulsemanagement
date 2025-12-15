import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fetchCustomerRewards, CustomerReward } from '@/services/api';
import { toast } from '@/hooks/use-toast';

export function RedeemedRewardsTable() {
  const [redemptions, setRedemptions] = useState<CustomerReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRedemptions();
  }, []);

  const loadRedemptions = async () => {
    try {
      const data = await fetchCustomerRewards();
      setRedemptions(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load redemptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'redeemed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Recent Redemptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Recent Redemptions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Customer</TableHead>
              <TableHead className="text-muted-foreground">Visits</TableHead>
              <TableHead className="text-muted-foreground">Reward</TableHead>
              <TableHead className="text-muted-foreground">Value</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {redemptions.map((redemption) => (
              <TableRow key={redemption.id} className="border-border">
                <TableCell className="text-foreground">
                  {format(new Date(redemption.date_claimed), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="text-foreground font-medium">
                  {redemption.customer_name || 'Unknown'}
                </TableCell>
                <TableCell className="text-foreground font-medium">
                  {redemption.customer_visit_count || 0}
                </TableCell>
                <TableCell className="text-foreground">
                  {redemption.reward_name || 'Unknown'}
                </TableCell>
                <TableCell className="text-foreground">{redemption.reward_value || '-'}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(redemption.status)}>
                    {redemption.status === 'pending' ? 'Pending Redemption' :
                      redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {redemptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No redemptions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
