import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    fetchStaff, createStaff, updateStaff, StaffMember,
    fetchPayroll, PayrollReport, updateStaffCommission
} from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Users, Plus, Phone, Calendar, Mail, DollarSign, Percent } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

import { useWebSocket } from '@/contexts/WebSocketContext';

export default function Staff() {
    const [searchParams] = useSearchParams();
    const searchQuery = (searchParams.get('search') || '').toLowerCase();

    const { lastMessage } = useWebSocket(); // Use global websocket

    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        specialty: '',
        commission_percentage: '0',
        is_active: true,
    });
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    // Payroll State
    const [payrollData, setPayrollData] = useState<PayrollReport | null>(null);
    const [payrollLoading, setPayrollLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadStaff();
    }, []);

    useEffect(() => {
        if (lastMessage) {
            // lastMessage.message is the object { title, message, ... }
            const msgData = lastMessage.message;
            if (msgData) {
                if (msgData.title === 'Staff Added' || (typeof msgData.message === 'string' && msgData.message.includes('Appointment'))) {
                    loadStaff();
                }
            }
        }
    }, [lastMessage]);


    const loadStaff = async () => {
        try {
            const data = await fetchStaff();
            setStaff(data);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load staff', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const loadPayroll = async () => {
        try {
            setPayrollLoading(true);
            const data = await fetchPayroll(dateRange.start, dateRange.end);
            setPayrollData(data);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load payroll report', variant: 'destructive' });
        } finally {
            setPayrollLoading(false);
        }
    };

    useEffect(() => {
        // Load payroll when tab is active or date changes? 
        // Better to load on demand or initial effect if we knew tab state.
        // We'll trigger it when date changes, but only if we are in payroll tab?
        // Let's just load it on mount of tab component if possible, 
        // or just have a button or auto-load.
        // For simplicity, we can load it here but guarding with a check?
        // Or just load it when dates change.
    }, [dateRange]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.phone) {
            toast({ title: 'Error', description: 'Required fields missing', variant: 'destructive' });
            return;
        }

        try {
            const staffFormData = new FormData();
            staffFormData.append('name', formData.name);
            staffFormData.append('phone', formData.phone);
            staffFormData.append('email', formData.email);
            staffFormData.append('specialty', formData.specialty);
            staffFormData.append('commission_percentage', formData.commission_percentage);
            staffFormData.append('is_active', String(formData.is_active));
            if (photoFile) {
                staffFormData.append('photo', photoFile);
            }

            await createStaff(staffFormData as any);
            toast({ title: 'Success', description: 'Staff member added successfully!' });
            setShowForm(false);
            setFormData({ name: '', phone: '', email: '', specialty: '', commission_percentage: '0', is_active: true });
            setPhotoFile(null);
            loadStaff();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to add staff member', variant: 'destructive' });
        }
    };

    const toggleActive = async (staffMember: StaffMember) => {
        try {
            await updateStaff(staffMember.id, { is_active: !staffMember.is_active });
            toast({ title: 'Success', description: `Updated ${staffMember.name}` });
            loadStaff();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update staff', variant: 'destructive' });
        }
    };

    const handleCommissionUpdate = async (id: string, newCommission: number) => {
        try {
            await updateStaffCommission(id, newCommission);
            toast({ title: 'Success', description: 'Commission updated' });
            loadStaff();
            if (payrollData) loadPayroll(); // Refresh payroll if open
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update commission', variant: 'destructive' });
        }
    };

    const filteredStaff = useMemo(() => {
        return staff.filter(member => {
            if (!searchQuery) return true;
            return (
                member.name.toLowerCase().includes(searchQuery) ||
                (member.email && member.email.toLowerCase().includes(searchQuery)) ||
                member.phone.includes(searchQuery) ||
                member.specialty.toLowerCase().includes(searchQuery)
            );
        });
    }, [staff, searchQuery]);

    const activeStaff = filteredStaff.filter(s => s.is_active);
    const inactiveStaff = filteredStaff.filter(s => !s.is_active);

    return (
        <AppLayout title="HR & Payroll">
            <Tabs defaultValue="staff" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="staff">Staff Management</TabsTrigger>
                    <TabsTrigger value="payroll" onClick={() => loadPayroll()}>Payroll Report</TabsTrigger>
                </TabsList>

                <TabsContent value="staff">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-display font-semibold text-amber-900">Staff Members</h2>
                        <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-amber-600 to-orange-600">
                            <Plus className="w-4 h-4 mr-2" /> Add Staff
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {activeStaff.map((staffMember) => (
                            <Card key={staffMember.id} className="border-amber-200 hover:shadow-lg transition">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                                            {staffMember.photo ? (
                                                <img
                                                    src={staffMember.photo.startsWith('http') ? staffMember.photo : `http://localhost:8000${staffMember.photo}`}
                                                    alt={staffMember.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span>{staffMember.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                                    </div>
                                    <h3 className="text-lg font-semibold text-amber-900 mb-1">{staffMember.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-3">{staffMember.specialty}</p>

                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center justify-between bg-amber-50 p-2 rounded">
                                            <span className="flex items-center gap-2"><Percent className="w-4 h-4" /> Commission</span>
                                            <span className="font-bold">{staffMember.commission_percentage}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" /> {staffMember.phone}
                                        </div>
                                        {staffMember.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" /> {staffMember.email}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" /> Joined {new Date(staffMember.joined_date).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                                            const newComm = prompt("Enter new commission %:", String(staffMember.commission_percentage));
                                            if (newComm !== null) handleCommissionUpdate(staffMember.id, Number(newComm));
                                        }}>
                                            Set Comm.
                                        </Button>
                                        <Button onClick={() => toggleActive(staffMember)} variant="outline" size="sm" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                                            Deactivate
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="payroll">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <CardTitle>Payroll Calculation</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                        className="w-auto"
                                    />
                                    <span>to</span>
                                    <Input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                        className="w-auto"
                                    />
                                    <Button onClick={loadPayroll} disabled={payrollLoading}>
                                        {payrollLoading ? 'Calculating...' : 'Run Report'}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Staff Member</TableHead>
                                        <TableHead className="text-center">Total Visits</TableHead>
                                        <TableHead className="text-right">Total Revenue Generated</TableHead>
                                        <TableHead className="text-center">Commission Rate</TableHead>
                                        <TableHead className="text-right font-bold text-green-700">Commission Payout</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payrollLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10">Loading payroll data...</TableCell>
                                        </TableRow>
                                    ) : !payrollData || payrollData.payroll.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No payroll data for this period.</TableCell>
                                        </TableRow>
                                    ) : (
                                        payrollData.payroll.map((item) => (
                                            <TableRow key={item.staff_id}>
                                                <TableCell className="font-medium">{item.staff_name}</TableCell>
                                                <TableCell className="text-center">{item.visit_count}</TableCell>
                                                <TableCell className="text-right">KES {item.total_revenue.toLocaleString()}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline">{item.commission_percentage}%</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-green-700 text-lg">
                                                    KES {item.commission_earned.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Staff Member</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to register a new staff member to your business.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Name *</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <Label>Phone *</Label>
                            <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <Label>Specialty</Label>
                            <Input value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} />
                        </div>
                        <div>
                            <Label>Profile Photo (Optional)</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)}
                                className="cursor-pointer"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Upload a profile photo for this staff member</p>
                        </div>
                        <div>
                            <Label>Commission Percentage (%)</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.commission_percentage}
                                onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                            />
                        </div>
                        <Button onClick={handleSubmit} className="w-full bg-amber-600 hover:bg-amber-700">Save Staff Member</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
