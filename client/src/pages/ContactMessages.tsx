import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { fetchContactMessages, ContactMessage } from '@/services/api';
import { format } from 'date-fns';
import { Mail, Phone, User, Calendar } from 'lucide-react';

export default function ContactMessages() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        try {
            const data = await fetchContactMessages();
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout title="Contact Messages">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Contact Messages</h1>
                    <p className="text-muted-foreground">View messages from your customers.</p>
                </div>

                <div className="grid gap-4">
                    {messages.length === 0 && !loading ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                No messages found.
                            </CardContent>
                        </Card>
                    ) : (
                        messages.map((msg) => (
                            <Card key={msg.id} className="overflow-hidden animate-fade-in">
                                <CardHeader className="bg-muted/30 pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-semibold">{msg.full_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            {msg.created_at && format(new Date(msg.created_at), 'MMM d, yyyy h:mm a')}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Mail className="w-4 h-4" />
                                            {msg.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="w-4 h-4" />
                                            {msg.phone}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1 text-lg">{msg.subject}</h3>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
