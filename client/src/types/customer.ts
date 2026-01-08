export type CustomerStatus = 'active' | 'inactive' | 'vip';

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
  is_registered: boolean;
  is_minor: boolean;
  parent_contact?: string;
  parent_id?: string;
  // Legacy fields (optional)
  firstVisit?: string;
  totalPurchases?: number;
  totalSpent?: number;
  avatar?: string;
  photo?: string;
}

export interface PurchaseHistory {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  description: string;
}

export interface FollowUp {
  id: string;
  customerId: string;
  date: string;
  note: string;
  completed: boolean;
}

export interface DashboardStats {
  totalCustomers: number;
  newCustomersToday: number;
  totalSales: number;
  pendingFollowUps: number;
}
