import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { API_URL } from '@/services/api';

interface WebSocketContextType {
    socket: WebSocket | null;
    isConnected: boolean;
    lastMessage: any;
}

const WebSocketContext = createContext<WebSocketContextType>({
    socket: null,
    isConnected: false,
    lastMessage: null,
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuthStore();
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.close();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        const connect = () => {
            // Determine WS URL from API_URL or window.location
            // API_URL might be http://localhost:8000/api/
            // We need ws://localhost:8000/ws/dashboard/{tenant_id}/

            let wsBaseUrl = '';
            if (API_URL.startsWith('http')) {
                const urlObj = new URL(API_URL);
                const scheme = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
                wsBaseUrl = `${scheme}//${urlObj.host}`;
            } else {
                // Fallback if API_URL is relative
                const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                wsBaseUrl = `${scheme}//localhost:8000`; // Default dev
            }

            let wsUrl = '';
            if (user.tenant_id) {
                wsUrl = `${wsBaseUrl}/ws/dashboard/${user.tenant_id}/`;
            } else if (user.role === 'admin' || user.is_superuser) {
                wsUrl = `${wsBaseUrl}/ws/super-admin/`;
            } else {
                return; // Normal user without tenant shouldn't connect to dashboard ws
            }
            console.log('Connecting to WebSocket:', wsUrl);

            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('WebSocket Connected');
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('WebSocket Message:', data);
                setLastMessage(data);

                if (data.message) {
                    // Show global notification
                    toast(data.message.title, {
                        description: data.message.message,
                    });
                }
            };

            ws.onclose = () => {
                console.log('WebSocket Disconnected');
                setIsConnected(false);
                setSocket(null);
                // Try reconnect in 3s
                reconnectTimeoutRef.current = setTimeout(connect, 3000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
                ws.close();
            };

            setSocket(ws);
        };

        connect();

        return () => {
            if (socket) socket.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [user?.id]);

    return (
        <WebSocketContext.Provider value={{ socket, isConnected, lastMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};
