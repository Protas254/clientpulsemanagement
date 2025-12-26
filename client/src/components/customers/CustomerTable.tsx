import { Customer } from '@/types/customer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit2, Trash2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CustomerTableProps {
  customers: Customer[];
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

const statusColors = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  vip: 'bg-caramel/10 text-caramel border-caramel/20',
};

export function CustomerTable({ customers, onEdit, onDelete }: CustomerTableProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50">
            <TableHead className="font-semibold">Customer</TableHead>
            <TableHead className="font-semibold">Phone</TableHead>
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="font-semibold">Last Purchase</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Last Purchase</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow
              key={customer.id}
              className="hover:bg-secondary/30 transition-colors cursor-pointer"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-caramel/20">
                    {customer.photo ? (
                      <img
                        src={customer.photo.startsWith('http') ? customer.photo : `http://localhost:8000${customer.photo}`}
                        alt={customer.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{customer.phone}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={statusColors[customer.status]}
                >
                  {customer.status.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                {customer.last_purchase ? (
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-3 h-3 mr-2" />
                    {format(new Date(customer.last_purchase), 'MMM d, yyyy')}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit?.(customer)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete?.(customer)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
