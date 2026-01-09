import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
    id: string; // The canonical User UUID
    username: string;
    email: string;
    role: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    photo?: string;
    tenant_id?: string;
}

interface AuthState {
    token: string | null;
    user: User | null;
    customerData: any | null;
    setAuth: (token: string, userData: any) => void;
    setCustomerData: (data: any) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            customerData: null,
            setAuth: (token, userData) => {
                // EXTREME NORMALIZATION: 
                // We must ensure the 'id' field is exactly the User UUID from the server.
                // The server returns it as 'user_id' in the login response.
                const userId = userData.user_id || userData.id || '';

                const normalizedUser: User = {
                    ...userData,
                    id: String(userId).toLowerCase()
                };

                set({ token, user: normalizedUser, customerData: null });

                // Backup storage
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(normalizedUser));
            },
            setCustomerData: (customerData) => set({ customerData }),
            logout: () => {
                set({ token: null, user: null, customerData: null });
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('customerData');
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
