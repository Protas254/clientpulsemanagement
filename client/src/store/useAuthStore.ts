import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    photo?: string;
}

interface AuthState {
    token: string | null;
    user: User | null;
    customerData: any | null;
    setAuth: (token: string, user: User) => void;
    setCustomerData: (data: any) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            customerData: null,
            setAuth: (token, user) => set({ token, user }),
            setCustomerData: (customerData) => set({ customerData }),
            logout: () => set({ token: null, user: null, customerData: null }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
