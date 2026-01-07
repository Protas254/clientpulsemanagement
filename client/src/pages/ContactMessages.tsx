import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    fetchContactMessages,
    deleteContactMessage,
    markContactMessageAsRead,
    ContactMessage
} from '@/services/api';
import { format } from 'date-fns';
import { Mail, Phone, User, Calendar, Trash2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ContactMessages() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const data = await fetchContactMessages();
            setMessages(data);
            setSelectedIds(new Set()); // Reset selection on reload
        } catch (error) {
            console.error('Failed to load messages', error);
            toast({
                title: 'Error',
                description: 'Failed to load messages',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === messages.length) {
            setSelectedIds(new Set());
        } else {
            const allIds = messages.map(m => m.id).filter(id => id !== undefined) as string[];
            setSelectedIds(new Set(allIds));
        }
    };

    const handleMarkAsRead = async () => {
        if (selectedIds.size === 0) return;

        try {
            const promises = Array.from(selectedIds).map(id => markContactMessageAsRead(id));
            await Promise.all(promises);

            toast({
                title: 'Success',
                description: `Marked ${selectedIds.size} messages as read`,
            });
            loadMessages();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update messages',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async () => {
        if (selectedIds.size === 0) return;

        if (!confirm('Are you sure you want to delete the selected messages?')) return;

        try {
            const promises = Array.from(selectedIds).map(id => deleteContactMessage(id));
            await Promise.all(promises);

            toast({
                title: 'Success',
                description: `Deleted ${selectedIds.size} messages`,
            });
            loadMessages();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete messages',
                variant: 'destructive',
            });
        }
    };

    const areAllSelected = messages.length > 0 && selectedIds.size === messages.length;

    return (
        <AppLayout title="Contact Messages">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-foreground">Contact Messages</h1>
                        <p className="text-muted-foreground">View messages from your customers.</p>
                    </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="select-all"
                            checked={areAllSelected}
                            onCheckedChange={toggleSelectAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer ml-2">
                            Select All
                        </label>
                        {selectedIds.size > 0 && (
                            <span className="text-sm text-muted-foreground ml-4">
                                {selectedIds.size} selected
                            </span>
                        )}
                    </div>

                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMarkAsRead}
                                className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                                <CheckCircle className="w-4 h-4" />
                                <span className="hidden sm:inline">Mark Read</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDelete}
                                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Delete</span>
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid gap-4">
                    {messages.length === 0 && !loading ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                No messages found.
                            </CardContent>
                        </Card>
                    ) : (
                        messages.map((msg) => {
                            const isSelected = msg.id ? selectedIds.has(msg.id) : false;

                            return (
                                <Card
                                    key={msg.id}
                                    className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-amber-500 bg-amber-50/10' : ''
                                        } ${msg.is_read ? 'opacity-75' : '' // Dim read messages slightly
                                        }`}
                                >
                                    <CardHeader className={`pb-3 ${msg.is_read ? 'bg-muted/30' : 'bg-amber-50'}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <div className="pt-1">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => msg.id && toggleSelection(msg.id)}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <span className={`font-semibold ${!msg.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {msg.full_name}
                                                    </span>
                                                    {!msg.is_read && (
                                                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium">
                                                            New
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="w-4 h-4" />
                                                {msg.created_at && format(new Date(msg.created_at), 'MMM d, yyyy h:mm a')}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-3">
                                        <div className="flex flex-wrap gap-4 text-sm pl-7">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Mail className="w-4 h-4" />
                                                {msg.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="w-4 h-4" />
                                                {msg.phone}
                                            </div>
                                        </div>
                                        <div className="pl-7">
                                            <h3 className={`font-semibold mb-1 text-lg ${!msg.is_read ? 'text-black' : 'text-gray-700'}`}>
                                                {msg.subject}
                                            </h3>
                                            <p className="text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
