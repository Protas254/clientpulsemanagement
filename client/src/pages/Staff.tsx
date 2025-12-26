import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchStaff, createStaff, updateStaff, StaffMember } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Users, Plus, Phone, Calendar } from 'lucide-react';
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

export default function Staff() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        is_active: true,
    });

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        try {
            const data = await fetchStaff();
            setStaff(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load staff',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.phone) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        try {
            await createStaff(formData);
            toast({
                title: 'Success',
                description: 'Staff member added successfully!',
            });
            setShowForm(false);
            setFormData({ name: '', phone: '', is_active: true });
            loadStaff();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to add staff member',
                variant: 'destructive',
            });
        }
    };

    const toggleActive = async (staffMember: StaffMember) => {
        try {
            await updateStaff(staffMember.id, { is_active: !staffMember.is_active });
            toast({
                title: 'Success',
                description: `${staffMember.name} has been ${staffMember.is_active ? 'deactivated' : 'activated'}`,
            });
            loadStaff();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update staff member',
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return (
            <AppLayout title="Staff" subtitle="Loading...">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                </div>
            </AppLayout>
        );
    }

    const activeStaff = staff.filter(s => s.is_active);
    const inactiveStaff = staff.filter(s => !s.is_active);

    return (
        <AppLayout
            title="👥 Staff Management"
            subtitle={`${activeStaff.length} active staff members`}
        >
            <div className="mb-6">
                <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff Member
                </Button>
            </div>

            {/* Active Staff */}
            <div className="mb-8">
                <h2 className="text-2xl font-display font-semibold mb-4 text-amber-900">
                    Active Staff
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeStaff.map((staffMember) => (
                        <Card key={staffMember.id} className="border-amber-200 hover:shadow-lg transition">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                        {staffMember.name.charAt(0)}
                                    </div>
                                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                                </div>

                                <h3 className="text-lg font-semibold text-amber-900 mb-3">
                                    {staffMember.name}
                                </h3>

                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        {staffMember.phone}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Joined {new Date(staffMember.joined_date).toLocaleDateString()}
                                    </div>
                                </div>

                                <Button
                                    onClick={() => toggleActive(staffMember)}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Deactivate
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Inactive Staff */}
            {inactiveStaff.length > 0 && (
                <div>
                    <h2 className="text-2xl font-display font-semibold mb-4 text-gray-700">
                        Inactive Staff
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {inactiveStaff.map((staffMember) => (
                            <Card key={staffMember.id} className="border-gray-200 opacity-60">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                            {staffMember.name.charAt(0)}
                                        </div>
                                        <Badge variant="outline" className="text-gray-600">Inactive</Badge>
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                                        {staffMember.name}
                                    </h3>

                                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            {staffMember.phone}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => toggleActive(staffMember)}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Activate
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Staff Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-display text-xl">Add New Staff Member</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter name..."
                            />
                        </div>

                        <div>
                            <Label>Phone Number *</Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="07XX XXX XXX"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleSubmit}
                                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                            >
                                Add Staff
                            </Button>
                            <Button
                                onClick={() => setShowForm(false)}
                                variant="outline"
                                className="flex-1"
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
