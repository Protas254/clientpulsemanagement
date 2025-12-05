export type RewardType = 'discount' | 'gift' | 'cashback' | 'free_service';
export type RewardStatus = 'active' | 'disabled' | 'expired';
export type RedemptionStatus = 'completed' | 'pending' | 'cancelled';

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  type: RewardType;
  value: string; // e.g., "10%", "KES 500", "Free Coffee"
  expiryDate: string;
  status: RewardStatus;
  createdAt: string;
  timesRedeemed: number;
}

export interface CustomerReward {
  id: string;
  customerId: string;
  rewardId: string;
  redeemedAt: string;
  pointsUsed: number;
  status: RedemptionStatus;
}

export interface CustomerPoints {
  customerId: string;
  totalPoints: number;
  lifetimePoints: number;
  totalVisits: number;
  totalSpent: number;
}

export interface RewardRule {
  id: string;
  name: string;
  type: 'purchase' | 'visit' | 'spending_goal';
  pointsAwarded: number;
  threshold?: number; // e.g., KES 100 for purchase, 5 for visits, KES 5000 for spending goal
  description: string;
  isActive: boolean;
}

export interface RewardsDashboardStats {
  totalRewardsCreated: number;
  totalRewardsClaimed: number;
  activeRewards: number;
  pendingRedemptions: number;
}
