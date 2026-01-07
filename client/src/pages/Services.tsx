import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Scissors, Waves, Hand, Smile, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { fetchServices, createService, updateService, deleteService, Service } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

export default function Services() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'hair',
        price: '',
        duration: '60',
        description: '',
        is_active: true,
    });

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            const data = await fetchServices();
            setServices(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load services',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (service?: Service) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                category: service.category,
                price: service.price,
                duration: service.duration.toString(),
                description: service.description,
                is_active: service.is_active,
            });
        } else {
            setEditingService(null);
            setFormData({
                name: '',
                category: 'hair',
                price: '',
                duration: '60',
                description: '',
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const serviceData = {
                ...formData,
                category: formData.category as any,
                duration: parseInt(formData.duration),
            };

            if (editingService) {
                await updateService(editingService.id, serviceData);
                toast({ title: 'Success', description: 'Service updated successfully' });
            } else {
                await createService(serviceData as any);
                toast({ title: 'Success', description: 'Service created successfully' });
            }
            setIsDialogOpen(false);
            loadServices();
        } catch (error) {
            toast({
                title: 'Error',
                description: `Failed to ${editingService ? 'update' : 'create'} service`,
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;
        try {
            await deleteService(id);
            toast({ title: 'Success', description: 'Service deleted successfully' });
            loadServices();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete service',
                variant: 'destructive',
            });
        }
    };

    const handleToggleStatus = async (service: Service) => {
        try {
            await updateService(service.id, { is_active: !service.is_active });
            toast({ title: 'Success', description: `Service ${service.is_active ? 'deactivated' : 'activated'}` });
            loadServices();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update service status',
                variant: 'destructive',
            });
        }
    };

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

    //     if (loading) {
    //         return (
    //             <AppLayout title="Services" subtitle="Loading services...">
    //                 <div className="flex items-center justify-center h-64">
    //                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
    //                 </div>
    //             </AppLayout>
    //         );
    //     }

    return (
        <AppLayout
            title="💇 Services Menu"
            subtitle={`${services.length} services available`}
        >
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
                <Button
                    onClick={() => setSelectedCategory('all')}
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    className={selectedCategory === 'all' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                >
                    All Services
                </Button>
                <Button
                    onClick={() => setSelectedCategory('hair')}
                    variant={selectedCategory === 'hair' ? 'default' : 'outline'}
                    className={selectedCategory === 'hair' ? 'bg-amber-600 hover:bg-amber-700' : ''}
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

            {/* Services by Category */}
            {Object.entries(groupedServices).map(([category, categoryServices]) => {
                const Icon = categoryIcons[category as keyof typeof categoryIcons];

                return (
                    <div key={category} className="mb-8">
                        <h2 className="text-2xl font-display font-semibold mb-4 text-amber-900 flex items-center gap-2">
                            <Icon className="w-6 h-6" />
                            {category.charAt(0).toUpperCase() + category.slice(1)} Services
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryServices.map((service) => (
                                <Card
                                    key={service.id}
                                    className={`hover:shadow-lg transition border-2 ${service.is_active ? 'border-amber-200' : 'border-gray-200 opacity-60'
                                        }`}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <Badge className={categoryColors[category as keyof typeof categoryColors]}>
                                                {category}
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(service)}>
                                                        <Pencil className="w-4 h-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(service)}>
                                                        {service.is_active ? 'Deactivate' : 'Activate'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(service.id)} className="text-red-600">
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <h3 className="text-lg font-semibold text-amber-900 mb-2">
                                            {service.name}
                                        </h3>

                                        {service.description && (
                                            <p className="text-sm text-gray-600 mb-3">
                                                {service.description}
                                            </p>
                                        )}

                                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                                            <div>
                                                <p className="text-2xl font-bold text-amber-700">
                                                    KES {parseFloat(service.price).toLocaleString()}
                                                </p>
                                                <p className="text-sm text-gray-500">{service.duration} minutes</p>
                                            </div>
                                            {!service.is_active && (
                                                <Badge variant="outline" className="text-red-600 border-red-600">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                );
            })}

            {filteredServices.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No services found in this category</p>
                </div>
            )}

            {/* Floating Add Button */}
            <Button
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                size="icon"
                onClick={() => handleOpenDialog()}
            >
                <Plus className="w-6 h-6" />
            </Button>

            {/* Add/Edit Service Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Service Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Haircut & Style"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hair">Hair</SelectItem>
                                        <SelectItem value="massage">Massage</SelectItem>
                                        <SelectItem value="makeup">Makeup</SelectItem>
                                        <SelectItem value="body">Body Treatments</SelectItem>
                                        <SelectItem value="spa">Spa</SelectItem>
                                        <SelectItem value="nails">Nails</SelectItem>
                                        <SelectItem value="facial">Facial</SelectItem>
                                        <SelectItem value="packages">Packages</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="price">Price (KES)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input
                                id="duration"
                                type="number"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                placeholder="60"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the service..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>{editingService ? 'Update Service' : 'Create Service'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
