import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    GalleryImage, fetchGallery, uploadGalleryImage, deleteGalleryImage,
    fetchStaff, StaffMember, fetchServices, Service
} from '@/services/api';
import { Plus, Trash2, Image as ImageIcon, ExternalLink, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function Gallery() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        staff_member: '',
        service: '',
        is_public: true
    });
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [galleryData, staffData, servicesData] = await Promise.all([
                fetchGallery(),
                fetchStaff(),
                fetchServices()
            ]);
            setImages(galleryData);
            setStaff(staffData);
            setServices(servicesData);
        } catch (error) {
            console.error('Failed to load gallery data', error);
            toast({
                title: 'Error',
                description: 'Failed to load gallery',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        try {
            if (!selectedFile) {
                toast({ title: 'Error', description: 'Please select an image', variant: 'destructive' });
                return;
            }

            const uploadData = new FormData();
            uploadData.append('image', selectedFile);
            uploadData.append('title', formData.title);
            uploadData.append('description', formData.description);
            uploadData.append('is_public', String(formData.is_public));

            if (formData.staff_member && formData.staff_member !== 'none') {
                uploadData.append('staff_member', formData.staff_member);
            }
            if (formData.service && formData.service !== 'none') {
                uploadData.append('service', formData.service);
            }

            await uploadGalleryImage(uploadData);

            toast({ title: 'Success', description: 'Image uploaded to portfolio' });
            setIsDialogOpen(false);
            resetForm();
            loadData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
        }
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', staff_member: '', service: '', is_public: true });
        setSelectedFile(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this image from your portfolio?')) return;
        try {
            await deleteGalleryImage(id);
            toast({ title: 'Success', description: 'Image deleted' });
            loadData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete image', variant: 'destructive' });
        }
    };

    return (
        <AppLayout title="📷 Work Gallery" subtitle="Showcase your best haircuts, styles, and treatments">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 text-amber-600" />
                        Portfolio Images
                    </h2>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700">
                                <Plus className="w-4 h-4" />
                                Add to Gallery
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Upload Gallery Image</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Select Image</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Fade Cut & Lineup"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Staff Member (Who did it?)</Label>
                                        <Select
                                            value={formData.staff_member}
                                            onValueChange={(val) => setFormData({ ...formData, staff_member: val })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {staff.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Service Type</Label>
                                        <Select
                                            value={formData.service}
                                            onValueChange={(val) => setFormData({ ...formData, service: val })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {services.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="is_public"
                                        checked={formData.is_public}
                                        onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <Label htmlFor="is_public">Show on Customer Portal</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleUpload} className="bg-amber-600 hover:bg-amber-700">Upload Image</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-lg"></div>
                        ))}
                    </div>
                ) : images.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <ImageIcon className="w-12 h-12 text-gray-300" />
                            <h3 className="text-lg font-medium">Your gallery is empty</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto">Upload photos of your best work to attract more customers.</p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image) => (
                            <Card key={image.id} className="overflow-hidden group relative border-0 shadow-md">
                                <img
                                    src={image.image.startsWith('http') ? image.image : `http://localhost:8000${image.image}`}
                                    className="w-full aspect-square object-cover"
                                    alt={image.title}
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
                                    <div className="flex justify-between items-start">
                                        {image.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:text-red-500 hover:bg-white/10"
                                            onClick={() => handleDelete(image.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm truncate">{image.title}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {image.staff_member_name && <Badge variant="secondary" className="text-[10px] py-0 h-4 bg-white/20 text-white border-0">{image.staff_member_name}</Badge>}
                                            {image.service_name && <Badge variant="secondary" className="text-[10px] py-0 h-4 bg-white/20 text-white border-0">{image.service_name}</Badge>}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
