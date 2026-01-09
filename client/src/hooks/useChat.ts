import { useState, useEffect, useCallback, useMemo } from 'react';
import { chatService, ChatMessage } from '@/services/chat';
import { API_URL } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';

// THE CORE IDENTITY ENGINE
// This function determines if a message belongs to the current viewer.
// It is the single source of truth for the Right/Left flow.
export const isMessageMe = (messageSender: any, currentUserId: string | undefined): boolean => {
    if (!messageSender || !currentUserId) return false;

    // 1. Extract the raw sender ID (could be string or object)
    const senderId = typeof messageSender === 'object' ? (messageSender.id || messageSender.user_id) : messageSender;

    if (!senderId) return false;

    // 2. Normalize both IDs: remove dashes, lowercase, and trim
    // This makes UUIDs like "DF76-..." match "df76..."
    const normSender = String(senderId).toLowerCase().replace(/[^a-z0-9]/g, '');
    const normMe = String(currentUserId).toLowerCase().replace(/[^a-z0-9]/g, '');

    return normSender === normMe && normMe !== '';
};

export function useChat(sessionId: string | null) {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load History
    useEffect(() => {
        if (!sessionId || !user) {
            setMessages([]);
            return;
        }

        const loadHistory = async () => {
            setIsLoading(true);
            try {
                const history = await chatService.getMessages(sessionId);
                setMessages(history);
                setError(null);
            } catch (err) {
                console.error("Chat history load failed:", err);
                setError("Failed to load history");
            } finally {
                setIsLoading(false);
            }
        };

        loadHistory();
    }, [sessionId, user?.id]);

    // WebSocket Stream
    useEffect(() => {
        if (!sessionId || !user) {
            setIsConnected(false);
            setSocket(null);
            return;
        }

        const wsUrl = (API_URL.startsWith('http')
            ? API_URL.replace('http', 'ws').replace('/api/', '/ws/')
            : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//localhost:8000/ws/`) + `chat/${sessionId}/`;

        // Clean URL to handle double slashes and ensure absolute path
        const cleanWsUrl = wsUrl.replace(/([^:]\/)\/+/g, "$1");

        const ws = new WebSocket(cleanWsUrl);

        ws.onopen = () => {
            setIsConnected(true);
            setError(null);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.message) {
                    const newMessage: ChatMessage = {
                        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                        session: sessionId,
                        sender: data.sender_id,
                        sender_name: 'User',
                        sender_initial: '?',
                        content: data.message,
                        created_at: new Date().toISOString(),
                        is_read: false,
                        is_me: false // Recalculated by safeMessages
                    };

                    setMessages(prev => {
                        const isDup = prev.some(m => m.content === newMessage.content && Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 1000);
                        return isDup ? prev : [...prev, newMessage];
                    });
                }
            } catch (err) {
                console.error("Stream error:", err);
            }
        };

        ws.onclose = () => setIsConnected(false);
        ws.onerror = () => setError("Stream error");

        setSocket(ws);
        return () => ws.close();
    }, [sessionId, user?.id]);

    const sendMessage = useCallback((content: string) => {
        if (socket && isConnected && user && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                message: content,
                sender_id: String(user.id)
            }));
        }
    }, [socket, isConnected, user]);

    // PROTECTED MESSAGE FLOW LOGIC
    const safeMessages = useMemo(() => {
        if (!user) return messages;

        return messages.map((m, index) => {
            // STRICT ME CHECK
            const isMe = isMessageMe(m.sender, user.id);

            // Grouping logic for visual spacing
            const prevMsg = messages[index - 1];
            const isGroupStart = !prevMsg || !isMessageMe(prevMsg.sender, m.sender);

            return {
                ...m,
                is_me: isMe,
                isGroupStart
            };
        });
    }, [messages, user?.id]);

    return { messages: safeMessages, sendMessage, isConnected, isLoading, error };
}
