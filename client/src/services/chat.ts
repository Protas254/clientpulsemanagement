import { api } from './api';

export interface ChatMessage {
    id: string;
    session: string;
    sender: string;
    sender_name: string;
    sender_initial: string;
    content: string;
    created_at: string;
    is_read: boolean;
    is_me: boolean;
}

export interface ChatSession {
    id: string;
    tenant: string;
    tenant_name: string;
    customer: string;
    customer_name: string;
    updated_at: string;
    is_active: boolean;
    last_message?: ChatMessage;
    unread_count: number;
}

export const chatService = {
    // Start or get active session with a tenant
    startSession: async (tenantId: string): Promise<ChatSession> => {
        const response = await api.post('/chat/start_session/', { tenant_id: tenantId });
        return response.data;
    },

    // Get all sessions (for tenant view)
    getSessions: async (): Promise<ChatSession[]> => {
        const response = await api.get('/chat/');
        return response.data;
    },

    // Get message history
    getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
        const response = await api.get(`/chat/${sessionId}/messages/`);
        return response.data;
    }
};
