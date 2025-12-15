import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Gift, ArrowRight, LogOut, Mail, Phone, MapPin, Calendar, DollarSign, ShoppingBag, Plus, Check, Clock, Waves, Hand, Smile, MoreVertical } from 'lucide-react';
import { Reward, Service, fetchServices, createBooking, fetchBookings, Booking, redeemReward, checkRewards } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface CustomerData {
    id: number;
    name: string;
    email: string;
    phone: string;
    location: string;
    status: string;
    notes: string;
    points: number;
    last_purchase: string | null;
    created_at: string;
}

interface Purchase {
    id: number;
    amount: string;
    description: string;
    date: string;
}

interface Statistics {
    total_spent: number;
    total_purchases: number;
    total_visits: number;
}

interface PortalData {
    customer: CustomerData;
    statistics: Statistics;
    purchases: Purchase[];
    eligible_rewards: Reward[];
    redemptions: CustomerReward[];
}

const statusColors = {
    active: 'bg-green-100 text-green-700 border-green-200',
    inactive: 'bg-gray-100 text-gray-500 border-gray-200',
    vip: 'bg-purple-100 text-purple-700 border-purple-200',
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
};

const categoryIcons = {
    hair: Scissors,
    spa: Waves,
    nails: Hand,
    facial: Smile,
    other: MoreVertical,
};

const categoryColors = {
    hair: 'bg-purple-100 text-purple-700',
    spa: 'bg-pink-100 text-pink-700',
    nails: 'bg-rose-100 text-rose-700',
    facial: 'bg-fuchsia-100 text-fuchsia-700',
    other: 'bg-gray-100 text-gray-700',
};

