export interface Service {
    id: string;
    name: string;
    category: 'hair' | 'spa' | 'nails' | 'facial' | 'salon' | 'barber' | 'other';
    price: string;
    duration: number;
    description: string;
    is_active: boolean;
    created_at: string;
    product_consumption?: {
        id: string;
        product: string;
        product_name?: string;
        quantity: number;
    }[];
}

export interface StaffMember {
    id: string;
    name: string;
    phone: string;
    email?: string;
    specialty?: string;
    commission_percentage: number;
    is_active: boolean;
    joined_date: string;
    created_at: string;
}

export interface Review {
    id: string;
    tenant: string;
    customer: string;
    customer_name: string;
    reviewer_name: string;
    reviewer_type: 'customer' | 'business_owner';
    visit: string;
    visit_date: string;
    rating: number;
    comment: string;
    is_public: boolean;
    created_at: string;
}

export interface Visit {
    id: string;
    customer: string;
    customer_name?: string;
    services: string[];
    services_detail?: Service[];
    staff_member: string | null;
    staff_member_name?: string;
    visit_date: string;
    total_amount: string;
    payment_status: 'pending' | 'paid' | 'partial';
    notes: string;
}

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
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
    photo?: string;
    is_registered: boolean;
    is_minor: boolean;
    parent_contact?: string;
    parent_id?: string;
}

export interface Sale {
    id: string;
    customer: string;
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
    churned_customers: number;
}

export interface DailyStats {
    date: string;
    customers_served: number;
    revenue: number;
    popular_services: Array<{
        id: string;
        name: string;
        times_booked: number;
        price: number;
    }>;
    staff_performance: Array<{
        id: string;
        name: string;
        customers_served: number;
        revenue_generated: number;
    }>;
}

export interface Reward {
    id: string;
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

const getAuthHeaders = (isFormData: boolean = false) => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    return headers;
};

const apiFetch = async (url: string, options: RequestInit = {}) => {
    const isFormData = options.body instanceof FormData;
    const response = await fetch(url, {
        ...options,
        headers: {
            ...getAuthHeaders(isFormData),
            ...options.headers,
        },
    });

    if (response.status === 401) {
        // Handle unauthorized - clear storage and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('customerData');
        // We can't use useNavigate here as it's not a component
        window.location.href = '/login?expired=true';
        throw new Error('Unauthorized');
    }

    return response;
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

export const registerBusiness = async (data: any) => {
    const response = await fetch(`${API_URL}business-register/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to register business: ${response.status} ${errorText}`);
    }
    return response.json();
};

export const registerCustomer = async (customerData: any) => {
    const response = await fetch(`${API_URL}customer-signup/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to login');
    }
    return response.json();
};

export interface Tenant {
    id: string;
    name: string;
    business_type: string;
    city: string;
    owner_name?: string;
}

export const searchTenants = async (query: string): Promise<Tenant[]> => {
    const response = await fetch(`${API_URL}tenants/search/?search=${encodeURIComponent(query)}`, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error('Failed to search tenants');
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

export const updateService = async (id: string, service: Partial<Service>): Promise<Service> => {
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

export const deleteService = async (id: string) => {
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

export const updateStaff = async (id: string, staff: Partial<StaffMember>): Promise<StaffMember> => {
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

export const deleteStaff = async (id: string) => {
    const response = await fetch(`${API_URL}staff/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete staff member');
    }
};

