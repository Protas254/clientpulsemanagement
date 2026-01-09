import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    Users,
    Calendar,
    MessageSquare,
    Award,
    DollarSign,
    Scissors,
    UserCog,
    Bell,
    TrendingUp,
    MoreVertical
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

interface Tenant {
    id: string;
    name: string;
    business_type: string;
    city: string;
    phone_number: string;
    is_active: boolean;
    created_at: string;
}

interface ContactMessage {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
}

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    visit_count: number;
    points: number;
    status: string;
}

interface Booking {
    id: string;
    customer: { name: string };
    service: { name: string };
    booking_date: string;
    status: string;
}

interface Service {
    id: string;
    name: string;
    category: string;
    price: string;
    is_active: boolean;
}

const TenantManagement = () => {
    const { tenantId } = useParams<{ tenantId: string }>();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (tenantId) {
            fetchTenantData();
        }
    }, [tenantId]);

    const fetchTenantData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Token ${token}`,
            };

            // Fetch tenant details
            const tenantResponse = await fetch(`http://localhost:8000/api/tenants/${tenantId}/`, { headers });
            if (tenantResponse.ok) {
                const tenantData = await tenantResponse.json();
                setTenant(tenantData);
            }

            // Fetch contact messages for this tenant
            const messagesResponse = await fetch(`http://localhost:8000/api/contact-messages/?tenant=${tenantId}`, { headers });
            if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json();
                setContactMessages(messagesData);
            }

            // Fetch customers
            const customersResponse = await fetch(`http://localhost:8000/api/customers/?tenant=${tenantId}`, { headers });
            if (customersResponse.ok) {
                const customersData = await customersResponse.json();
                setCustomers(customersData);
            }

            // Fetch bookings
            const bookingsResponse = await fetch(`http://localhost:8000/api/bookings/?tenant=${tenantId}`, { headers });
            if (bookingsResponse.ok) {
                const bookingsData = await bookingsResponse.json();
                setBookings(bookingsData);
            }

            // Fetch services
            const servicesResponse = await fetch(`http://localhost:8000/api/services/?tenant=${tenantId}`, { headers });
            if (servicesResponse.ok) {
                const servicesData = await servicesResponse.json();
                setServices(servicesData);
            }

        } catch (error) {
            console.error('Error fetching tenant data:', error);
            toast.error('Error loading tenant data');
        } finally {
            setLoading(false);
        }
    };
    const handleApproveTenant = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/tenants/${tenantId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_active: true, status: 'active' }),
            });

            if (response.ok) {
                toast.success('Tenant approved successfully');
                fetchTenantData(); // Refresh the data
            } else {
                toast.error('Failed to approve tenant');
            }
        } catch (error) {
            console.error('Error approving tenant:', error);
            toast.error('Error approving tenant');
        }
    };

    //    if (loading) {
    //        return (
    //            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
    //                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
    //            </div>
    //        );
    //    }

    if (!tenant) {
        if (loading) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-8">
                    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
                        {/* Header Skeleton */}
                        <div className="bg-white h-24 rounded-xl shadow-sm mb-8" />

                        {/* Stats Grid Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white h-32 rounded-xl shadow-lg" />
                            ))}
                        </div>

                        {/* Main Content Skeleton */}
                        <div className="bg-white h-96 rounded-xl shadow-lg" />
                    </div>
                </div>
            );
        }
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
                <Card className="bg-white border-amber-200 shadow-lg">
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-600">Tenant not found</p>
                        <Button onClick={() => navigate('/super-admin')} className="mt-4 bg-amber-600 hover:bg-amber-700">
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
            {/* Header */}
            <div className="bg-white border-b border-amber-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/super-admin')}
                                className="hover:bg-amber-50"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{tenant.name}</h1>
                                <div className="flex items-center space-x-2 sm:space-x-3 mt-2 flex-wrap">
                                    <Badge
                                        variant={tenant.is_active ? "default" : "secondary"}
                                        className={tenant.is_active ? "bg-green-500" : "bg-gray-400"}
                                    >
                                        {tenant.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                                        {tenant.business_type}
                                    </Badge>
                                    <span className="text-sm text-gray-600">📍 {tenant.city}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {!tenant.is_active && (
                                <Button
                                    onClick={handleApproveTenant}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Approve Business
                                </Button>
                            )}
                        </div>

                        {/* Mobile Kebab Menu */}
                        <div className="lg:hidden">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="hover:bg-amber-50">
                                        <MoreVertical className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem onClick={() => setActiveTab('overview')}>
                                        <TrendingUp className="h-4 w-4 mr-2" />
                                        Overview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setActiveTab('bookings')}>
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Bookings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setActiveTab('customers')}>
                                        <Users className="h-4 w-4 mr-2" />
                                        Customers
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setActiveTab('services')}>
                                        <Scissors className="h-4 w-4 mr-2" />
                                        Services
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setActiveTab('messages')}>
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Contact Messages
                                        {contactMessages.length > 0 && (
                                            <Badge className="ml-2 bg-red-500 text-xs">{contactMessages.length}</Badge>
                                        )}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    {/* Desktop Tabs - Hidden on Mobile */}
                    <TabsList className="hidden lg:flex bg-white border border-amber-200 shadow-sm">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-amber-100">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="bookings" className="data-[state=active]:bg-amber-100">
                            <Calendar className="h-4 w-4 mr-2" />
                            Bookings
                        </TabsTrigger>
                        <TabsTrigger value="customers" className="data-[state=active]:bg-amber-100">
                            <Users className="h-4 w-4 mr-2" />
                            Customers
                        </TabsTrigger>
                        <TabsTrigger value="services" className="data-[state=active]:bg-amber-100">
                            <Scissors className="h-4 w-4 mr-2" />
                            Services
                        </TabsTrigger>
                        <TabsTrigger value="messages" className="data-[state=active]:bg-amber-100">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact Messages
                            {contactMessages.length > 0 && (
                                <Badge className="ml-2 bg-red-500">{contactMessages.length}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Mobile Active Tab Indicator */}
                    <div className="lg:hidden mb-4">
                        <Card className="bg-white border-amber-200 shadow-sm">
                            <CardContent className="py-3 px-4">
                                <div className="flex items-center justify-center">
                                    {activeTab === 'overview' && (
                                        <>
                                            <TrendingUp className="h-4 w-4 mr-2 text-amber-600" />
                                            <span className="font-semibold text-gray-800">Overview</span>
                                        </>
                                    )}
                                    {activeTab === 'bookings' && (
                                        <>
                                            <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                                            <span className="font-semibold text-gray-800">Bookings</span>
                                        </>
                                    )}
                                    {activeTab === 'customers' && (
                                        <>
                                            <Users className="h-4 w-4 mr-2 text-amber-600" />
                                            <span className="font-semibold text-gray-800">Customers</span>
                                        </>
                                    )}
                                    {activeTab === 'services' && (
                                        <>
                                            <Scissors className="h-4 w-4 mr-2 text-green-600" />
                                            <span className="font-semibold text-gray-800">Services</span>
                                        </>
                                    )}
                                    {activeTab === 'messages' && (
                                        <>
                                            <MessageSquare className="h-4 w-4 mr-2 text-red-600" />
                                            <span className="font-semibold text-gray-800">Contact Messages</span>
                                            {contactMessages.length > 0 && (
                                                <Badge className="ml-2 bg-red-500 text-xs">{contactMessages.length}</Badge>
                                            )}
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card className="bg-white border-amber-200 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                                        <Users className="h-4 w-4 mr-2 text-amber-600" />
                                        Customers
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-amber-600">{customers.length}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-amber-200 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                                        Bookings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-blue-600">{bookings.length}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-amber-200 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                                        <Scissors className="h-4 w-4 mr-2 text-green-600" />
                                        Services
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-green-600">{services.length}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-amber-200 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                                        <MessageSquare className="h-4 w-4 mr-2 text-red-600" />
                                        Messages
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-red-600">{contactMessages.length}</div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Bookings Tab */}
                    <TabsContent value="bookings" className="space-y-4">
                        <Card className="bg-white border-amber-200 shadow-lg">
                            <CardHeader>
                                <CardTitle>Bookings</CardTitle>
                                <CardDescription>All bookings for {tenant.name}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {bookings.length === 0 ? (
                                    <p className="text-gray-600 text-center py-8">No bookings found</p>
                                ) : (
                                    <div className="space-y-3">
                                        {bookings.map((booking) => (
                                            <div
                                                key={booking.id}
                                                className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200"
                                            >
                                                <div>
                                                    <p className="font-semibold text-gray-800">{booking.customer.name}</p>
                                                    <p className="text-sm text-gray-600">{booking.service.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(booking.booking_date).toLocaleString()}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        booking.status === 'confirmed' ? 'default' :
                                                            booking.status === 'pending' ? 'secondary' :
                                                                booking.status === 'completed' ? 'default' : 'destructive'
                                                    }
                                                    className={
                                                        booking.status === 'confirmed' ? 'bg-green-500' :
                                                            booking.status === 'completed' ? 'bg-blue-500' : ''
                                                    }
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Customers Tab */}
                    <TabsContent value="customers" className="space-y-4">
                        <Card className="bg-white border-amber-200 shadow-lg">
                            <CardHeader>
                                <CardTitle>Customers</CardTitle>
                                <CardDescription>All customers for {tenant.name}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {customers.length === 0 ? (
                                    <p className="text-gray-600 text-center py-8">No customers found</p>
                                ) : (
                                    <div className="space-y-3">
                                        {customers.map((customer) => (
                                            <div
                                                key={customer.id}
                                                className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200"
                                            >
                                                <div>
                                                    <p className="font-semibold text-gray-800">{customer.name}</p>
                                                    <p className="text-sm text-gray-600">{customer.email}</p>
                                                    <p className="text-xs text-gray-500">{customer.phone}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-amber-600">{customer.points} pts</p>
                                                    <p className="text-xs text-gray-500">{customer.visit_count} visits</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Services Tab */}
                    <TabsContent value="services" className="space-y-4">
                        <Card className="bg-white border-amber-200 shadow-lg">
                            <CardHeader>
                                <CardTitle>Services</CardTitle>
                                <CardDescription>All services offered by {tenant.name}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {services.length === 0 ? (
                                    <p className="text-gray-600 text-center py-8">No services found</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {services.map((service) => (
                                            <div
                                                key={service.id}
                                                className="p-4 bg-amber-50 rounded-lg border border-amber-200"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{service.name}</p>
                                                        <p className="text-sm text-gray-600">{service.category}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-amber-600">KES {service.price}</p>
                                                        <Badge
                                                            variant={service.is_active ? "default" : "secondary"}
                                                            className={service.is_active ? "bg-green-500 mt-1" : "bg-gray-400 mt-1"}
                                                        >
                                                            {service.is_active ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Contact Messages Tab */}
                    <TabsContent value="messages" className="space-y-4">
                        <Card className="bg-white border-amber-200 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <MessageSquare className="h-5 w-5 mr-2 text-amber-600" />
                                    Contact Messages
                                </CardTitle>
                                <CardDescription>
                                    Messages from customers and visitors for {tenant.name}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {contactMessages.length === 0 ? (
                                    <div className="text-center py-12">
                                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No contact messages yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {contactMessages.map((message) => (
                                            <Card key={message.id} className="border-amber-200 bg-gradient-to-br from-white to-amber-50">
                                                <CardHeader>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <CardTitle className="text-lg">{message.subject}</CardTitle>
                                                            <CardDescription className="mt-1">
                                                                From: {message.full_name} • {message.email}
                                                            </CardDescription>
                                                        </div>
                                                        <Badge variant="outline" className="border-amber-300">
                                                            {new Date(message.created_at).toLocaleDateString()}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-gray-700 mb-3">{message.message}</p>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                        <span>📞 {message.phone}</span>
                                                        <span>📧 {message.email}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default TenantManagement;
