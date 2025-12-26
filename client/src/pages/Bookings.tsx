import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchBookings, updateBooking, createBooking, fetchCustomers, fetchServices, fetchStaff, Booking, Customer, Service, StaffMember } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Bookings() {
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewBooking, setShowNewBooking] = useState(false);

    // Form state
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [selectedService, setSelectedService] = useState<string>('');
    const [selectedStaff, setSelectedStaff] = useState<string>('');
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [notes, setNotes] = useState('');

    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadData();

        // Check for ?add=true in URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('add') === 'true') {
            setShowNewBooking(true);
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [statusFilter, searchQuery]); // Reload when status filter or search query changes

    const loadData = async () => {
        try {
            const params: any = {};
            if (searchQuery) params.search = searchQuery;

            const [bookingsData, customersData, servicesData, staffData] = await Promise.all([
                fetchBookings(params),
                fetchCustomers(),
                fetchServices(),
                fetchStaff(),
            ]);

            setAllBookings(bookingsData);

            // Filter bookings for the table
            if (statusFilter === 'all') {
                setBookings(bookingsData);
            } else {
                setBookings(bookingsData.filter(b => b.status === statusFilter));
            }

            setCustomers(customersData);
            setServices(servicesData);
            setStaff(staffData);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBooking = async () => {
        if (!selectedCustomer || !selectedService || !bookingDate || !bookingTime) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        const dateTime = new Date(`${bookingDate}T${bookingTime}`);

        try {
            await createBooking({
                customer: parseInt(selectedCustomer),
                service: parseInt(selectedService),
                staff_member: selectedStaff ? parseInt(selectedStaff) : null,
                booking_date: dateTime.toISOString(),
                status: 'pending',
                notes,
            });

            toast({
                title: 'Success',
                description: 'Booking created successfully',
            });

            setShowNewBooking(false);
            resetForm();
            loadData();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create booking',
                variant: 'destructive',
            });
        }
    };

    const handleStatusUpdate = async (id: number, status: 'confirmed' | 'cancelled' | 'completed') => {
        try {
            await updateBooking(id, { status });
            toast({
                title: 'Success',
                description: `Booking ${status}`,
            });
            loadData();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update booking status',
                variant: 'destructive',
            });
        }
    };

    const resetForm = () => {
        setSelectedCustomer('');
        setSelectedService('');
        setSelectedStaff('');
        setBookingDate('');
        setBookingTime('');
        setNotes('');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'text-green-600 bg-green-100';
            case 'completed': return 'text-blue-600 bg-blue-100';
            case 'cancelled': return 'text-red-600 bg-red-100';
            default: return 'text-yellow-600 bg-yellow-100';
        }
    };

    if (loading) {
        return (
            <AppLayout title="Bookings" subtitle="Loading...">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            title="📅 Bookings"
            subtitle="Manage customer appointments"
        >
            <div className="mb-6 flex justify-between items-center">
                <div className="flex gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 min-w-[120px]">
                        <p className="text-sm text-gray-500">Total Bookings</p>
                        <p className="text-2xl font-bold text-gray-900">{allBookings.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 min-w-[120px]">
                        <p className="text-sm text-gray-500">
                            {statusFilter === 'all' ? 'Pending' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                        </p>
                        <p className={`text-2xl font-bold ${statusFilter === 'pending' || statusFilter === 'all' ? 'text-yellow-600' :
                                statusFilter === 'confirmed' ? 'text-green-600' :
                                    statusFilter === 'completed' ? 'text-blue-600' :
                                        'text-red-600'
                            }`}>
                            {statusFilter === 'all'
                                ? allBookings.filter(b => b.status === 'pending').length
                                : allBookings.filter(b => b.status === statusFilter).length
                            }
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => setShowNewBooking(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    <Calendar className="w-4 h-4 mr-2" />
                    New Booking
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                <div className="flex gap-2 bg-muted p-1 rounded-lg">
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter === status
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Staff</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell>
                                        <div className="font-medium">{booking.customer_name}</div>
                                    </TableCell>
                                    <TableCell>{booking.service_name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {format(new Date(booking.booking_date), 'MMM d, yyyy')}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {format(new Date(booking.booking_date), 'h:mm a')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{booking.staff_member_name || '-'}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {booking.status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Cancel
                                                    </Button>
                                                </>
                                            )}
                                            {booking.status === 'confirmed' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Complete
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {bookings.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        No bookings found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={showNewBooking} onOpenChange={setShowNewBooking}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>New Booking</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Customer</Label>
                            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Service</Label>
                            <Select value={selectedService} onValueChange={setSelectedService}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select service" />
                                </SelectTrigger>
                                <SelectContent>
                                    {services.filter(s => s.is_active).map((s) => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.name} ({s.duration} min)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Staff (Optional)</Label>
                            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select staff" />
                                </SelectTrigger>
                                <SelectContent>
                                    {staff.filter(s => s.is_active).map((s) => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <Input
                                    type="time"
                                    value={bookingTime}
                                    onChange={(e) => setBookingTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any special requests..."
                            />
                        </div>

                        <Button onClick={handleCreateBooking} className="w-full bg-purple-600 hover:bg-purple-700">
                            Create Booking
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
