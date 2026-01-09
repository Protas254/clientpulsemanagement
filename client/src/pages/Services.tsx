import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Scissors, Waves, Hand, Smile, MoreVertical, Pencil, Trash2, Package, X } from 'lucide-react';
import {
    fetchServices, createService, updateService, deleteService,
    Service, fetchProducts, Product
} from '@/services/api';
import { toast } from '@/hooks/use-toast';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const categoryIcons = {
    hair: Scissors, salon: Scissors, barber: Scissors, spa: Waves, nails: Hand,
    facial: Smile, massage: Waves, makeup: Smile, body: Waves, packages: Plus, other: MoreVertical,
};

const categoryColors = {
    hair: 'bg-amber-100 text-amber-700', salon: 'bg-amber-100 text-amber-700', barber: 'bg-blue-100 text-blue-700',
    spa: 'bg-pink-100 text-pink-700', nails: 'bg-rose-100 text-rose-700', facial: 'bg-fuchsia-100 text-fuchsia-700',
    massage: 'bg-indigo-100 text-indigo-700', makeup: 'bg-purple-100 text-purple-700', body: 'bg-emerald-100 text-emerald-700',
    packages: 'bg-orange-100 text-orange-700', other: 'bg-gray-100 text-gray-700',
};

export default function Services() {
    const [searchParams] = useSearchParams();
    const searchQuery = (searchParams.get('search') || '').toLowerCase();

    const [services, setServices] = useState<Service[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [formData, setFormData] = useState({
        name: '', category: 'hair', price: '', duration: '60', description: '', is_active: true,
    });

    // Product Consumption State
    const [consumptionList, setConsumptionList] = useState<{ product: string; quantity: number }[]>([]);
    const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
    const [quantityToAdd, setQuantityToAdd] = useState('1');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [servicesData, productsData] = await Promise.all([
                fetchServices(),
                fetchProducts()
            ]);
            setServices(servicesData);
            setProducts(productsData);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
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
            // Map existing consumption
            setConsumptionList(service.product_consumption?.map(pc => ({
                product: pc.product,
                quantity: pc.quantity
            })) || []);
        } else {
            setEditingService(null);
            setFormData({ name: '', category: 'hair', price: '', duration: '60', description: '', is_active: true });
            setConsumptionList([]);
        }
        setIsDialogOpen(true);
    };

    const handleAddProduct = () => {
        if (!selectedProductToAdd || !quantityToAdd) return;
        setConsumptionList([...consumptionList, { product: selectedProductToAdd, quantity: Number(quantityToAdd) }]);
        setSelectedProductToAdd('');
        setQuantityToAdd('1');
    };

    const handleRemoveProduct = (index: number) => {
        const newList = [...consumptionList];
        newList.splice(index, 1);
        setConsumptionList(newList);
    };

    const handleSubmit = async () => {
        try {
            if (editingService) {
                // For updates, send basic service data without product_consumption
                const updateData = {
                    ...formData,
                    category: formData.category as any,
                    duration: parseInt(formData.duration),
                };
                await updateService(editingService.id, updateData);
                toast({ title: 'Success', description: 'Service updated successfully' });
            } else {
                // For new services, include product_consumption
                const serviceData = {
                    ...formData,
                    category: formData.category as any,
                    duration: parseInt(formData.duration),
                    product_consumption: consumptionList
                };
                await createService(serviceData as any);
                toast({ title: 'Success', description: 'Service created successfully' });
            }
            setIsDialogOpen(false);
            loadData();
        } catch (error) {
            toast({ title: 'Error', description: `Failed to ${editingService ? 'update' : 'create'} service`, variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;
        try {
            await deleteService(id);
            toast({ title: 'Success', description: 'Service deleted successfully' });
            loadData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete service', variant: 'destructive' });
        }
    };

    const handleToggleStatus = async (service: Service) => {
        try {
            await updateService(service.id, { is_active: !service.is_active });
            toast({ title: 'Success', description: `Service ${service.is_active ? 'deactivated' : 'activated'}` });
            loadData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
        }
    };

    const filteredServices = useMemo(() => {
        return services.filter(service => {
            const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
            const matchesSearch = !searchQuery ||
                service.name.toLowerCase().includes(searchQuery) ||
                service.description.toLowerCase().includes(searchQuery);
            return matchesCategory && matchesSearch;
        });
    }, [services, selectedCategory, searchQuery]);

    const groupedServices = filteredServices.reduce((acc, service) => {
        if (!acc[service.category]) acc[service.category] = [];
        acc[service.category].push(service);
        return acc;
    }, {} as Record<string, Service[]>);

    return (
        <AppLayout title="💇 Services Menu" subtitle={`${services.length} services available`}>
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
                <Button onClick={() => setSelectedCategory('all')} variant={selectedCategory === 'all' ? 'default' : 'outline'} className={selectedCategory === 'all' ? 'bg-amber-600 hover:bg-amber-700' : ''}>All Services</Button>
                {Object.keys(categoryIcons).filter(k => k !== 'packages').map(cat => {
                    const Icon = categoryIcons[cat as keyof typeof categoryIcons];
                    return (
                        <Button key={cat} onClick={() => setSelectedCategory(cat)} variant={selectedCategory === cat ? 'default' : 'outline'} className={selectedCategory === cat ? 'bg-amber-600 hover:bg-amber-700' : ''}>
                            <Icon className="w-4 h-4 mr-2" />
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Button>
                    );
                })}
            </div>

            {/* Services by Category */}
            {Object.entries(groupedServices).map(([category, categoryServices]) => {
                const Icon = categoryIcons[category as keyof typeof categoryIcons];
                return (
                    <div key={category} className="mb-8">
                        <h2 className="text-2xl font-display font-semibold mb-4 text-amber-900 flex items-center gap-2">
                            <Icon className="w-6 h-6" /> {category.charAt(0).toUpperCase() + category.slice(1)} Services
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryServices.map((service) => (
                                <Card key={service.id} className={`hover:shadow-lg transition border-2 ${service.is_active ? 'border-amber-200' : 'border-gray-200 opacity-60'}`}>
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <Badge className={categoryColors[category as keyof typeof categoryColors]}>{category}</Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(service)}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(service)}>{service.is_active ? 'Deactivate' : 'Activate'}</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(service.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <h3 className="text-lg font-semibold text-amber-900 mb-2">{service.name}</h3>
                                        {service.description && <p className="text-sm text-gray-600 mb-3">{service.description}</p>}

                                        {/* Product Consumption Display */}
                                        {service.product_consumption && service.product_consumption.length > 0 && (
                                            <div className="mb-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                                <p className="font-semibold mb-1">Stock used per service:</p>
                                                <ul className="list-disc list-inside">
                                                    {service.product_consumption.map(pc => (
                                                        <li key={pc.id}>{pc.product_name} x {pc.quantity}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                                            <div>
                                                <p className="text-2xl font-bold text-amber-700">KES {parseFloat(service.price).toLocaleString()}</p>
                                                <p className="text-sm text-gray-500">{service.duration} mins</p>
                                            </div>
                                            {!service.is_active && <Badge variant="outline" className="text-red-600 border-red-600">Inactive</Badge>}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                );
            })}

            <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700" size="icon" onClick={() => handleOpenDialog()}>
                <Plus className="w-6 h-6" />
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                        <DialogDescription>
                            {editingService ? "Update the details of your service menu item." : "Create a new service for your customers to book."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Service Name</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Haircut & Style" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hair">Hair</SelectItem>
                                        <SelectItem value="massage">Massage</SelectItem>
                                        <SelectItem value="makeup">Makeup</SelectItem>
                                        <SelectItem value="body">Body</SelectItem>
                                        <SelectItem value="spa">Spa</SelectItem>
                                        <SelectItem value="nails">Nails</SelectItem>
                                        <SelectItem value="facial">Facial</SelectItem>
                                        <SelectItem value="packages">Packages</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Price (KES)</Label>
                                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Duration (minutes)</Label>
                            <Input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="60" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the service..." />
                        </div>

                        {/* Product Consumption Section */}
                        <div className="border rounded-md p-4 bg-gray-50">
                            <Label className="mb-2 block font-semibold">Product Consumption (Inventory)</Label>
                            <p className="text-xs text-muted-foreground mb-3">Define products deducted from stock when this service is performed.</p>

                            <div className="flex gap-2 mb-3">
                                <Select value={selectedProductToAdd} onValueChange={setSelectedProductToAdd}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select Product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="number"
                                    value={quantityToAdd}
                                    onChange={(e) => setQuantityToAdd(e.target.value)}
                                    className="w-20"
                                    placeholder="Qty"
                                />
                                <Button type="button" onClick={handleAddProduct} variant="secondary">Add</Button>
                            </div>

                            <div className="space-y-2">
                                {consumptionList.map((item, index) => {
                                    const product = products.find(p => p.id === item.product);
                                    return (
                                        <div key={index} className="flex justify-between items-center bg-white p-2 rounded border text-sm">
                                            <span>{product ? product.name : 'Unknown Product'}</span>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline">Qty: {item.quantity}</Badge>
                                                <Button variant="ghost" size="sm" onClick={() => handleRemoveProduct(index)} className="h-6 w-6 p-0 text-red-500">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {consumptionList.length === 0 && <p className="text-gray-400 italic text-sm text-center py-2">No products linked.</p>}
                            </div>
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
