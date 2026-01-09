import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { chatService, ChatMessage } from '@/services/chat';
import { API_URL } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, MessageSquare, X, Send, Minimize2, Maximize2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { isMessageMe } from '@/hooks/useChat';

interface ChatWidgetProps {
    tenantId: string;
    tenantName?: string;
    tenantLogo?: string;
}

export function ChatWidget({ tenantId, tenantName = "Support", tenantLogo }: ChatWidgetProps) {
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [sessionError, setSessionError] = useState<string | null>(null);

    // Message Tracking
    const [rawMessages, setRawMessages] = useState<ChatMessage[]>([]);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);

    // Load History
    useEffect(() => {
        if (!sessionId || !isOpen || !user) return;

        const loadHistory = async () => {
            setIsLoading(true);
            try {
                const history = await chatService.getMessages(sessionId);
                setRawMessages(history);
                setChatError(null);
            } catch (error) {
                console.error("Chat Widget history error:", error);
                setChatError("History unavailable");
            } finally {
                setIsLoading(false);
            }
        };

        loadHistory();
    }, [sessionId, isOpen, user?.id]);

    // WebSocket Logic
    useEffect(() => {
        if (!sessionId || !user || !isOpen) {
            setIsConnected(false);
            setSocket(null);
            return;
        }

        const wsUrl = (API_URL.startsWith('http')
            ? API_URL.replace('http', 'ws').replace('/api/', '/ws/')
            : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//localhost:8000/ws/`) + `chat/${sessionId}/`;

        const cleanWsUrl = wsUrl.replace(/([^:]\/)\/+/g, "$1");
        const ws = new WebSocket(cleanWsUrl);

        ws.onopen = () => {
            setIsConnected(true);
            setChatError(null);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.message) {
                    const newMessage: ChatMessage = {
                        id: `wmsg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                        session: sessionId,
                        sender: data.sender_id,
                        sender_name: 'Agent',
                        sender_initial: '?',
                        content: data.message,
                        created_at: new Date().toISOString(),
                        is_read: false,
                        is_me: false // Recalculated by safeMessages
                    };

                    setRawMessages(prev => {
                        const isDup = prev.some(m => m.content === newMessage.content && Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 1000);
                        return isDup ? prev : [...prev, newMessage];
                    });
                }
            } catch (err) {
                console.error("Parser fail:", err);
            }
        };

        ws.onerror = () => setIsConnected(false);
        ws.onclose = () => setIsConnected(false);

        setSocket(ws);
        return () => ws.close();
    }, [sessionId, user?.id, isOpen]);

    // ABSOLUTE FLOW ENGINE: 
    // This transforms raw messages into positioned UI elements
    const displayMessages = useMemo(() => {
        if (!user) return [];
        return rawMessages.map((m, index) => {
            // STRICT FLOW: ME = RIGHT, !ME = LEFT
            const isMe = isMessageMe(m.sender, user.id);
            const prevMsg = rawMessages[index - 1];
            const isGroupStart = !prevMsg || !isMessageMe(prevMsg.sender, m.sender);

            return {
                ...m,
                is_me: isMe,
                isGroupStart
            };
        });
    }, [rawMessages, user?.id]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'instant' });
        }
    }, [displayMessages, isOpen, isMinimized]);

    const handleOpen = async () => {
        if (!user) {
            window.location.href = '/login';
            return;
        }

        if (!isOpen) {
            setIsOpen(true);
            setIsMinimized(false);
            if (!sessionId) {
                try {
                    setIsLoading(true);
                    const session = await chatService.startSession(tenantId);
                    setSessionId(session.id);
                } catch (error) {
                    setSessionError("Chat session failed");
                } finally {
                    setIsLoading(false);
                }
            }
        } else {
            setIsOpen(false);
        }
    };

    const handleSend = () => {
        if (!inputText.trim() || !socket || !isConnected) return;
        socket.send(JSON.stringify({
            message: inputText,
            sender_id: String(user?.id)
        }));
        setInputText('');
    };

    if (!user || user.role !== 'customer') return null;

    const displayError = sessionError || chatError;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
            <div className={cn(
                "pointer-events-auto transition-all duration-500 ease-in-out transform origin-bottom-right",
                isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
            )}>
                <Card className={cn(
                    "w-[350px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-0 overflow-hidden bg-white flex flex-col transition-all duration-500",
                    isMinimized ? "h-[64px]" : "h-[550px]"
                )}>
                    {/* Header: Premium Brand Style */}
                    <CardHeader className="bg-[#4a3728] text-white p-4 flex flex-row items-center justify-between cursor-pointer space-y-0 h-[64px]" onClick={() => setIsMinimized(!isMinimized)}>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Avatar className="w-10 h-10 border-2 border-white/20 shadow-sm">
                                    <AvatarImage src={tenantLogo?.startsWith('http') ? tenantLogo : (tenantLogo ? `http://localhost:8000${tenantLogo}` : '')} />
                                    <AvatarFallback className="bg-white/10 text-white font-bold">{tenantName[0]}</AvatarFallback>
                                </Avatar>
                                {isConnected && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#4a3728] rounded-full" />}
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold tracking-tight">{tenantName}</CardTitle>
                                <div className="flex items-center gap-1">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-green-400" : "bg-white/40")} />
                                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest leading-none">
                                        {displayError ? 'Offline' : isConnected ? 'Online' : 'Connecting...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10 rounded-full" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10 rounded-full" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    {!isMinimized && (
                        <>
                            {/* Message Canvas */}
                            <CardContent
                                className="flex-1 p-6 overflow-y-auto bg-slate-50 relative"
                                ref={scrollRef}
                                style={{
                                    backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}
                            >
                                {displayError ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-4 border border-red-100">
                                            <p className="text-sm font-semibold">{displayError}</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setSessionId(null); setIsOpen(false); }}>Reconnect</Button>
                                    </div>
                                ) : isLoading && displayMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        {displayMessages.map((msg: any, i) => (
                                            <div key={msg.id || i} className={cn(
                                                "flex flex-col",
                                                msg.isGroupStart ? "mt-6" : "mt-0.5",
                                                msg.is_me ? "items-end text-right" : "items-start text-left" // STRICT ALIGNMENT
                                            )}>
                                                {/* Speaker Identity Label */}
                                                {msg.isGroupStart && !msg.is_me && (
                                                    <span className="text-[9px] font-black text-[#4a3728]/40 uppercase tracking-widest mb-1.5 ml-1">
                                                        {tenantName}
                                                    </span>
                                                )}

                                                <div className={cn(
                                                    "flex items-end gap-2",
                                                    msg.is_me ? "flex-row-reverse" : "flex-row"
                                                )}>
                                                    {!msg.is_me && (
                                                        <Avatar className="w-6 h-6 border shadow-sm shrink-0">
                                                            <AvatarImage src={tenantLogo?.startsWith('http') ? tenantLogo : (tenantLogo ? `http://localhost:8000${tenantLogo}` : '')} />
                                                            <AvatarFallback className="bg-white text-[10px] font-black">{tenantName[0]}</AvatarFallback>
                                                        </Avatar>
                                                    )}

                                                    <div className={cn(
                                                        "px-5 py-3 rounded-2xl text-[13.5px] shadow-sm font-medium leading-relaxed max-w-[85%]",
                                                        msg.is_me
                                                            ? "bg-[#4a3728] text-white rounded-br-none" // RIGHT + BROWN
                                                            : "bg-white border border-slate-100 text-slate-800 rounded-bl-none" // LEFT + WHITE
                                                    )}>
                                                        <p>{msg.content}</p>
                                                        <span className={cn("text-[8px] font-black mt-1.5 block uppercase opacity-50", msg.is_me ? "text-white/80 text-right" : "text-slate-400 text-left")}>
                                                            {format(new Date(msg.created_at), 'hh:mm a')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>

                            {/* Reply Console */}
                            <div className="p-4 border-t bg-white">
                                <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-full border border-transparent focus-within:bg-white focus-within:border-slate-200 transition-all">
                                    <Input
                                        placeholder="Type a message..."
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                                        className="border-0 bg-transparent focus-visible:ring-0 px-4 h-10 font-bold text-slate-700"
                                        disabled={!!displayError || !isConnected}
                                    />
                                    <Button size="icon" onClick={handleSend} disabled={!inputText.trim() || !isConnected} className="rounded-full w-10 h-10 shrink-0 bg-[#4a3728] hover:bg-[#382a1e] shadow-lg">
                                        <Send className="w-4 h-4 ml-0.5" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Card>
            </div>

            {!isOpen && (
                <Button onClick={handleOpen} className="pointer-events-auto h-16 w-16 rounded-full shadow-2xl bg-[#4a3728] hover:bg-[#382a1e] text-white transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8" />
                </Button>
            )}
        </div>
    );
}
