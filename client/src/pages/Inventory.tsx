import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Product, InventoryLog, fetchProducts, createProduct, updateProduct,
    deleteProduct, fetchInventoryLogs, createInventoryLog
} from '@/services/api';
import { Plus, Search, Edit, Trash2, Package, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Inventory() {
    const [products, setProducts] = useState<Product[]>([]);
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
    const [stockAdjustment, setStockAdjustment] = useState({
        productId: '',
        quantity: 0,
        reason: 'restock',
        notes: ''
    });
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [productsData, logsData] = await Promise.all([
                fetchProducts(),
                fetchInventoryLogs()
            ]);
            setProducts(productsData);
            setLogs(logsData);
        } catch (error) {
            console.error('Failed to load inventory data', error);
            toast({
                title: 'Error',
                description: 'Failed to load inventory data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async () => {
        try {
            // Validation
            if (!currentProduct.name || !currentProduct.price) {
                toast({ title: 'Error', description: 'Name and Price are required', variant: 'destructive' });
                return;
            }

            const productData = {
                name: currentProduct.name,
                description: currentProduct.description || '',
                price: currentProduct.price,
                cost_price: currentProduct.cost_price,
                current_stock: Number(currentProduct.current_stock) || 0,
                reorder_level: Number(currentProduct.reorder_level) || 5,
                is_active: true,
                sku: currentProduct.sku || ''
            };

            if (currentProduct.id) {
                await updateProduct(currentProduct.id, productData);
                toast({ title: 'Success', description: 'Product updated successfully' });
            } else {
                await createProduct(productData as any);
                toast({ title: 'Success', description: 'Product created successfully' });
            }

            setIsProductDialogOpen(false);
            setCurrentProduct({});
            loadData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save product', variant: 'destructive' });
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await deleteProduct(id);
            toast({ title: 'Success', description: 'Product deleted successfully' });
            loadData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
        }
    };

    const handleStockAdjustment = async () => {
        try {
            if (!stockAdjustment.productId || stockAdjustment.quantity === 0) {
                toast({ title: 'Error', description: 'Product and non-zero quantity required', variant: 'destructive' });
                return;
            }

            await createInventoryLog({
                product: stockAdjustment.productId,
                change_quantity: Number(stockAdjustment.quantity),
                reason: stockAdjustment.reason,
                notes: stockAdjustment.notes
            });

            toast({ title: 'Success', description: 'Stock updated successfully' });
            setIsStockDialogOpen(false);
            setStockAdjustment({ productId: '', quantity: 0, reason: 'restock', notes: '' });
            loadData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to adjust stock', variant: 'destructive' });
        }
    };

    const openEditDialog = (product: Product) => {
        setCurrentProduct(product);
        setIsProductDialogOpen(true);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout title="Inventory">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-foreground">Inventory Management</h1>
                        <p className="text-muted-foreground">Track stock levels and product usage.</p>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <ArrowUpRight className="w-4 h-4" />
                                    Quick Adjust
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Adjust Stock Level</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Product</Label>
                                        <Select
                                            value={stockAdjustment.productId}
                                            onValueChange={(val) => setStockAdjustment({ ...stockAdjustment, productId: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Product" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name} (Current: {p.current_stock})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Quantity Change (+/-)</Label>
                                        <Input
                                            type="number"
                                            value={stockAdjustment.quantity}
                                            onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: Number(e.target.value) })}
                                            placeholder="e.g. 10 or -5"
                                        />
                                        <p className="text-xs text-muted-foreground">Positive to add stock, negative to remove.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reason</Label>
                                        <Select
                                            value={stockAdjustment.reason}
                                            onValueChange={(val) => setStockAdjustment({ ...stockAdjustment, reason: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="restock">Restock / Purchase</SelectItem>
                                                <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                                                <SelectItem value="damage">Damaged / Expired</SelectItem>
                                                <SelectItem value="sale">Direct Sale</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Notes</Label>
                                        <Input
                                            value={stockAdjustment.notes}
                                            onChange={(e) => setStockAdjustment({ ...stockAdjustment, notes: e.target.value })}
                                            placeholder="Optional notes"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleStockAdjustment}>Update Stock</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="flex items-center gap-2" onClick={() => setCurrentProduct({})}>
                                    <Plus className="w-4 h-4" />
                                    Add Product
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>{currentProduct.id ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4 py-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label>Product Name</Label>
                                        <Input
                                            value={currentProduct.name || ''}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                            placeholder="e.g. Shampoo"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>SKU (Optional)</Label>
                                        <Input
                                            value={currentProduct.sku || ''}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, sku: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Current Stock</Label>
                                        <Input
                                            type="number"
                                            value={currentProduct.current_stock || 0}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, current_stock: Number(e.target.value) })}
                                            disabled={!!currentProduct.id} // Disable editing stock directly on edit, enforce logs
                                        />
                                        {currentProduct.id && <p className="text-xs text-muted-foreground">Use Quick Adjust to change stock.</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Retail Price</Label>
                                        <Input
                                            type="number"
                                            value={currentProduct.price || ''}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cost Price</Label>
                                        <Input
                                            type="number"
                                            value={currentProduct.cost_price || ''}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, cost_price: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reorder Level</Label>
                                        <Input
                                            type="number"
                                            value={currentProduct.reorder_level || 5}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, reorder_level: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>Description</Label>
                                        <Input
                                            value={currentProduct.description || ''}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateProduct}>Save Product</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Tabs defaultValue="products" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="products">Products & Stock</TabsTrigger>
                        <TabsTrigger value="logs">History Logs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="products" className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No products found. Add one to get started.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredProducts.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="w-4 h-4 text-muted-foreground" />
                                                        {product.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{product.sku || '-'}</TableCell>
                                                <TableCell className="text-right">{parseFloat(product.price).toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className={`inline-flex items-center gap-1 font-bold ${product.current_stock <= product.reorder_level ? 'text-red-600' : 'text-green-600'
                                                        }`}>
                                                        {product.current_stock}
                                                        {product.current_stock <= product.reorder_level && (
                                                            <AlertTriangle className="w-3 h-3" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {product.is_active ? (
                                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
                                                    ) : (
                                                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Inactive</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteProduct(product.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    <TabsContent value="logs">
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Change</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                                        </TableRow>
                                    ) : logs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No history logs found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        logs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>{format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                                                <TableCell className="font-medium">{log.product_name}</TableCell>
                                                <TableCell>
                                                    {log.change_quantity > 0 ? (
                                                        <span className="flex items-center gap-1 text-green-600"><ArrowUpRight className="w-3 h-3" /> Addition</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-amber-600"><ArrowDownRight className="w-3 h-3" /> Deduction</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className={`text-right font-mono font-medium ${log.change_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {log.change_quantity > 0 ? '+' : ''}{log.change_quantity}
                                                </TableCell>
                                                <TableCell className="capitalize">{log.reason.replace('_', ' ')}</TableCell>
                                                <TableCell>{log.created_by_name || 'System'}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
