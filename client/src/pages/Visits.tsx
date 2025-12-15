import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchVisits, createVisit, fetchServices, fetchCustomers, fetchStaff, Visit, Service, Customer, StaffMember } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Calendar, User, DollarSign, Clock } from 'lucide-react';
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

export default function Visits() {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewVisit, setShowNewVisit] = useState(false);

    // Form state
    const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<string>('paid');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [visitsData, servicesData, customersData, staffData] = await Promise.all([
                fetchVisits(),
                fetchServices(),
                fetchCustomers(),
                fetchStaff(),
            ]);
            setVisits(visitsData);
            setServices(servicesData);
            setCustomers(customersData);
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

    const calculateTotal = () => {
        return selectedServices.reduce((total, serviceId) => {
            const service = services.find(s => s.id === serviceId);
            return total + (service ? parseFloat(service.price) : 0);
        }, 0);
    };

    const handleCreateVisit = async () => {
        if (!selectedCustomer || selectedServices.length === 0) {
            toast({
                title: 'Error',
                description: 'Please select a customer and at least one service',
                variant: 'destructive',
            });
            return;
        }

        const total = calculateTotal();

        try {
            await createVisit({
                customer: selectedCustomer,
                service_ids: selectedServices,
                staff_member: selectedStaff || undefined,
                total_amount: total.toString(),
                payment_status: paymentStatus,
                notes,
            });

            toast({
                title: 'Visit Created',
                description: 'Customer visit has been recorded successfully!',
            });

            // Reset form
            setShowNewVisit(false);
            setSelectedCustomer(null);
            setSelectedServices([]);
            setSelectedStaff(null);
            setNotes('');

            // Reload visits
            loadData();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create visit',
                variant: 'destructive',
            });
        }
    };

    const toggleService = (serviceId: number) => {
        if (selectedServices.includes(serviceId)) {
            setSelectedServices(selectedServices.filter(id => id !== serviceId));
        } else {
            setSelectedServices([...selectedServices, serviceId]);
        }
    };

    if (loading) {
        return (
            <AppLayout title="Visits" subtitle="Loading...">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            title="📅 Visits"
            subtitle={`${visits.length} total visits`}
        >
            <div className="mb-6">
                <Button
                    onClick={() => setShowNewVisit(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6 px-8"
                >
                    <User className="w-5 h-5 mr-2" />
                    New Walk-In Customer
                </Button>
            </div>

            {/* Visits List */}
            <div className="space-y-4">
                {visits.map((visit) => (
                    <Card key={visit.id} className="border-purple-200 hover:shadow-lg transition">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-purple-900 mb-2">
                                        {visit.customer_name}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {visit.services_detail?.map((service) => (
                                            <span
                                                key={service.id}
                                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                                            >
                                                {service.name}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                        {visit.staff_member_name && (
                                            <span className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                {visit.staff_member_name}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(visit.visit_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-purple-700">
                                        KES {parseFloat(visit.total_amount).toLocaleString()}
                                    </p>
                                    <span className={`px-3 py-1 rounded-full text-sm ${visit.payment_status === 'paid'
                                        ? 'bg-green-100 text-green-700'
                                        : visit.payment_status === 'partial'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {visit.payment_status}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* New Visit Dialog */}
            <Dialog open={showNewVisit} onOpenChange={setShowNewVisit}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl">New Customer Visit</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Step 1: Select Customer */}
                        <div>
                            <Label className="text-lg font-semibold mb-2">1. Select Customer</Label>
                            <Select value={selectedCustomer?.toString()} onValueChange={(val) => setSelectedCustomer(parseInt(val))}>
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Choose customer..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {customer.name} - {customer.phone}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Step 2: Select Services */}
                        <div>
                            <Label className="text-lg font-semibold mb-2">2. Select Services</Label>
                            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border rounded-lg">
                                {services.filter(s => s.is_active).map((service) => (
                                    <button
                                        key={service.id}
                                        onClick={() => toggleService(service.id)}
                                        className={`p-4 rounded-lg border-2 text-left transition ${selectedServices.includes(service.id)
                                            ? 'border-purple-600 bg-purple-50'
                                            : 'border-gray-200 hover:border-purple-300'
                                            }`}
                                    >
                                        <p className="font-semibold text-purple-900">{service.name}</p>
                                        <p className="text-sm text-purple-600">KES {parseFloat(service.price).toLocaleString()}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 3: Assign Staff */}
                        <div>
                            <Label className="text-lg font-semibold mb-2">3. AssignStaff (Optional)</Label>
                            <Select value={selectedStaff?.toString()} onValueChange={(val) => setSelectedStaff(parseInt(val))}>
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Choose staff member..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {staff.filter(s => s.is_active).map((staffMember) => (
                                        <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                                            {staffMember.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Payment Status */}
                        <div>
                            <Label>Payment Status</Label>
                            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="partial">Partially Paid</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Notes */}
                        <div>
                            <Label>Notes (Optional)</Label>
                            <Input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any special notes..."
                            />
                        </div>

                        {/* Total */}
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-lg font-semibold text-purple-900">
                                Total: <span className="text-2xl">KES {calculateTotal().toLocaleString()}</span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleCreateVisit}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12"
                            >
                                Complete Visit
                            </Button>
                            <Button
                                onClick={() => setShowNewVisit(false)}
                                variant="outline"
                                className="flex-1 h-12"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
