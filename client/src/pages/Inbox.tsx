import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/store/useAuthStore';
import { useChat, isMessageMe } from '@/hooks/useChat';
import { chatService, ChatSession } from '@/services/chat';
import { fetchContactMessages, ContactMessage, markContactMessageAsRead, deleteContactMessage } from '@/services/api';
import { MessageSquare, Mail, Search, Send, CheckCircle, Trash2, User, Phone, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export default function Inbox() {
    const [activeTab, setActiveTab] = useState('chat');

    return (
        <AppLayout title="Inbox" subtitle="Manage customer communications">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-140px)] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger value="chat" className="flex items-center gap-2 px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest">
                            <MessageSquare className="w-4 h-4" />
                            Live Chat
                        </TabsTrigger>
                        <TabsTrigger value="email" className="flex items-center gap-2 px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest">
                            <Mail className="w-4 h-4" />
                            Email Inquiries
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="chat" className="flex-1 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-md mt-0 h-full">
                    <ChatInterface />
                </TabsContent>

                <TabsContent value="email" className="mt-0 h-full overflow-y-auto">
                    <EmailInquiries />
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}

function ChatInterface() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const { user } = useAuthStore();

    useEffect(() => {
        loadSessions();
        const interval = setInterval(loadSessions, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadSessions = async () => {
        try {
            const data = await chatService.getSessions();
            setSessions(data);
        } catch (error) {
            console.error("Inbox: Session load fail", error);
        }
    };

    const selectedSession = sessions.find(s => s.id === selectedSessionId);
    const { messages, sendMessage, isConnected, isLoading } = useChat(selectedSessionId);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, selectedSessionId]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        sendMessage(inputText);
        setInputText('');
    };

    return (
        <div className="flex h-full">
            {/* Sidebar List */}
            <div className="w-80 border-r border-slate-100 bg-slate-50/50 flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="pl-10 bg-slate-100 border-0 rounded-xl h-10 text-sm font-bold"
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="flex flex-col">
                        {sessions.length === 0 ? (
                            <div className="p-10 text-center text-slate-300">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Idle</p>
                            </div>
                        ) : sessions.map(session => (
                            <button
                                key={session.id}
                                onClick={() => setSelectedSessionId(session.id)}
                                className={cn(
                                    "flex items-start gap-4 p-5 text-left transition-all border-b border-slate-50 last:border-0 hover:bg-white",
                                    selectedSessionId === session.id ? 'bg-white shadow-sm ring-1 ring-slate-100' : ''
                                )}
                            >
                                <div className="relative">
                                    <Avatar className="w-12 h-12 shadow-sm ring-1 ring-slate-100">
                                        <AvatarFallback className="bg-slate-100 text-[#4a3728] font-black">{session.customer_name?.[0] || '?'}</AvatarFallback>
                                    </Avatar>
                                    {session.unread_count > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#4a3728] text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white">
                                            {session.unread_count}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden pt-1">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-extrabold text-sm text-slate-800 truncate">{session.customer_name || 'Customer'}</span>
                                        {session.last_message && (
                                            <span className="text-[8px] font-black text-slate-300 uppercase">
                                                {format(new Date(session.last_message.created_at), 'HH:mm')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 truncate font-bold uppercase tracking-tight">
                                        {session.last_message?.content || 'New inquiry'}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Flow Canvas */}
            <div className="flex-1 flex flex-col bg-slate-50 relative">
                {selectedSessionId ? (
                    <>
                        {/* Header */}
                        <div className="p-5 border-b bg-white flex items-center justify-between shadow-sm z-10">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-11 h-11 border-2 border-slate-50">
                                    <AvatarFallback className="bg-[#4a3728] text-white font-black">{selectedSession?.customer_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-black text-[#4a3728] text-base leading-none mb-1">{selectedSession?.customer_name}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-slate-300")} />
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isConnected ? 'Live' : 'Offline'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pattern Area */}
                        <div
                            className="flex-1 overflow-y-auto p-8 space-y-4 relative scroll-smooth"
                            ref={scrollRef}
                            style={{
                                backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                                backgroundSize: '30px 30px'
                            }}
                        >
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                </div>
                            ) : (
                                messages.map((msg: any, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300",
                                            msg.isGroupStart ? "mt-8" : "mt-0.5",
                                            msg.is_me ? "items-end" : "items-start" // STRICT ME = RIGHT
                                        )}
                                    >
                                        {msg.isGroupStart && !msg.is_me && (
                                            <span className="text-[10px] font-black text-[#4a3728]/40 uppercase tracking-[0.2em] mb-2 ml-1">
                                                {selectedSession?.customer_name || 'Customer'}
                                            </span>
                                        )}

                                        <div className={cn(
                                            "flex items-end gap-2",
                                            msg.is_me ? "flex-row-reverse" : "flex-row"
                                        )}>
                                            {!msg.is_me && (
                                                <Avatar className="w-6 h-6 border shadow-sm shrink-0">
                                                    <AvatarFallback className="bg-white text-[10px] font-black">{selectedSession?.customer_name?.[0]}</AvatarFallback>
                                                </Avatar>
                                            )}

                                            <div className={cn(
                                                "px-5 py-3 rounded-2xl text-[14px] shadow-sm font-semibold max-w-[70%] leading-relaxed",
                                                msg.is_me
                                                    ? "bg-[#4a3728] text-white rounded-br-none" // RIGHT + BROWN
                                                    : "bg-white border border-slate-100 text-slate-800 rounded-bl-none" // LEFT + WHITE
                                            )}>
                                                <p>{msg.content}</p>
                                                <span className={cn(
                                                    "text-[8px] font-black mt-2 block uppercase opacity-40 text-right",
                                                    msg.is_me ? "text-white/80" : "text-slate-400"
                                                )}>
                                                    {format(new Date(msg.created_at), 'hh:mm a')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Reply Field */}
                        <div className="p-6 border-t bg-white">
                            <div className="flex gap-4 p-2 bg-slate-100 rounded-full items-center focus-within:bg-white focus-within:ring-2 focus-within:ring-[#4a3728]/10 transition-all border border-transparent focus-within:border-slate-200">
                                <Input
                                    placeholder="Reply to customer..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                                    className="border-0 bg-transparent focus-visible:ring-0 px-6 h-12 text-slate-700 font-bold"
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!inputText.trim() || !isConnected}
                                    className="rounded-full w-12 h-12 shrink-0 bg-[#4a3728] hover:bg-[#382a1e] shadow-xl"
                                >
                                    <Send className="w-5 h-5 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-30">
                        <MessageSquare className="w-16 h-16 text-[#4a3728] mb-6" />
                        <p className="text-xs font-black uppercase tracking-[0.3em]">Communication Hub</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function EmailInquiries() {
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
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Inbox: Email load fail', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === messages.length) setSelectedIds(new Set());
        else {
            const allIds = messages.map(m => m.id).filter(id => id !== undefined) as string[];
            setSelectedIds(new Set(allIds));
        }
    };

    const handleMarkAsRead = async () => {
        if (selectedIds.size === 0) return;
        try {
            await Promise.all(Array.from(selectedIds).map(id => markContactMessageAsRead(id)));
            toast({ title: 'Success', description: `Inquiries marked as read` });
            loadMessages();
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive', description: 'Action failed' });
        }
    };

    const handleDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm('Permanently delete selected items?')) return;
        try {
            await Promise.all(Array.from(selectedIds).map(id => deleteContactMessage(id)));
            toast({ title: 'Success', description: `Inquiries purged` });
            loadMessages();
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive', description: 'Purge failed' });
        }
    };

    const areAllSelected = messages.length > 0 && selectedIds.size === messages.length;

    if (loading && messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 opacity-30">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm px-6">
                <div className="flex items-center gap-4">
                    <Checkbox id="select-all" checked={areAllSelected} onCheckedChange={toggleSelectAll} className="w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-[#4a3728]" />
                    <label htmlFor="select-all" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 cursor-pointer">Select All</label>
                </div>
                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleMarkAsRead} className="text-[#4a3728] border-slate-200 rounded-xl font-black text-[10px] uppercase">
                            <CheckCircle className="w-3.5 h-3.5 mr-2" /> Mark Seen
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 border-red-200 rounded-xl font-black text-[10px] uppercase">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Purge
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid gap-5">
                {messages.length === 0 ? (
                    <Card className="border-dashed border-2 bg-slate-50/20"><CardContent className="p-20 text-center opacity-20 font-black uppercase">Inbox Empty</CardContent></Card>
                ) : (
                    messages.map((msg) => (
                        <Card key={msg.id} className={cn(
                            "transition-all border-slate-100 shadow-sm rounded-2xl overflow-hidden",
                            selectedIds.has(msg.id!) ? 'ring-2 ring-[#4a3728]' : '',
                            msg.is_read ? 'opacity-50' : ''
                        )}>
                            <div className={cn("h-1.5 w-full", !msg.is_read ? "bg-[#4a3728]" : "bg-slate-100")} />
                            <CardHeader className="pb-3 pt-5 px-8">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-5">
                                        <Checkbox checked={selectedIds.has(msg.id!)} onCheckedChange={() => msg.id && toggleSelection(msg.id)} className="w-5 h-5 rounded-md border-slate-200 data-[state=checked]:bg-[#4a3728]" />
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 ring-1 ring-slate-100 rounded-full flex items-center justify-center text-[#4a3728] font-black text-lg">
                                                {msg.full_name[0]}
                                            </div>
                                            <div>
                                                <span className="text-base block font-black tracking-tight">{msg.full_name}</span>
                                                {!msg.is_read && <Badge className="text-[8px] h-4 bg-[#4a3728] text-white border-0 font-black uppercase mt-1">New</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-300 uppercase">{msg.created_at && format(new Date(msg.created_at), 'MMM d, HH:mm')}</div>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-8 px-8 pl-24 space-y-4">
                                <div className="flex flex-wrap gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {msg.email}</span>
                                    <span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {msg.phone}</span>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-black text-[#4a3728] text-lg tracking-tight">{msg.subject}</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed font-semibold p-5 bg-slate-50/80 rounded-2xl border border-slate-100/50 italic">{msg.message}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
