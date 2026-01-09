import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    Expense, fetchExpenses, createExpense, deleteExpense,
    fetchAnalytics, AnalyticsData
} from '@/services/api';
import { Plus, Trash2, Receipt, TrendingDown, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const categories = [
    'Rent',
    'Electricity',
    'Water',
    'Marketing',
    'Salaries',
    'Supplies',
    'Internet',
    'Maintenance',
    'Other'
];

export default function Expenses() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Rent',
        amount: '',
        description: '',
        expense_date: format(new Date(), 'yyyy-MM-dd')
    });
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [expensesData, analyticsData] = await Promise.all([
                fetchExpenses(),
                fetchAnalytics()
            ]);
            setExpenses(expensesData);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Failed to load expense data', error);
            toast({
                title: 'Error',
                description: 'Failed to load data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExpense = async () => {
        try {
            if (!formData.name || !formData.amount) {
                toast({ title: 'Error', description: 'Name and Amount are required', variant: 'destructive' });
                return;
            }

            await createExpense({
                name: formData.name,
                category: formData.category,
                amount: formData.amount,
                description: formData.description,
                expense_date: formData.expense_date
            });

            toast({ title: 'Success', description: 'Expense recorded successfully' });
            setIsDialogOpen(false);
            setFormData({
                name: '',
                category: 'Rent',
                amount: '',
                description: '',
                expense_date: format(new Date(), 'yyyy-MM-dd')
            });
            loadData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save expense', variant: 'destructive' });
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await deleteExpense(id);
            toast({ title: 'Success', description: 'Expense deleted successfully' });
            loadData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete expense', variant: 'destructive' });
        }
    };

    const totalPeriodExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    return (
        <AppLayout title="💰 Business Expenses" subtitle="Track your operating costs and overheads">
            <div className="space-y-6">
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-red-600">Total Expenses (30d)</p>
                                    <h3 className="text-2xl font-bold text-red-700">KES {analytics?.summary.expenses.toLocaleString() || '0'}</h3>
                                </div>
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <TrendingDown className="w-5 h-5 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-blue-600">Inventory Cost (COGS)</p>
                                    <h3 className="text-2xl font-bold text-blue-700">KES {analytics?.summary.cogs.toLocaleString() || '0'}</h3>
                                </div>
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Receipt className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm border-2">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-emerald-600">Net Profit (After All Costs)</p>
                                    <h3 className="text-2xl font-bold text-emerald-700">KES {analytics?.summary.net_profit.toLocaleString() || '0'}</h3>
                                    <p className="text-xs text-emerald-600 mt-1">Based on last 30 days performance</p>
                                </div>
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-foreground">Expense Log</h2>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add Expense
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Record New Expense</DialogTitle>
                                <DialogDescription>
                                    Enter the details of your business expense for tracking and analytics.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Expense Name / Payee</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Monthly Rent"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Category</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(val) => setFormData({ ...formData, category: val })}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {categories.map(c => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Amount (KES)</Label>
                                        <Input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="date"
                                            className="pl-8"
                                            value={formData.expense_date}
                                            onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description / Notes</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Add any additional details..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateExpense}>Record Expense</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Expense</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                            ) : expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No expenses recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{format(new Date(expense.expense_date), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="font-medium">
                                            <div>
                                                {expense.name}
                                                {expense.description && <p className="text-xs text-muted-foreground font-normal">{expense.description}</p>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{expense.category}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">KES {parseFloat(expense.amount).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDeleteExpense(expense.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </AppLayout>
    );
}