// Visits API
export const fetchVisits = async (params?: { customer?: string }): Promise<Visit[]> => {
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

export const fetchVisit = async (id: string): Promise<Visit> => {
    const response = await fetch(`${API_URL}visits/${id}/`, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch visit');
    }
    return response.json();
};

export const createVisit = async (visit: { customer: string; service_ids: string[]; staff_member?: string; total_amount: string; payment_status: string; notes?: string }): Promise<Visit> => {
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

export const fetchCustomerPortalDetails = async (id: string) => {
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

export const updateCustomer = async (id: string, customer: Partial<Customer>) => {
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

export const updateCustomerProfile = async (id: string, data: FormData) => {
    const response = await fetch(`${API_URL}customers/${id}/update-profile/`, {
        method: 'PATCH',
        body: data,
    });
    if (!response.ok) {
        throw new Error('Failed to update profile');
    }
    return response.json();
};

export const deleteCustomer = async (id: string) => {
    const response = await fetch(`${API_URL}customers/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete customer');
    }
};

export const fetchCustomerServiceHistory = async (customerId: string) => {
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
    const response = await apiFetch(`${API_URL}dashboard-stats/`);
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
    }
    return response.json();
};

export const fetchDailyStats = async (): Promise<DailyStats> => {
    const response = await apiFetch(`${API_URL}dashboard/daily-stats/`);
    if (!response.ok) {
        throw new Error('Failed to fetch daily stats');
    }
    return response.json();
};

export const addChild = async (name: string): Promise<Customer> => {
    const response = await apiFetch(`${API_URL}customers/add-child/`, {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add child profile');
    }
    return response.json();
};

export const fetchTopCustomers = async (): Promise<any> => {
    const response = await apiFetch(`${API_URL}dashboard/top-customers/`);
    if (!response.ok) {
        throw new Error('Failed to fetch top customers');
    }
    return response.json();
};

export interface AnalyticsData {
    summary: {
        total_revenue: number;
        cogs: number;
        expenses: number;
        commissions: number;
        net_profit: number;
        // Old fields for backward compatibility if needed, or just update UI
        total_annual_sales?: number;
        avg_monthly_sales?: number;
        total_customers_gained?: number;
        total_customers?: number;
        registered_customers?: number;
        walk_in_customers?: number;
        child_customers?: number;
        child_visits_count?: number;
    };
    monthly_sales: {
        month: string;
        sales: number;
        customers: number;
    }[];
    customer_growth?: {
        month: string;
        active: number;
        vip: number;
        inactive: number;
    }[];
    retention_stats?: {
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

export const updateReward = async (id: string, reward: Partial<Reward>) => {
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

export const deleteReward = async (id: string) => {
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
    id: string;
    customer: string;
    customer_name?: string;
    service: string;
    service_name?: string;
    staff_member: string | null;
    staff_member_name?: string;
    booking_date: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes: string;
    booked_by_customer?: string;
    created_at: string;
}

export const fetchBookings = async (params?: { customer?: string; status?: string; search?: string; start_date?: string; end_date?: string }): Promise<Booking[]> => {
    let url = `${API_URL}bookings/`;
    const queryParams = new URLSearchParams();
    if (params?.customer) queryParams.append('customer', params.customer);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || JSON.stringify(errorData) || 'Failed to create booking');
    }
    return response.json();
};

export const updateBooking = async (id: string, booking: Partial<Booking>): Promise<Booking> => {
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
    active_rewards: number;
    eligible_rewards?: Reward[];
    redemptions?: CustomerReward[];
    pending_redemptions: number;
    monthly_usage?: { month: string; redeemed: number; points: number }[];
    most_redeemed?: { name: string; count: number }[];
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
    id: string;
    customer: string;
    customer_name?: string;
    reward: string;
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

export const redeemReward = async (data: { customer: string; reward: string; date_claimed: string }) => {
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

export const initiateStkPush = async (data: { phone_number: string; amount: string; account_reference?: string; transaction_desc?: string }) => {
    const response = await fetch(`${API_URL}mpesa/stk-push/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to initiate STK push: ${errorText}`);
    }
    return response.json();
};

export interface ContactMessage {
    id?: string;
    tenant?: string;
    full_name: string;
    phone: string;
    email: string;
    subject: string;
    message: string;
    is_read?: boolean;
    created_at?: string;
}

export const sendContactMessage = async (message: ContactMessage): Promise<ContactMessage> => {
    const response = await fetch(`${API_URL}contact-messages/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send message: ${errorText}`);
    }
    return response.json();
};

export const fetchContactMessages = async (): Promise<ContactMessage[]> => {
    const response = await fetch(`${API_URL}contact-messages/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch contact messages');
    }
    return response.json();
};

export const deleteContactMessage = async (id: string) => {
    const response = await fetch(`${API_URL}contact-messages/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete contact message');
    }
};

export const markContactMessageAsRead = async (id: string) => {
    const response = await fetch(`${API_URL}contact-messages/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_read: true }),
    });
    if (!response.ok) {
        throw new Error('Failed to mark message as read');
    }
    return response.json();
};

export interface Notification {
    id: string;
    recipient_type: 'customer' | 'admin' | 'staff';
    customer?: string;
    user?: number;
    staff?: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export const fetchNotifications = async (customerId?: string): Promise<Notification[]> => {
    const url = customerId
        ? `${API_URL}notifications/?customer_id=${customerId}`
        : `${API_URL}notifications/`;

    const response = await apiFetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch notifications');
    }
    return response.json();
};

export const fetchTenantSettings = async () => {
    const response = await apiFetch(`${API_URL}tenant/settings/`);
    if (!response.ok) {
        throw new Error('Failed to fetch tenant settings');
    }
    return response.json();
};

export const updateTenantSettings = async (data: any) => {
    const isFormData = data instanceof FormData;
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('token');
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}tenant/settings/`, {
        method: 'PATCH',
        headers: headers,
        body: isFormData ? data : JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to update tenant settings');
    }

    return response.json();
};

// Inventory API
export interface Product {
    id: string;
    tenant: string;
    name: string;
    sku?: string;
    description: string;
    price: string;
    cost_price?: string;
    current_stock: number;
    reorder_level: number;
    is_active: boolean;
    created_at: string;
}

export interface InventoryLog {
    id: string;
    product: string;
    product_name?: string;
    change_quantity: number;
    reason: string;
    notes: string;
    created_at: string;
    created_by_name?: string;
}

export const fetchProducts = async (): Promise<Product[]> => {
    const response = await fetch(`${API_URL}products/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch products');
    }
    return response.json();
};