export default function CustomerPortal() {
    const [customerData, setCustomerData] = useState<CustomerData | null>(null);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [redemptions, setRedemptions] = useState<CustomerReward[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const storedData = localStorage.getItem('customer_data');
        if (!storedData) {
            navigate('/login');
            return;
        }

        try {
            const parsedData: PortalData = JSON.parse(storedData);
            setCustomerData(parsedData.customer);
            setStatistics(parsedData.statistics);
            setPurchases(parsedData.purchases || []);
            setRewards(parsedData.eligible_rewards);
            setRedemptions(parsedData.redemptions || []);
            loadServices();
            loadBookings(parsedData.customer.id);

            // Fetch fresh data to ensure rewards are up to date
            refreshCustomerData(parsedData.customer.email || parsedData.customer.phone);
        } catch (error) {
            console.error('Failed to parse customer data', error);
            navigate('/login');
        }
    }, [navigate]);

    const refreshCustomerData = async (identifier: string) => {
        try {
            const data = await checkRewards(identifier);
            setCustomerData(data.customer);
            setStatistics(data.statistics);
            setPurchases(data.purchases || []);
            setRewards(data.eligible_rewards);
            setRedemptions(data.redemptions || []);
            // Update local storage too
            localStorage.setItem('customer_data', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to refresh customer data', error);
        }
    };

    const loadServices = async () => {
        try {
            const data = await fetchServices();
            setServices(data);
        } catch (error) {
            console.error('Failed to load services', error);
        }
    };

    const loadBookings = async (customerId: number) => {
        try {
            const data = await fetchBookings({ customer: customerId });
            setBookings(data);
        } catch (error) {
            console.error('Failed to load bookings', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('customer_data');
        navigate('/login');
    };

    const initiateBooking = (service: Service) => {
        setSelectedService(service);
        setBookingDate('');
        setBookingTime('');
    };

    const handleConfirmBooking = async () => {
        if (!customerData || !selectedService || !bookingDate || !bookingTime) {
            toast({
                title: "Error",
                description: "Please select both date and time.",
                variant: "destructive"
            });
            return;
        }

        setBookingLoading(true);
        const dateTime = new Date(`${bookingDate}T${bookingTime}`);

        try {
            await createBooking({
                customer: customerData.id,
                service: selectedService.id,
                staff_member: null,
                booking_date: dateTime.toISOString(),
                status: 'pending',
                notes: 'Booking request from Customer Portal'
            });

            toast({
                title: "Booking Request Sent!",
                description: `We've received your request for ${selectedService.name} on ${format(dateTime, 'MMM d, h:mm a')}. We'll confirm shortly.`,
            });
            setSelectedService(null);
            loadBookings(customerData.id); // Refresh bookings to update UI
        } catch (error) {
            toast({
                title: "Booking Failed",
                description: "Could not process your booking request. Please try again.",
                variant: "destructive"
            });
        } finally {
            setBookingLoading(false);
        }
    };

    const handleRedeem = async (reward: Reward) => {
        if (!customerData) return;

        try {
            await redeemReward({
                customer: customerData.id,
                reward: reward.id,
                date_claimed: new Date().toISOString()
            });

            toast({
                title: "Reward Redeemed!",
                description: `You have successfully redeemed: ${reward.name}`,
            });

            // Refresh data to show updated points and rewards
            // In a real app we'd refetch from backend, here we'll just reload the page for simplicity
            // or better, trigger a re-fetch of the check-rewards endpoint
            const response = await checkRewards(customerData.email || customerData.phone);
            setCustomerData(response.customer);
            setRewards(response.eligible_rewards);
            localStorage.setItem('customer_data', JSON.stringify(response));

        } catch (error) {
            toast({
                title: "Redemption Failed",
                description: "Could not redeem reward. Please try again.",
                variant: "destructive"
            });
        }
    };

    const getBookingStatus = (serviceId: number) => {
        // Find the most recent booking for this service that isn't cancelled or completed
        const booking = bookings.find(b =>
            b.service === serviceId &&
            (b.status === 'pending' || b.status === 'confirmed')
        );
        return booking ? booking.status : null;
    };

    if (!customerData || !statistics) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-purple-100">
                            <Scissors className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-xl font-display font-bold text-foreground">ClientPulse</span>
                    </div>
                    <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Welcome Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-display font-bold text-foreground">
                            Welcome Back, {customerData.name}!
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Manage your appointments and rewards
                        </p>
                    </div>

                    <Tabs defaultValue="dashboard" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md mx-auto">
                            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                            <TabsTrigger value="services">Book Services</TabsTrigger>
                        </TabsList>

                        <TabsContent value="dashboard" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Profile Card */}
                                <Card className="lg:col-span-1 animate-fade-in">
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col items-center text-center">
                                            <Avatar className="h-24 w-24 border-4 border-purple-100 mb-4">
                                                <AvatarFallback className="bg-purple-600 text-white text-2xl">
                                                    {customerData.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
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

                                {/* Stats & Details */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Card className="animate-fade-in">
                                            <CardContent className="pt-6">
                                                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 text-white">
                                                    <p className="text-purple-100 mb-1 text-sm">Loyalty Points</p>
                                                    <div className="text-5xl font-bold">{customerData.points}</div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                                            <CardContent className="pt-6 text-center">
                                                <DollarSign className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                                                <p className="text-2xl font-display font-semibold text-foreground">
                                                    KES {statistics.total_spent.toLocaleString()}
                                                </p>
                                                <p className="text-sm text-muted-foreground">Total Spent</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                            <CardContent className="pt-6 text-center">
                                                <ShoppingBag className="w-8 h-8 mx-auto text-pink-600 mb-2" />
                                                <p className="text-2xl font-display font-semibold text-foreground">
                                                    {statistics.total_visits}
                                                </p>
                                                <p className="text-sm text-muted-foreground">Total Visits</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Available Rewards */}
                                    <Card className="animate-fade-in">
                                        <CardHeader>
                                            <CardTitle className="font-display text-lg flex items-center gap-2">
                                                <Gift className="w-5 h-5 text-purple-600" />
                                                Available Rewards
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {rewards.length > 0 ? (
                                                <div className="space-y-3">
                                                    {rewards.map((reward) => {
                                                        const isPointsEligible = reward.points_required > 0 && customerData.points >= reward.points_required;
                                                        const isVisitsEligible = (reward.visits_required || 0) > 0 && customerData.visit_count >= (reward.visits_required || 0);
                                                        // If neither requirement is set, it's free/always available? Or if one is met?
                                                        // Logic: If points_required > 0, need points. If visits_required > 0, need visits.
                                                        // Usually rewards are EITHER points OR visits.
                                                        const isEligible = (reward.points_required > 0 && isPointsEligible) ||
                                                            ((reward.visits_required || 0) > 0 && isVisitsEligible) ||
                                                            (reward.points_required === 0 && (reward.visits_required || 0) === 0);

                                                        return (
                                                            <div key={reward.id} className={`flex items-center justify-between p-4 rounded-lg transition-colors ${isEligible ? 'bg-secondary/50 hover:bg-secondary/70' : 'bg-muted/30 opacity-75'}`}>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h3 className="font-semibold text-lg">{reward.name}</h3>
                                                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                                                            {reward.type}
                                                                        </Badge>
                                                                        {!isEligible && (
                                                                            <Badge variant="outline" className="border-gray-400 text-gray-500">
                                                                                Locked
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-muted-foreground text-sm">{reward.description}</p>
                                                                    {!isEligible && (
                                                                        <p className="text-xs text-orange-600 mt-1 font-medium">
                                                                            {reward.points_required > 0
                                                                                ? `Need ${reward.points_required - customerData.points} more points`
                                                                                : `Need ${(reward.visits_required || 0) - customerData.visit_count} more visits`
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-purple-700 text-lg">
                                                                        {reward.points_required > 0 ? `${reward.points_required} pts` : `${reward.visits_required} visits`}
                                                                    </div>
                                                                    <Button
                                                                        variant={isEligible ? "link" : "ghost"}
                                                                        className={isEligible ? "text-purple-600 p-0 h-auto font-medium" : "text-muted-foreground p-0 h-auto font-medium cursor-not-allowed"}
                                                                        onClick={() => isEligible && handleRedeem(reward)}
                                                                        disabled={!isEligible}
                                                                    >
                                                                        Redeem <ArrowRight className="w-4 h-4 ml-1" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
                                                    <p>No rewards available for your current point balance.</p>
                                                    <p className="text-sm mt-2">Keep earning points to unlock rewards!</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Purchase History */}
                                    <Card className="animate-fade-in">
                                        <CardHeader>
                                            <CardTitle className="font-display text-lg">Service History</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {(purchases.length > 0 || redemptions.length > 0) ? (
                                                <div className="space-y-3">
                                                    {/* Combine and sort history if needed, for now just stacking them */}
                                                    {redemptions.map((redemption) => (
                                                        <div
                                                            key={`r-${redemption.id}`}
                                                            className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 border border-green-100"
                                                        >
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <Gift className="w-4 h-4 text-green-600" />
                                                                    <p className="font-medium text-foreground">Redeemed: {redemption.reward_name}</p>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {format(new Date(redemption.date_claimed), 'MMM d, yyyy')}
                                                                </p>
                                                            </div>
                                                            <Badge variant="outline" className="text-green-600 border-green-200">
                                                                {redemption.status}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                    {purchases.map((purchase) => (
                                                        <div
                                                            key={`p-${purchase.id}`}
                                                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                                                        >
                                                            <div>
                                                                <p className="font-medium text-foreground">{purchase.description}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {format(new Date(purchase.date), 'MMM d, yyyy')}
                                                                </p>
                                                            </div>
                                                            <p className="font-semibold text-foreground">
                                                                KES {parseFloat(purchase.amount).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground text-center py-4">No service history available.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="services" className="space-y-6">
                            {/* Category Filter */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                <Button
                                    onClick={() => setSelectedCategory('all')}
                                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                                    className={selectedCategory === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                                >
                                    All Services
                                </Button>
                                <Button
                                    onClick={() => setSelectedCategory('hair')}
                                    variant={selectedCategory === 'hair' ? 'default' : 'outline'}
                                    className={selectedCategory === 'hair' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                                >
                                    <Scissors className="w-4 h-4 mr-2" />
                                    Hair
                                </Button>
                                <Button
                                    onClick={() => setSelectedCategory('spa')}
                                    variant={selectedCategory === 'spa' ? 'default' : 'outline'}
                                    className={selectedCategory === 'spa' ? 'bg-pink-600 hover:bg-pink-700' : ''}
                                >
                                    <Waves className="w-4 h-4 mr-2" />
                                    Spa
                                </Button>
                                <Button
                                    onClick={() => setSelectedCategory('nails')}
                                    variant={selectedCategory === 'nails' ? 'default' : 'outline'}
                                    className={selectedCategory === 'nails' ? 'bg-rose-600 hover:bg-rose-700' : ''}
                                >
                                    <Hand className="w-4 h-4 mr-2" />
                                    Nails
                                </Button>
                                <Button
                                    onClick={() => setSelectedCategory('facial')}
                                    variant={selectedCategory === 'facial' ? 'default' : 'outline'}
                                    className={selectedCategory === 'facial' ? 'bg-fuchsia-600 hover:bg-fuchsia-700' : ''}
                                >
                                    <Smile className="w-4 h-4 mr-2" />
                                    Facial
                                </Button>
                            </div>

                            {/* Grouped Services */}
                            {(() => {
                                const filteredServices = selectedCategory === 'all'
                                    ? services
                                    : services.filter(s => s.category === selectedCategory);

                                const groupedServices = filteredServices.reduce((acc, service) => {
                                    if (!acc[service.category]) {
                                        acc[service.category] = [];
                                    }
                                    acc[service.category].push(service);
                                    return acc;
                                }, {} as Record<string, Service[]>);

                                if (filteredServices.length === 0) {
                                    return (
                                        <div className="text-center py-12 bg-muted/30 rounded-xl">
                                            <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-lg font-medium text-foreground">No services available yet</p>
                                            <p className="text-muted-foreground">Please check back later for our service menu.</p>
                                        </div>
                                    );
                                }

                                return Object.entries(groupedServices).map(([category, categoryServices]) => {
                                    const Icon = categoryIcons[category as keyof typeof categoryIcons] || MoreVertical;

                                    return (
                                        <div key={category} className="mb-8">
                                            <h2 className="text-2xl font-display font-semibold mb-4 text-purple-900 flex items-center gap-2">
                                                <Icon className="w-6 h-6" />
                                                {category.charAt(0).toUpperCase() + category.slice(1)} Services
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {categoryServices.map((service) => {
                                                    const status = getBookingStatus(service.id);
                                                    return (
                                                        <Card key={service.id} className="hover:shadow-lg transition-all duration-300 border-purple-100">
                                                            <CardContent className="p-6">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <Badge className={categoryColors[category as keyof typeof categoryColors] || categoryColors.other}>
                                                                        {service.category}
                                                                    </Badge>
                                                                    <span className="font-bold text-lg text-purple-700">
                                                                        KES {parseFloat(service.price).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <h3 className="text-xl font-display font-bold text-foreground mb-2">
                                                                    {service.name}
                                                                </h3>
                                                                <p className="text-muted-foreground text-sm mb-4 min-h-[40px]">
                                                                    {service.description}
                                                                </p>
                                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                                        <ClockIcon className="w-4 h-4" />
                                                                        {service.duration} mins
                                                                    </span>
                                                                    {status === 'pending' ? (
                                                                        <Button disabled className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                                                                            <Clock className="w-4 h-4 mr-2" />
                                                                            Booked
                                                                        </Button>
                                                                    ) : status === 'confirmed' ? (
                                                                        <Button disabled className="bg-green-100 text-green-700 hover:bg-green-200">
                                                                            <Check className="w-4 h-4 mr-2" />
                                                                            Approved
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            onClick={() => initiateBooking(service)}
                                                                            className="bg-purple-600 hover:bg-purple-700 text-white"
                                                                        >
                                                                            <Plus className="w-4 h-4 mr-2" />
                                                                            Book Now
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Booking Dialog */}
                <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Book Appointment</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">{selectedService?.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {selectedService?.duration} mins • KES {selectedService ? parseFloat(selectedService.price).toLocaleString() : 0}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="time">Time</Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={bookingTime}
                                    onChange={(e) => setBookingTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedService(null)}>Cancel</Button>
                            <Button onClick={handleConfirmBooking} disabled={bookingLoading}>
                                {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}

function ClockIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
