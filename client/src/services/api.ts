export interface Service {
    id: number;
    name: string;
    category: 'hair' | 'spa' | 'nails' | 'facial' | 'other';
    price: string;
    duration: number;
    description: string;
    is_active: boolean;
    created_at: string;
}

export interface StaffMember {
    id: number;
    name: string;
    phone: string;
    is_active: boolean;
    joined_date: string;
    created_at: string;
}

export interface Visit {
    id: number;
    customer: number;
    customer_name?: string;
    services: number[];
    services_detail?: Service[];
    staff_member: number | null;
    staff_member_name?: string;
    visit_date: string;
    total_amount: string;
    payment_status: 'pending' | 'paid' | 'partial';
    notes: string;
}

export interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: 'active' | 'inactive' | 'vip';
    location?: string;
    notes?: string;
    points: number;
    last_purchase?: string;
    created_at: string;
    visit_count: number;
    favorite_services?: Service[];
    preferred_staff?: StaffMember;
    service_notes?: string;
}

export interface Sale {
    id: number;
    customer: number;
    customer_name: string;
    amount: string;
    description: string;
    date: string;
}

export interface DashboardStats {
    current_month_sales: number;
    last_month_sales: number;
    sales_growth: number;
    total_transactions: number;
    avg_order: number;
    total_customers: number;
    active_customers: number;
}

export interface DailyStats {
    date: string;
    customers_served: number;
    revenue: number;
    popular_services: Array<{
        id: number;
        name: string;
        times_booked: number;
        price: number;
    }>;
    staff_performance: Array<{
        id: number;
        name: string;
        customers_served: number;
        revenue_generated: number;
    }>;
}

export interface Reward {
    id: number;
    name: string;
    description: string;
    points_required: number;
    type: 'discount' | 'gift' | 'cashback' | 'free_service';
    value: string;
    expiry_date: string;
    status: 'active' | 'disabled' | 'expired';
    created_at: string;
    times_redeemed: number;
    visits_required?: number;
    applicable_services_detail?: Service[];
}

const API_URL = 'http://localhost:8000/api/';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Token ${token}` : '',
    };
};

// Website functions removed as requested

// Authentication
export const register = async (userData: any) => {
    const response = await fetch(`${API_URL}register/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });
    return response.json();
};

export const registerCustomer = async (customer: Omit<Customer, 'id' | 'created_at' | 'points' | 'status' | 'visit_count'>) => {
    const response = await fetch(`${API_URL}customer-signup/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(customer),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to register customer: ${response.status} ${errorText}`);
    }
    return response.json();
};

export const login = async (credentials: any) => {
    const response = await fetch(`${API_URL}login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });
    if (!response.ok) {
        throw new Error('Failed to login');
    }
    return response.json();
};

export const fetchUsers = async () => {
    const response = await fetch(`${API_URL}users/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }
    return response.json();
};

// Services API
export const fetchServices = async (): Promise<Service[]> => {
    const response = await fetch(`${API_URL}services/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch services');
    }
    return response.json();
};

export const createService = async (service: Omit<Service, 'id' | 'created_at'>): Promise<Service> => {
    const response = await fetch(`${API_URL}services/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(service),
    });
    if (!response.ok) {
        throw new Error('Failed to create service');
    }
    return response.json();
};

export const updateService = async (id: number, service: Partial<Service>): Promise<Service> => {
    const response = await fetch(`${API_URL}services/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(service),
    });
    if (!response.ok) {
        throw new Error('Failed to update service');
    }
    return response.json();
};

export const deleteService = async (id: number) => {
    const response = await fetch(`${API_URL}services/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete service');
    }
};

// Staff API
export const fetchStaff = async (): Promise<StaffMember[]> => {
    const response = await fetch(`${API_URL}staff/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch staff');
    }
    return response.json();
};

export const createStaff = async (staff: Omit<StaffMember, 'id' | 'created_at' | 'joined_date'>): Promise<StaffMember> => {
    const response = await fetch(`${API_URL}staff/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(staff),
    });
    if (!response.ok) {
        throw new Error('Failed to create staff member');
    }
    return response.json();
};

export const updateStaff = async (id: number, staff: Partial<StaffMember>): Promise<StaffMember> => {
    const response = await fetch(`${API_URL}staff/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(staff),
    });
    if (!response.ok) {
        throw new Error('Failed to update staff member');
    }
    return response.json();
};

export const deleteStaff = async (id: number) => {
    const response = await fetch(`${API_URL}staff/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete staff member');
    }
};

// Visits API
export const fetchVisits = async (params?: { customer?: number }): Promise<Visit[]> => {
    let url = `${API_URL}visits/`;
    if (params?.customer) {
        url += `?customer=${params.customer}`;
    }
    const response = await fetch(url, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch visits');
    }
    return response.json();
};

export const createVisit = async (visit: { customer: number; service_ids: number[]; staff_member?: number; total_amount: string; payment_status: string; notes?: string }): Promise<Visit> => {
    const response = await fetch(`${API_URL}visits/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(visit),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create visit: ${errorText}`);
    }
    return response.json();
};

// Customers API
export const fetchCustomers = async () => {
    const response = await fetch(`${API_URL}customers/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch customers');
    }
    return response.json();
};

export const fetchCustomerPortalDetails = async (id: number) => {
    const response = await fetch(`${API_URL}customers/${id}/portal-details/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch customer portal details');
    }
    return response.json();
};

