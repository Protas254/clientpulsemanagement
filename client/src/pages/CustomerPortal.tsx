import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useCustomerPortal } from '@/hooks/useCustomerPortal';
import { useAuthStore } from '@/store/useAuthStore';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TopNav } from '@/components/layout/TopNav';
import {
    Scissors,
    Waves,
    Hand,
    Smile,
    Plus,
    MoreVertical,
    Edit,
    Mail,
    Phone,
    MapPin,
    Calendar,
    DollarSign,
    ShoppingBag,
    Gift,
    ArrowRight,
    Clock,
    Check,
    Camera
} from 'lucide-react';
import { Service, Reward, CustomerReward } from '@/services/api';

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

interface Purchase {
    id: string;
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
    tenant: any;
    statistics: Statistics;
    purchases: Purchase[];
    visits: any[];
    eligible_rewards: Reward[];
    redemptions: CustomerReward[];
}

const statusColors = {
    active: 'bg-green-100 text-green-700 border-green-200',
    inactive: 'bg-gray-100 text-gray-500 border-gray-200',
    vip: 'bg-amber-100 text-amber-700 border-amber-200',
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
};

const categoryIcons = {
    hair: Scissors,
    salon: Scissors,
    barber: Scissors,
    spa: Waves,
    nails: Hand,
    facial: Smile,
    massage: Waves,
    makeup: Smile,
    body: Waves,
    packages: Plus,
    other: MoreVertical,
};

const categoryColors = {
    hair: 'bg-amber-100 text-amber-700',
    salon: 'bg-amber-100 text-amber-700',
    barber: 'bg-blue-100 text-blue-700',
    spa: 'bg-pink-100 text-pink-700',
    nails: 'bg-rose-100 text-rose-700',
    facial: 'bg-fuchsia-100 text-fuchsia-700',
    massage: 'bg-indigo-100 text-indigo-700',
    makeup: 'bg-purple-100 text-purple-700',
    body: 'bg-emerald-100 text-emerald-700',
    packages: 'bg-orange-100 text-orange-700',
    other: 'bg-gray-100 text-gray-700',
};

