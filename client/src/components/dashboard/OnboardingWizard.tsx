import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createService, createStaff, updateTenantSettings, Service } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Scissors, Users, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface OnboardingWizardProps {
    onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Service
    const [serviceName, setServiceName] = useState('');
    const [servicePrice, setServicePrice] = useState('');
    const [serviceDuration, setServiceDuration] = useState('30');
    const [serviceCategory, setServiceCategory] = useState<Service['category']>('hair');

    const categories: { id: Service['category'], name: string }[] = [
        { id: 'hair', name: 'Hair' },
        { id: 'massage', name: 'Massage' },
        { id: 'makeup', name: 'Makeup' },
        { id: 'body', name: 'Body' },
        { id: 'spa', name: 'Spa' },
        { id: 'nails', name: 'Nails' },
        { id: 'facial', name: 'Facial' },
        { id: 'packages', name: 'Packages' },
        { id: 'other', name: 'All Services' },
    ];

    // Step 2: Staff
    const [staffName, setStaffName] = useState('');
    const [staffPhone, setStaffPhone] = useState('');
    const [staffEmail, setStaffEmail] = useState('');
    const [staffSpecialty, setStaffSpecialty] = useState('');

    // Step 3: Hours (Simplified for MVP)
    const [openTime, setOpenTime] = useState('09:00');
    const [closeTime, setCloseTime] = useState('18:00');

    const handleAddService = async () => {
        if (!serviceName || !servicePrice) return;
        setLoading(true);
        try {
            await createService({
                name: serviceName,
                price: servicePrice,
                duration: parseInt(serviceDuration),
                category: serviceCategory,
                description: 'Added during onboarding',
                is_active: true
            });
            toast({ title: "Success", description: "First service added!" });
            setStep(2);
        } catch (error) {
            toast({ title: "Error", description: "Failed to add service", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async () => {
        if (!staffName || !staffPhone) return;
        setLoading(true);
        try {
            await createStaff({
                name: staffName,
                phone: staffPhone,
                email: staffEmail,
                specialty: staffSpecialty,
                is_active: true,
                commission_percentage: 0
            });
            toast({ title: "Success", description: "Staff member added!" });
            setStep(3);
        } catch (error) {
            toast({ title: "Error", description: "Failed to add staff", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSetHours = async () => {
        setLoading(true);
        try {
            // Construct a simple business hours object
            const hours = {
                monday: { open: openTime, close: closeTime },
                tuesday: { open: openTime, close: closeTime },
                wednesday: { open: openTime, close: closeTime },
                thursday: { open: openTime, close: closeTime },
                friday: { open: openTime, close: closeTime },
                saturday: { open: openTime, close: closeTime },
                sunday: { open: 'closed', close: 'closed' }
            };

            await updateTenantSettings({ business_hours: hours, onboarding_completed: true });
            toast({ title: "All Set!", description: "Your business is ready to go." });
            onComplete();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-lg border-amber-200 shadow-2xl animate-in fade-in zoom-in duration-300">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-xl border-b border-amber-100">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-2 w-12 rounded-full transition-all ${step >= i ? 'bg-amber-500' : 'bg-amber-200'}`} />
                            ))}
                        </div>
                        <span className="text-sm font-bold text-amber-700">Step {step} of 3</span>
                    </div>
                    <CardTitle className="text-2xl font-display text-amber-900">
                        {step === 1 && "Let's add your first Service"}
                        {step === 2 && "Add a Staff Member"}
                        {step === 3 && "Set Business Hours"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "What is the most popular service you offer?"}
                        {step === 2 && "Who will be performing these services?"}
                        {step === 3 && "When are you open for business?"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Service Name</Label>
                                <Input
                                    placeholder="e.g. Men's Haircut"
                                    value={serviceName}
                                    onChange={e => setServiceName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-amber-900 font-semibold">Service Category</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setServiceCategory(cat.id)}
                                            className={`py-2 px-1 text-xs rounded-lg border transition-all ${serviceCategory === cat.id
                                                ? 'bg-amber-600 border-amber-600 text-white shadow-md'
                                                : 'bg-white border-amber-100 text-amber-800 hover:border-amber-300 hover:bg-amber-50'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Price (KES)</Label>
                                    <Input
                                        type="number"
                                        placeholder="500"
                                        value={servicePrice}
                                        onChange={e => setServicePrice(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration (mins)</Label>
                                    <Input
                                        type="number"
                                        value={serviceDuration}
                                        onChange={e => setServiceDuration(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button onClick={handleAddService} disabled={loading || !serviceName || !servicePrice} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                                {loading ? 'Saving...' : 'Next Step'} <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Staff Name</Label>
                                    <Input
                                        placeholder="e.g. John Kamau"
                                        value={staffName}
                                        onChange={e => setStaffName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input
                                        placeholder="+254..."
                                        value={staffPhone}
                                        onChange={e => setStaffPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email Address (Optional)</Label>
                                <Input
                                    type="email"
                                    placeholder="john@example.com"
                                    value={staffEmail}
                                    onChange={e => setStaffEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Specialty / Role</Label>
                                <Input
                                    placeholder="e.g. Senior Barber, Hair Colorist"
                                    value={staffSpecialty}
                                    onChange={e => setStaffSpecialty(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleAddStaff} disabled={loading || !staffName || !staffPhone} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                                {loading ? 'Saving...' : 'Next Step'} <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Opening Time</Label>
                                    <Input
                                        type="time"
                                        value={openTime}
                                        onChange={e => setOpenTime(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Closing Time</Label>
                                    <Input
                                        type="time"
                                        value={closeTime}
                                        onChange={e => setCloseTime(e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                We'll apply these hours to Mon-Sat. You can customize them later in Settings.
                            </p>
                            <Button onClick={handleSetHours} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white">
                                {loading ? 'Finishing...' : 'Complete Setup'} <CheckCircle2 className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