export const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'tenant'>): Promise<Product> => {
    const response = await fetch(`${API_URL}products/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(product),
    });
    if (!response.ok) {
        throw new Error('Failed to create product');
    }
    return response.json();
};

export const updateProduct = async (id: string, product: Partial<Product>): Promise<Product> => {
    const response = await fetch(`${API_URL}products/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(product),
    });
    if (!response.ok) {
        throw new Error('Failed to update product');
    }
    return response.json();
};

export const deleteProduct = async (id: string) => {
    const response = await fetch(`${API_URL}products/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete product');
    }
};

export const fetchInventoryLogs = async (productId?: string): Promise<InventoryLog[]> => {
    let url = (`${API_URL}inventory-logs/`);
    if (productId) {
        url += `?product=${productId}`;
    }
    const response = await fetch(url, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch inventory logs');
    }
    return response.json();
};

export const createInventoryLog = async (log: Omit<InventoryLog, 'id' | 'created_at' | 'created_by_name'>) => {
    const response = await fetch(`${API_URL}inventory-logs/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(log),
    });
    if (!response.ok) {
        throw new Error('Failed to create inventory log');
    }
    return response.json();
};

// Payroll API
export interface PayrollReport {
    period: {
        start: string;
        end: string;
    };
    payroll: {
        staff_id: string;
        staff_name: string;
        commission_percentage: number;
        total_revenue: number;
        commission_earned: number;
        visit_count: number;
    }[];
}

export interface Expense {
    id: string;
    name: string;
    category: string;
    amount: string;
    description: string;
    expense_date: string;
    created_at: string;
}

export interface GalleryImage {
    id: string;
    tenant: string;
    staff_member?: string;
    staff_member_name?: string;
    service?: string;
    service_name?: string;
    image: string;
    title: string;
    description: string;
    is_public: boolean;
    created_at: string;
}

export const fetchPayroll = async (startDate?: string, endDate?: string): Promise<PayrollReport> => {
    let url = `${API_URL}payroll/`;
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch payroll report');
    }
    return response.json();
};

