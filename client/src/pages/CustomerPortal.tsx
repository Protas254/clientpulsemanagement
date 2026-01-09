import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useCustomerPortal } from '@/hooks/useCustomerPortal';
import { useAuthStore } from '@/store/useAuthStore';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
    Camera,
    User,
    Search,
} from 'lucide-react';
import { Service, Reward, CustomerReward } from '@/services/api';

interface CustomerData {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    location: string;
    status: string;
    notes: string;
    points: number;
    last_purchase: string | null;
    created_at: string;
    photo?: string;
    visit_count: number;
    tenant_id?: string;
    is_minor: boolean;
    parent_id?: string;
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
    children: CustomerData[];
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
    hair: 'bg-amber-100 text-amber-900 border-amber-200',
    salon: 'bg-amber-100 text-amber-900 border-amber-200',
    barber: 'bg-sky-100 text-sky-900 border-sky-200',
    spa: 'bg-pink-100 text-pink-900 border-pink-200',
    nails: 'bg-rose-100 text-rose-900 border-rose-200',
    facial: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200',
    massage: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    makeup: 'bg-violet-100 text-violet-900 border-violet-200',
    body: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    packages: 'bg-orange-100 text-orange-900 border-orange-200',
    other: 'bg-slate-100 text-slate-900 border-slate-200',
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
        gallery,
        addChild,
        isAddingChild,
    } = useCustomerPortal();

    const customerData = portalData?.customer;
    const tenant = portalData?.tenant;
    const statistics = portalData?.statistics;
    const visits = portalData?.visits || [];
    const rewards = portalData?.eligible_rewards || [];
    const redemptions = portalData?.redemptions || [];
    const children = portalData?.children || [];
    const [bookingFor, setBookingFor] = useState<string>('me');

    // New child profile state
    const [isAddChildOpen, setIsAddChildOpen] = useState(false);
    const [childName, setChildName] = useState('');

    const handleAddChild = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!childName.trim()) return;

        addChild(childName, {
            onSuccess: () => {
                setIsAddChildOpen(false);
                setChildName('');
            }
        });
    };

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

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'dashboard';
    const searchQuery = (searchParams.get('search') || '').toLowerCase();

    const handleTabChange = (value: string) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('tab', value);
            return next;
        });
    };

    const filteredServices = services.filter(service => {
        const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
        const matchesSearch = !searchQuery ||
            service.name.toLowerCase().includes(searchQuery) ||
            service.description.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    const filteredGallery = gallery?.filter(item => {
        if (!searchQuery) return true;
        return (
            item.title?.toLowerCase().includes(searchQuery) ||
            item.description?.toLowerCase().includes(searchQuery) ||
            item.service_name?.toLowerCase().includes(searchQuery) ||
            item.staff_member_name?.toLowerCase().includes(searchQuery)
        );
    });

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

        const actualCustomerId = bookingFor === 'me' ? customerData.id : bookingFor;
        const bookedBy = bookingFor === 'me' ? undefined : customerData.id;

        confirmBooking({
            customer: actualCustomerId,
            booked_by_customer: bookedBy,
            service: selectedService.id,
            staff_member: null,
            booking_date: dateTime.toISOString(),
            status: 'pending',
            notes: `Booking request from ${customerData.name}${bookingFor !== 'me' ? ' for their child' : ''}`
        }, {
            onSuccess: () => {
                setSelectedService(null);
                setBookingFor('me');
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

    const getBookingStatus = (serviceId: string) => {
        // Find the most recent booking for this service that isn't cancelled or completed
        const booking = bookings.find(b =>
            b.service === serviceId &&
            (b.status === 'pending' || b.status === 'confirmed')
        );
        return booking ? booking.status : null;
    };

    //     if (isLoading) {
    //         return (
    //             <div className="min-h-screen flex items-center justify-center">
    //                 <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
    //             </div>
    //         );
    //     }

    if (!customerData || !statistics) {
        if (isLoading) {
            return (
                <div className="min-h-screen bg-background flex flex-col animate-pulse">
                    <header className="border-b h-16 bg-muted/20" />
                    <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
                        <div className="space-y-4 text-center">
                            <div className="h-10 bg-muted rounded w-1/3 mx-auto" />
                            <div className="h-6 bg-muted/50 rounded w-1/4 mx-auto" />
                        </div>

                        <div className="flex justify-center gap-4 mb-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-10 w-32 bg-muted rounded-md" />
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-muted rounded-xl" />
                            ))}
                        </div>
                        <div className="h-96 bg-muted rounded-xl" />
                    </main>
                </div>
            )
        }
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

                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsContent value="dashboard" className="space-y-6">
                            <div className="space-y-6">
                                {/* Stats & Details */}
                                <div className="space-y-6">
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Card className="animate-fade-in overflow-hidden border-0 shadow-lg group hover:scale-[1.02] transition-transform duration-300">
                                            <CardContent className="p-0">
                                                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white text-center relative overflow-hidden">
                                                    <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                                                    <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-black/10 rounded-full blur-2xl" />
                                                    <p className="text-white/80 mb-2 text-sm font-medium uppercase tracking-wider">Loyalty Points</p>
                                                    <div className="text-6xl font-bold font-display drop-shadow-md">{customerData.points}</div>
                                                    <div className="mt-2 text-xs text-white/60">Points available for redemption</div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="animate-fade-in border-0 shadow-md group hover:shadow-lg transition-shadow duration-300 bg-white" style={{ animationDelay: '0.1s' }}>
                                            <CardContent className="p-6 text-center flex flex-col items-center justify-center">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                                                    <DollarSign className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <p className="text-3xl font-display font-bold text-slate-800">
                                                    KES {statistics.total_spent.toLocaleString()}
                                                </p>
                                                <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">Total Investment</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="animate-fade-in border-0 shadow-md group hover:shadow-lg transition-shadow duration-300 bg-white" style={{ animationDelay: '0.2s' }}>
                                            <CardContent className="p-6 text-center flex flex-col items-center justify-center">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
                                                    <ShoppingBag className="w-6 h-6 text-amber-600" />
                                                </div>
                                                <p className="text-3xl font-display font-bold text-slate-800">
                                                    {statistics.total_visits}
                                                </p>
                                                <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">Total Experiences</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Available Rewards */}
                                    <Card className="animate-fade-in">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="font-display text-lg flex items-center gap-2">
                                                    <Gift className="w-5 h-5 tenant-brand-text" />
                                                    Available Rewards
                                                </CardTitle>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsAddChildOpen(true)}
                                                    className="tenant-brand-border tenant-brand-text hover:tenant-brand-bg-soft h-8"
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Add Family Member
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {rewards.length > 0 ? (
                                                <div className="space-y-3">
                                                    {rewards.map((reward) => {
                                                        const isPointsEligible = reward.points_required > 0 && customerData.points >= reward.points_required;
                                                        const isVisitsEligible = (reward.visits_required || 0) > 0 && customerData.visit_count >= (reward.visits_required || 0);
                                                        const isEligible = (reward.points_required > 0 && isPointsEligible) ||
                                                            ((reward.visits_required || 0) > 0 && isVisitsEligible) ||
                                                            (reward.points_required === 0 && (reward.visits_required || 0) === 0);

                                                        return (
                                                            <div key={reward.id} className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 border-l-4 ${isEligible ? 'bg-slate-50 border-amber-500 hover:bg-slate-100 shadow-sm' : 'bg-slate-50/50 border-slate-300 opacity-75'}`}>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h3 className="font-bold text-slate-800 text-lg">{reward.name}</h3>
                                                                        <Badge className={isEligible ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-0' : 'bg-slate-200 text-slate-600 hover:bg-slate-200 border-0'}>
                                                                            {reward.type}
                                                                        </Badge>
                                                                        {!isEligible && (
                                                                            <Badge variant="outline" className="border-slate-300 text-slate-500">
                                                                                Locked
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-slate-500 text-sm max-w-md">{reward.description}</p>
                                                                    {!isEligible && (
                                                                        <div className="flex items-center gap-1 mt-2">
                                                                            <Clock className="w-3 h-3 text-orange-500" />
                                                                            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">
                                                                                {reward.points_required > 0
                                                                                    ? `${reward.points_required - customerData.points} points to go`
                                                                                    : `${(reward.visits_required || 0) - customerData.visit_count} visits to go`
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className={`font-black text-xl ${isEligible ? 'text-amber-600' : 'text-slate-400'}`}>
                                                                        {reward.points_required > 0 ? `${reward.points_required} pts` : `${reward.visits_required} visits`}
                                                                    </div>
                                                                    <Button
                                                                        variant={isEligible ? "default" : "secondary"}
                                                                        size="sm"
                                                                        className={isEligible ? "tenant-brand-bg mt-2 px-6 rounded-full shadow-md hover:shadow-lg transition-all" : "mt-2 px-6 rounded-full opacity-50 cursor-not-allowed"}
                                                                        onClick={() => isEligible && handleRedeemReward(reward)}
                                                                        disabled={!isEligible}
                                                                    >
                                                                        {isEligible ? 'Claim Now' : 'Claim Locked'}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-100 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                        <Gift className="w-32 h-32" />
                                                    </div>
                                                    <div className="relative z-10">
                                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                                                            <Gift className="w-8 h-8 text-slate-300" />
                                                        </div>
                                                        <p className="text-lg font-bold text-slate-800">No rewards available yet</p>
                                                        <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">Continue your journey with us! Points from your next visit will bring you closer to exclusive gifts.</p>
                                                        <Button variant="link" onClick={() => handleTabChange('services')} className="mt-4 text-amber-600 font-bold">
                                                            View Services Menu <ArrowRight className="w-4 h-4 ml-1" />
                                                        </Button>
                                                    </div>
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
                                                <div className="space-y-4">
                                                    {/* Visits History with Rating Button */}
                                                    {visits.map((visit) => (
                                                        <div
                                                            key={`v-${visit.id}`}
                                                            className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 border-l-[6px] border-l-amber-500"
                                                        >
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-bold text-slate-800 text-lg">
                                                                        {visit.services_detail?.map((s: any) => s.name).join(', ') || 'Service'}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-slate-500 text-sm">
                                                                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                                        <Calendar className="w-3.5 h-3.5" />
                                                                        {format(new Date(visit.visit_date), 'MMM d, yyyy')}
                                                                    </span>
                                                                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                                        <User className="w-3.5 h-3.5" />
                                                                        {visit.staff_member_name || 'Staff'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-3">
                                                                <p className="text-xl font-black text-slate-900">
                                                                    KES {parseFloat(visit.total_amount).toLocaleString()}
                                                                </p>
                                                                {visit.has_review ? (
                                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold ring-1 ring-emerald-100">
                                                                        <Check className="w-3 h-3" />
                                                                        Reviewed
                                                                    </div>
                                                                ) : (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-8 rounded-full text-xs font-bold border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 shadow-sm"
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
                                                            className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/50 shadow-sm border-l-[6px] border-l-emerald-400"
                                                        >
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                                        <Gift className="w-4 h-4 text-emerald-600" />
                                                                    </div>
                                                                    <p className="font-bold text-slate-800">Reward Claimed: {redemption.reward_name}</p>
                                                                </div>
                                                                <p className="text-xs text-slate-500 ml-10">
                                                                    Claimed on {format(new Date(redemption.date_claimed), 'MMM d, yyyy')}
                                                                </p>
                                                            </div>
                                                            <Badge className="bg-emerald-500 text-white border-0 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                                {redemption.status}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                    <p className="text-slate-400 font-medium">Your service history will appear here once you visit us.</p>
                                                </div>
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
                                            <h2 className="text-xl font-display font-medium mb-6 text-slate-800 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                                    <Icon className="w-5 h-5 text-slate-600" />
                                                </div>
                                                {category.charAt(0).toUpperCase() + category.slice(1)} Selection
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {categoryServices.map((service) => {
                                                    const status = getBookingStatus(service.id);
                                                    return (
                                                        <Card key={service.id} className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-slate-100 overflow-hidden relative">
                                                            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                                                                    <Plus className="w-4 h-4 text-emerald-600" />
                                                                </div>
                                                            </div>
                                                            <CardContent className="p-6">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${categoryColors[category as keyof typeof categoryColors] || categoryColors.other}`}>
                                                                        {service.category}
                                                                    </Badge>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="font-black text-xl text-slate-900">
                                                                            KES {parseFloat(service.price).toLocaleString()}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pricing</span>
                                                                    </div>
                                                                </div>
                                                                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-amber-600 transition-colors">
                                                                    {service.name}
                                                                </h3>
                                                                <p className="text-slate-500 text-sm mb-6 line-clamp-2 min-h-[40px]">
                                                                    {service.description}
                                                                </p>
                                                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-tighter">
                                                                            <Clock className="w-3.5 h-3.5" />
                                                                            {service.duration} MINS
                                                                        </span>
                                                                    </div>
                                                                    {status === 'pending' ? (
                                                                        <Button disabled className="bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-full h-9 border-amber-100 border px-6 text-xs font-black uppercase tracking-tighter">
                                                                            <Clock className="w-3 h-3 mr-1.5" />
                                                                            Pending
                                                                        </Button>
                                                                    ) : status === 'confirmed' ? (
                                                                        <Button disabled className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-full h-9 border-emerald-100 border px-6 text-xs font-black uppercase tracking-tighter">
                                                                            <Check className="w-3 h-3 mr-1.5" />
                                                                            Confirmed
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            onClick={() => initiateBooking(service)}
                                                                            className="rounded-full h-9 px-6 text-xs font-black uppercase tracking-widest bg-slate-900 border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                                                                            disabled={isBookingLoading}
                                                                        >
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
                            {filteredServices.length === 0 && (
                                <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                    <Search className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                    <h3 className="text-xl font-semibold text-slate-900">No services found</h3>
                                    <p className="text-slate-500">Try adjusting your search or category filters</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="portfolio" className="space-y-6">
                            <div className="text-center space-y-2 mb-8">
                                <h2 className="text-3xl font-display font-bold text-slate-800 flex items-center justify-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm">
                                        <Camera className="w-6 h-6 text-amber-600" />
                                    </div>
                                    Our Work Gallery
                                </h2>
                                <p className="text-slate-500 font-medium max-w-lg mx-auto">Take a look at some of the stunning transformations and artistic details we've delivered recently</p>
                            </div>

                            {filteredGallery && filteredGallery.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredGallery.map((image: any) => (
                                        <Card key={image.id} className="overflow-hidden group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2rem]">
                                            <div className="relative aspect-[4/5] overflow-hidden">
                                                <img
                                                    src={image.image.startsWith('http') ? image.image : `http://localhost:8000${image.image}`}
                                                    alt={image.title || "Gallery Image"}
                                                    className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                        <h3 className="text-white font-bold text-xl mb-1">{image.title}</h3>
                                                        <p className="text-white/70 text-sm line-clamp-2 mb-3">{image.description}</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {image.service_name && (
                                                                <Badge className="bg-amber-500 text-white border-0 text-[10px] font-bold uppercase tracking-widest px-2 group-hover:bg-white group-hover:text-amber-600 transition-colors">
                                                                    {image.service_name}
                                                                </Badge>
                                                            )}
                                                            {image.staff_member_name && (
                                                                <Badge className="bg-white/20 text-white border-0 text-[10px] font-bold uppercase tracking-widest px-2 backdrop-blur-md">
                                                                    {image.staff_member_name}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-24 bg-gradient-to-tr from-slate-50 via-slate-100 to-amber-50/20 rounded-[3rem] border-2 border-dashed border-slate-200 shadow-inner relative overflow-hidden">
                                    <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-200/20 rounded-full blur-3xl" />
                                    <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl" />
                                    <div className="relative z-10 max-w-sm mx-auto space-y-6">
                                        <div className="w-24 h-24 bg-white rounded-[2rem] rotate-12 flex items-center justify-center mx-auto shadow-2xl ring-1 ring-slate-100 hover:rotate-0 transition-all duration-500">
                                            <Camera className="w-12 h-12 text-amber-500 -rotate-12 hover:rotate-0 transition-all duration-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Gallery is empty</h3>
                                            <p className="text-slate-500 mt-2 font-medium">We're curating some amazing moments to share with you. Explore our services while you wait!</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="rounded-full border-2 border-slate-200 font-bold hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                                            onClick={() => navigate('/services')}
                                        >
                                            View Services
                                        </Button>
                                    </div>
                                </div>
                            )}
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
                                        <Button type="submit" className="w-full bg-amber-900 hover:bg-amber-800 text-white font-bold" disabled={isContactLoading}>
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
                            <DialogDescription>
                                Select a date and time for your appointment
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">{selectedService?.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedService?.duration} mins • KES {selectedService ? parseFloat(selectedService.price).toLocaleString() : 0}
                                    </p>
                                </div>

                                {children.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="booking-for">Who is this booking for?</Label>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant={bookingFor === 'me' ? 'default' : 'outline'}
                                                className={bookingFor === 'me' ? 'tenant-brand-bg' : ''}
                                                size="sm"
                                                onClick={() => setBookingFor('me')}
                                            >
                                                Myself
                                            </Button>
                                            {children.map((child) => (
                                                <Button
                                                    key={child.id}
                                                    variant={bookingFor === child.id ? 'default' : 'outline'}
                                                    className={bookingFor === child.id ? 'tenant-brand-bg' : ''}
                                                    size="sm"
                                                    onClick={() => setBookingFor(child.id)}
                                                >
                                                    {child.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                            <DialogDescription>
                                Update your personal information and profile photo
                            </DialogDescription>
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
                {/* Add Child Dialog */}
                <Dialog open={isAddChildOpen} onOpenChange={setIsAddChildOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add Family Member</DialogTitle>
                            <DialogDescription>
                                Create a profile for your child or minor. You can book services for them.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddChild}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="child-name">Full Name</Label>
                                    <Input
                                        id="child-name"
                                        placeholder="Enter name (e.g. Brian Junior)"
                                        value={childName}
                                        onChange={(e) => setChildName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAddChildOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isAddingChild} className="tenant-brand-bg">
                                    {isAddingChild ? 'Adding...' : 'Add Member'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}


