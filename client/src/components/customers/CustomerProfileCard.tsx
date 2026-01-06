import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerData {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    status: string;
    notes: string;
    points: number;
    last_purchase: string | null;
    created_at: string;
    photo?: string;
    visit_count: number;
    tenant_id?: string;
}

interface CustomerProfileCardProps {
    customerData: CustomerData;
    onEdit: () => void;
    className?: string;
}

const statusColors = {
    active: 'bg-green-100 text-green-700 border-green-200',
    inactive: 'bg-gray-100 text-gray-500 border-gray-200',
    vip: 'bg-amber-100 text-amber-700 border-amber-200',
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
};

export function CustomerProfileCard({ customerData, onEdit, className }: CustomerProfileCardProps) {
    return (
        <Card className={`animate-fade-in ${className}`}>
            <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-2 -top-2 text-muted-foreground hover:tenant-brand-text"
                        onClick={onEdit}
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Avatar className="h-24 w-24 border-4 tenant-brand-border mb-4">
                        {customerData.photo ? (
                            <img
                                src={customerData.photo.startsWith('http') ? customerData.photo : `http://localhost:8000${customerData.photo}`}
                                alt={customerData.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <AvatarFallback className="tenant-brand-bg text-white text-2xl">
                                {customerData.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                        {customerData.name}
                    </h2>
                    <Badge
                        variant="outline"
                        className={statusColors[customerData.status as keyof typeof statusColors] || statusColors.active}
                    >
                        {customerData.status.toUpperCase()}
                    </Badge>

                    <div className="w-full mt-6 space-y-3">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            {customerData.email}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {customerData.phone}
                        </div>
                        {customerData.location && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                {customerData.location}
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Customer since {format(new Date(customerData.created_at), 'MMM yyyy')}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