export default function CustomerPortal() {
    const {
        portalData,
        isLoading,
        services,
        bookings,
        updateProfile,
        isUpdating,
        confirmBooking,
        isBookingLoading,
        redeemReward,
        sendContact,
        isContactLoading,
    } = useCustomerPortal();

    const customerData = portalData?.customer;
    const tenant = portalData?.tenant;
    const statistics = portalData?.statistics;
    const visits = portalData?.visits || [];
    const rewards = portalData?.eligible_rewards || [];
    const redemptions = portalData?.redemptions || [];

    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Profile edit state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editPhoto, setEditPhoto] = useState<File | null>(null);

    // Contact form state
    const [contactSubject, setContactSubject] = useState('');
    const [contactMessage, setContactMessage] = useState('');

    const navigate = useNavigate();
    const { toast } = useToast();

    const openEditModal = () => {
        if (customerData) {
            setEditName(customerData.name);
            setEditEmail(customerData.email);
            setEditPhone(customerData.phone);
            setIsEditModalOpen(true);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerData) return;

        const formData = new FormData();
        formData.append('name', editName);
        formData.append('email', editEmail);
        formData.append('phone', editPhone);
        if (editPhoto) {
            formData.append('photo', editPhoto);
        }

        updateProfile({ id: customerData.id, data: formData }, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditPhoto(null);
            }
        });
    };

    // Remove useEffect for initial load as React Query handles it
    // Remove refreshCustomerData, loadServices, loadBookings as React Query handles them

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

        const dateTimeStr = `${bookingDate}T${bookingTime}`;
        const dateTime = new Date(dateTimeStr);

        if (isNaN(dateTime.getTime())) {
            toast({ title: "Error", description: "Invalid date or time selected.", variant: "destructive" });
            return;
        }

        confirmBooking({
            customer: customerData.id,
            service: selectedService.id,
            staff_member: null,
            booking_date: dateTime.toISOString(),
            status: 'pending',
            notes: 'Booking request from Customer Portal'
        }, {
            onSuccess: () => {
                setSelectedService(null);
            }
        });
    };

    const handleRedeemReward = async (reward: Reward) => {
        if (!customerData) return;
        redeemReward({
            customer: customerData.id,
            reward: reward.id,
            date_claimed: new Date().toISOString()
        });
    };

    const handleSendContactMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerData) return;

        if (!contactSubject || !contactMessage) {
            toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
            return;
        }

        sendContact({
            tenant: customerData.tenant_id,
            full_name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            subject: contactSubject,
            message: contactMessage
        }, {
            onSuccess: () => {
                setContactSubject('');
                setContactMessage('');
            }
        });
    };

    const getBookingStatus = (serviceId: number) => {
        // Find the most recent booking for this service that isn't cancelled or completed
        const booking = bookings.find(b =>
            b.service === serviceId &&
            (b.status === 'pending' || b.status === 'confirmed')
        );
        return booking ? booking.status : null;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!customerData || !statistics) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">No customer data found.</p>
                <Button onClick={() => navigate('/login')}>Return to Login</Button>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-background flex flex-col"
            style={{
                '--tenant-primary': tenant?.primary_color || '#D97706',
                '--tenant-primary-foreground': '#ffffff'
            } as React.CSSProperties}
        >
            <TopNav
                title={`Hello, ${customerData.name}`}
                subtitle={tenant?.name || "Customer Portal"}
                logo={tenant?.logo}
            />

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
                        <TabsList className="grid w-full grid-cols-3 mb-8 max-w-md mx-auto">
                            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                            <TabsTrigger value="services">Book Services</TabsTrigger>
                            <TabsTrigger value="contact">Contact Us</TabsTrigger>
                        </TabsList>

                        <TabsContent value="dashboard" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Profile Card */}
                                <Card className="lg:col-span-1 animate-fade-in">
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col items-center text-center relative">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute -right-2 -top-2 text-muted-foreground hover:tenant-brand-text"
                                                onClick={openEditModal}
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

                                {/* Stats & Details */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Card className="animate-fade-in">
                                            <CardContent className="pt-6">
                                                <div className="text-center p-4 rounded-xl tenant-brand-bg shadow-lg">
                                                    <p className="opacity-80 mb-1 text-sm">Loyalty Points</p>
                                                    <div className="text-5xl font-bold">{customerData.points}</div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                                            <CardContent className="pt-6 text-center">
                                                <DollarSign className="w-8 h-8 mx-auto tenant-brand-text mb-2" />
                                                <p className="text-2xl font-display font-semibold text-foreground">
                                                    KES {statistics.total_spent.toLocaleString()}
                                                </p>
                                                <p className="text-sm text-muted-foreground">Total Spent</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                            <CardContent className="pt-6 text-center">
                                                <ShoppingBag className="w-8 h-8 mx-auto text-orange-600 mb-2" />
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
                                                <Gift className="w-5 h-5 tenant-brand-text" />
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
                                                                        <Badge variant="secondary" className="tenant-brand-bg-soft">
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
                                                                    <div className="font-bold tenant-brand-text text-lg">
                                                                        {reward.points_required > 0 ? `${reward.points_required} pts` : `${reward.visits_required} visits`}
                                                                    </div>
                                                                    <Button
                                                                        variant={isEligible ? "link" : "ghost"}
                                                                        className={isEligible ? "tenant-brand-text p-0 h-auto font-medium" : "text-muted-foreground p-0 h-auto font-medium cursor-not-allowed"}
                                                                        onClick={() => isEligible && handleRedeemReward(reward)}
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

                                    {/* Service History */}
                                    <Card className="animate-fade-in">
                                        <CardHeader>
                                            <CardTitle className="font-display text-lg">Service History</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {(visits.length > 0 || redemptions.length > 0) ? (
                                                <div className="space-y-3">
                                                    {/* Visits History with Rating Button */}
                                                    {visits.map((visit) => (
                                                        <div
                                                            key={`v-${visit.id}`}
                                                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border tenant-brand-border/50"
                                                        >
                                                            <div>
                                                                <p className="font-medium text-foreground">
                                                                    {visit.services_detail?.map((s: any) => s.name).join(', ') || 'Service'}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {format(new Date(visit.visit_date), 'MMM d, yyyy')} • {visit.staff_member_name || 'Staff'}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <p className="font-semibold text-foreground">
                                                                    KES {parseFloat(visit.total_amount).toLocaleString()}
                                                                </p>
                                                                {visit.has_review ? (
                                                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                                        Reviewed
                                                                    </Badge>
                                                                ) : (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-7 text-xs tenant-brand-border tenant-brand-text hover:tenant-brand-bg-soft"
                                                                        onClick={() => navigate(`/review/${visit.id}`)}
                                                                    >
                                                                        Rate Service
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Redemption History */}
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
                                    className={selectedCategory === 'all' ? 'tenant-brand-bg hover:opacity-90' : ''}
                                >
                                    All Services
                                </Button>
                                <Button
                                    onClick={() => setSelectedCategory('hair')}
                                    variant={selectedCategory === 'hair' ? 'default' : 'outline'}
                                    className={selectedCategory === 'hair' ? 'tenant-brand-bg hover:opacity-90' : ''}
                                >
                                    <Scissors className="w-4 h-4 mr-2" />
                                    Hair
                                </Button>
                                <Button
                                    onClick={() => setSelectedCategory('massage')}
                                    variant={selectedCategory === 'massage' ? 'default' : 'outline'}
                                    className={selectedCategory === 'massage' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                                >
                                    <Waves className="w-4 h-4 mr-2" />
                                    Massage
                                </Button>
                                <Button
                                    onClick={() => setSelectedCategory('makeup')}
                                    variant={selectedCategory === 'makeup' ? 'default' : 'outline'}
                                    className={selectedCategory === 'makeup' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                                >
                                    <Smile className="w-4 h-4 mr-2" />
                                    Makeup
                                </Button>
                                <Button
                                    onClick={() => setSelectedCategory('body')}
                                    variant={selectedCategory === 'body' ? 'default' : 'outline'}
                                    className={selectedCategory === 'body' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                >
                                    <Waves className="w-4 h-4 mr-2" />
                                    Body
                                </Button>
                                <Button
                                    onClick={() => setSelectedCategory('spa')}
                                    variant={selectedCategory === 'spa' ? 'default' : 'outline'}
                                    className={selectedCategory === 'spa' ? 'bg-orange-600 hover:bg-orange-700' : ''}
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
                                <Button
                                    onClick={() => setSelectedCategory('packages')}
                                    variant={selectedCategory === 'packages' ? 'default' : 'outline'}
                                    className={selectedCategory === 'packages' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Packages
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
                                            <h2 className="text-2xl font-display font-semibold mb-4 text-amber-900 flex items-center gap-2">
                                                <Icon className="w-6 h-6" />
                                                {category.charAt(0).toUpperCase() + category.slice(1)} Services
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {categoryServices.map((service) => {
                                                    const status = getBookingStatus(service.id);
                                                    return (
                                                        <Card key={service.id} className="hover:shadow-lg transition-all duration-300 border-amber-100">
                                                            <CardContent className="p-6">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <Badge className={categoryColors[category as keyof typeof categoryColors] || categoryColors.other}>
                                                                        {service.category}
                                                                    </Badge>
                                                                    <span className="font-bold text-lg text-amber-700">
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
                                                                        <Clock className="w-4 h-4" />
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
                                                                            className="tenant-brand-bg hover:opacity-90 text-white"
                                                                            disabled={isBookingLoading}
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

                        <TabsContent value="contact" className="space-y-6">
                            <Card className="max-w-2xl mx-auto">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="w-5 h-5 tenant-brand-text" />
                                        Contact Business Owner
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSendContactMessage} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Full Name</Label>
                                                <Input value={customerData.name} disabled className="bg-muted" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email</Label>
                                                <Input value={customerData.email} disabled className="bg-muted" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Subject</Label>
                                            <Input
                                                id="subject"
                                                placeholder="What is this regarding?"
                                                value={contactSubject}
                                                onChange={(e) => setContactSubject(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="message">Message</Label>
                                            <textarea
                                                id="message"
                                                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="Type your message here..."
                                                value={contactMessage}
                                                onChange={(e) => setContactMessage(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <Button type="submit" className="w-full tenant-brand-bg hover:opacity-90" disabled={isContactLoading}>
                                            {isContactLoading ? 'Sending...' : 'Send Message'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
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
                            <Button onClick={handleConfirmBooking} disabled={isBookingLoading}>
                                {isBookingLoading ? 'Booking...' : 'Confirm Booking'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Profile Dialog */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="grid gap-4 py-4">
                                <div className="flex flex-col items-center gap-4 mb-4">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 border-2 tenant-brand-border-soft">
                                            {editPhoto ? (
                                                <img src={URL.createObjectURL(editPhoto)} alt="Preview" className="h-full w-full object-cover" />
                                            ) : customerData.photo ? (
                                                <img src={customerData.photo.startsWith('http') ? customerData.photo : `http://localhost:8000${customerData.photo}`} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                <AvatarFallback className="tenant-brand-bg text-white text-2xl">
                                                    {customerData.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <label
                                            htmlFor="photo-upload"
                                            className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                                        >
                                            <Camera className="w-6 h-6" />
                                        </label>
                                        <input
                                            id="photo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => setEditPhoto(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Click to upload new photo</p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Full Name</Label>
                                    <Input
                                        id="edit-name"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-email">Email Address</Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-phone">Phone Number</Label>
                                    <Input
                                        id="edit-phone"
                                        value={editPhone}
                                        onChange={(e) => setEditPhone(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isUpdating}>
                                    {isUpdating ? 'Updating...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}


