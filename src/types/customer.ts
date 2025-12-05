export type CustomerStatus = 'active' | 'inactive' | 'vip';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: CustomerStatus;
  firstVisit: string;
  lastPurchase: string;
  totalPurchases: number;
  totalSpent: number;
  notes: string;
  avatar?: string;
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
