import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { customerRewards, rewards } from '@/data/rewardsData';
import { mockCustomers } from '@/data/mockData';
import { format } from 'date-fns';

export function RedeemedRewardsTable() {
  const getRewardName = (rewardId: string) => {
    return rewards.find(r => r.id === rewardId)?.name || 'Unknown';
  };

  const getCustomerName = (customerId: string) => {
    return mockCustomers.find(c => c.id === customerId)?.name || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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
              <TableHead className="text-muted-foreground">Reward</TableHead>
              <TableHead className="text-muted-foreground">Points Used</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customerRewards.map((redemption) => (
              <TableRow key={redemption.id} className="border-border">
                <TableCell className="text-foreground">
                  {format(new Date(redemption.redeemedAt), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="text-foreground font-medium">
                  {getCustomerName(redemption.customerId)}
                </TableCell>
                <TableCell className="text-foreground">
                  {getRewardName(redemption.rewardId)}
                </TableCell>
                <TableCell className="text-foreground">{redemption.pointsUsed}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(redemption.status)}>
                    {redemption.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