export const updateStaffCommission = async (id: string, commission: number) => {
    const response = await fetch(`${API_URL}staff/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ commission_percentage: commission }),
    });
    if (!response.ok) {
        throw new Error('Failed to update commission');
    }
    return response.json();
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
    const response = await apiFetch(`${API_URL}notifications/${id}/mark_as_read/`, {
        method: 'POST',
    });
    if (!response.ok) {
        throw new Error('Failed to mark notification as read');
    }
};

export const markAllNotificationsAsRead = async (customerId?: string): Promise<void> => {
    const response = await apiFetch(`${API_URL}notifications/mark_all_as_read/`, {
        method: 'POST',
        body: JSON.stringify({ customer_id: customerId }),
    });
    if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
    }
};

export const fetchUserProfile = async () => {
    const response = await apiFetch(`${API_URL}admin/update-profile/`);
    if (!response.ok) {
        throw new Error('Failed to fetch user profile');
    }
    return response.json();
};

export const updateAdminProfile = async (data: FormData) => {
    const response = await apiFetch(`${API_URL}admin/update-profile/`, {
        method: 'PATCH',
        body: data,
    });
    if (!response.ok) {
        throw new Error('Failed to update admin profile');
    }
    return response.json();
};

// Reviews API
export const fetchReviews = async (params?: { tenant?: number }): Promise<Review[]> => {
    let url = `${API_URL}reviews/`;
    if (params?.tenant) {
        url += `?tenant=${params.tenant}`;
    }
    const response = await fetch(url, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch reviews');
    }
    return response.json();
};

export const createReview = async (review: Partial<Review>): Promise<Review> => {
    const response = await fetch(`${API_URL}reviews/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(review),
    });
    if (!response.ok) {
        throw new Error('Failed to submit review');
    }
    return response.json();
};


export const requestPasswordReset = async (email: string) => {
    const response = await fetch(`${API_URL}password-reset/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        throw new Error('Failed to send reset link');
    }

    return response.json();
};

export const resetPassword = async (token: string, uid: string, password: string) => {
    const response = await fetch(`${API_URL}password-reset/confirm/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, uidb64: uid, password, confirm_password: password }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
    }

    return response.json();
};

export const requestOTP = async (identifier: string) => {
    const response = await fetch(`${API_URL}password-reset/request-otp/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier }),
    });

    if (!response.ok) {
        throw new Error('Failed to send OTP');
    }

    return response.json();
};

export const verifyOTP = async (identifier: string, otp: string) => {
    const response = await fetch(`${API_URL}password-reset/verify-otp/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, otp }),
    });

    if (!response.ok) {
        throw new Error('Invalid OTP');
    }

    return response.json();
};

export const resetPasswordWithOTP = async (identifier: string, otp: string, password: string) => {
    const response = await fetch(`${API_URL}password-reset/reset-with-otp/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, otp, password, confirm_password: password }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
    }

    return response.json();
};

// Expenses API
export const fetchExpenses = async (category?: string): Promise<Expense[]> => {
    let url = `${API_URL}expenses/`;
    if (category) url += `?category=${category}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return response.json();
};

export const createExpense = async (expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> => {
    const response = await fetch(`${API_URL}expenses/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(expense),
    });
    if (!response.ok) throw new Error('Failed to create expense');
    return response.json();
};

export const deleteExpense = async (id: string) => {
    const response = await fetch(`${API_URL}expenses/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete expense');
};

// Gallery API
export const fetchGallery = async (params?: { tenant?: string; staff?: string; service?: string }): Promise<GalleryImage[]> => {
    let url = `${API_URL}gallery/`;
    const searchParams = new URLSearchParams();
    if (params?.tenant) searchParams.append('tenant', params.tenant);
    if (params?.staff) searchParams.append('staff', params.staff);
    if (params?.service) searchParams.append('service', params.service);
    if (searchParams.toString()) url += `?${searchParams.toString()}`;

    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch gallery');
    return response.json();
};

export const uploadGalleryImage = async (formData: FormData): Promise<GalleryImage> => {
    const response = await fetch(`${API_URL}gallery/`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload image');
    return response.json();
};

export const deleteGalleryImage = async (id: string) => {
    const response = await fetch(`${API_URL}gallery/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete image');
};