export const createCustomer = async (customer: Omit<Customer, 'id' | 'created_at'>) => {
    const response = await fetch(`${API_URL}customers/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(customer),
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Create customer failed:', response.status, errorText);
        throw new Error(`Failed to create customer: ${response.status} ${errorText}`);
    }
    return response.json();
};

export const updateCustomer = async (id: number, customer: Partial<Customer>) => {
    const response = await fetch(`${API_URL}customers/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(customer),
    });
    if (!response.ok) {
        throw new Error('Failed to update customer');
    }
    return response.json();
};

export const deleteCustomer = async (id: number) => {
    const response = await fetch(`${API_URL}customers/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete customer');
    }
};

export const fetchCustomerServiceHistory = async (customerId: number) => {
    const response = await fetch(`${API_URL}customers/${customerId}/service-history/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch customer service history');
    }
    return response.json();
};

// Sales API (backward compatibility)
export const fetchSales = async () => {
    const response = await fetch(`${API_URL}sales/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch sales');
    }
    return response.json();
};

export const createSale = async (sale: Omit<Sale, 'id' | 'date' | 'customer_name'>) => {
    const response = await fetch(`${API_URL}sales/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(sale),
    });
    if (!response.ok) {
        throw new Error('Failed to create sale');
    }
    return response.json();
};

// Dashboard Stats
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
    const response = await fetch(`${API_URL}dashboard-stats/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
    }
    return response.json();
};

export const fetchDailyStats = async (): Promise<DailyStats> => {
    const response = await fetch(`${API_URL}dashboard/daily-stats/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch daily stats');
    }
    return response.json();
};

export const fetchTopCustomers = async () => {
    const response = await fetch(`${API_URL}dashboard/top-customers/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch top customers');
    }
    return response.json();
};

export interface AnalyticsData {
    monthly_sales: {
        month: string;
        sales: number;
        customers: number;
    }[];
    customer_growth: {
        month: string;
        active: number;
        vip: number;
        inactive: number;
    }[];
    summary: {
        total_annual_sales: number;
        avg_monthly_sales: number;
        total_customers_gained: number;
    };
    retention_stats: {
        retention_rate: number;
        avg_visits_per_client: number;
        avg_visit_value: number;
        customer_rating: number;
    };
}

export const fetchAnalytics = async (): Promise<AnalyticsData> => {
    const response = await fetch(`${API_URL}dashboard/analytics/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch analytics');
    }
    return response.json();
};

// Rewards API
export const fetchRewards = async () => {
    const response = await fetch(`${API_URL}rewards/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch rewards');
    }
    return response.json();
};

export const createReward = async (reward: Omit<Reward, 'id' | 'created_at' | 'times_redeemed'>) => {
    const response = await fetch(`${API_URL}rewards/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(reward),
    });
    if (!response.ok) {
        throw new Error('Failed to create reward');
    }
    return response.json();
};

export const updateReward = async (id: number, reward: Partial<Reward>) => {
    const response = await fetch(`${API_URL}rewards/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(reward),
    });
    if (!response.ok) {
        throw new Error('Failed to update reward');
    }
    return response.json();
};

export const deleteReward = async (id: number) => {
    const response = await fetch(`${API_URL}rewards/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete reward');
    }
};

export const checkRewards = async (identifier: string) => {
    const response = await fetch(`${API_URL}check-rewards/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier }),
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Customer not found');
        }
        throw new Error('Failed to check rewards');
    }

    return response.json();
};

// Bookings API
export interface Booking {
    id: number;
    customer: number;
    customer_name?: string;
    service: number;
    service_name?: string;
    staff_member: number | null;
    staff_member_name?: string;
    booking_date: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes: string;
    created_at: string;
}

export const fetchBookings = async (params?: { customer?: number; status?: string; search?: string }): Promise<Booking[]> => {
    let url = `${API_URL}bookings/`;
    const queryParams = new URLSearchParams();
    if (params?.customer) queryParams.append('customer', params.customer.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    if (queryString) {
        url += `?${queryString}`;
    }

    const response = await fetch(url, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch bookings');
    }
    return response.json();
};

export const createBooking = async (booking: Omit<Booking, 'id' | 'created_at' | 'customer_name' | 'service_name' | 'staff_member_name'>): Promise<Booking> => {
    const response = await fetch(`${API_URL}bookings/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(booking),
    });
    if (!response.ok) {
        throw new Error('Failed to create booking');
    }
    return response.json();
};

export const updateBooking = async (id: number, booking: Partial<Booking>): Promise<Booking> => {
    const response = await fetch(`${API_URL}bookings/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(booking),
    });
    if (!response.ok) {
        throw new Error('Failed to update booking');
    }
    return response.json();
};

// Rewards Stats API
export interface RewardsStats {
    total_rewards_created: number;
    total_rewards_claimed: number;
    eligible_rewards: Reward[];
    redemptions: CustomerReward[];
    pending_redemptions: number;
}

export const fetchRewardsStats = async (): Promise<RewardsStats> => {
    const response = await fetch(`${API_URL}rewards/stats/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch rewards stats');
    }
    return response.json();
};

export interface CustomerReward {
    id: number;
    customer: number;
    customer_name?: string;
    reward: number;
    reward_name?: string;
    reward_description?: string;
    reward_value?: string;
    customer_visit_count?: number;
    date_claimed: string;
    date_redeemed: string | null;
    status: 'pending' | 'redeemed' | 'expired';
}

export const fetchCustomerRewards = async (): Promise<CustomerReward[]> => {
    const response = await fetch(`${API_URL}customer-rewards/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch customer rewards');
    }
    return response.json();
};

export const redeemReward = async (data: { customer: number; reward: number; date_claimed: string }) => {
    const response = await fetch(`${API_URL}customer-rewards/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to redeem reward');
    }
    return response.json();
};
