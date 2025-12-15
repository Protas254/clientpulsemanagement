import { Reward, CustomerReward, CustomerPoints, RewardRule, RewardsDashboardStats } from '@/types/rewards';

export const rewards: Reward[] = [
  {
    id: '1',
    name: 'Free Haircut',
    description: 'Enjoy a complimentary haircut',
    pointsRequired: 50,
    type: 'free_service',
    value: 'Free Haircut',
    expiryDate: '2025-12-31',
    status: 'active',
    createdAt: '2025-01-01',
    timesRedeemed: 45,
  },
  {
    id: '2',
    name: '10% Off Massage',
    description: 'Get 10% off your next massage session',
    pointsRequired: 100,
    type: 'discount',
    value: '10%',
    expiryDate: '2025-12-31',
    status: 'active',
    createdAt: '2025-01-01',
    timesRedeemed: 32,
  },
  {
    id: '3',
    name: 'KES 500 Spa Credit',
    description: 'Receive KES 500 credit for any spa service',
    pointsRequired: 150,
    type: 'cashback',
    value: 'KES 500',
    expiryDate: '2025-12-31',
    status: 'active',
    createdAt: '2025-01-15',
    timesRedeemed: 18,
  },
  {
    id: '4',
    name: 'Free Manicure',
    description: 'One complimentary manicure service',
    pointsRequired: 200,
    type: 'free_service',
    value: 'Free Manicure',
    expiryDate: '2025-12-31',
    status: 'active',
    createdAt: '2025-02-01',
    timesRedeemed: 12,
  },
  {
    id: '5',
    name: 'VIP Salon Access',
    description: 'Upgrade to VIP status for 3 months',
    pointsRequired: 300,
    type: 'gift',
    value: 'VIP Status',
    expiryDate: '2025-06-30',
    status: 'disabled',
    createdAt: '2025-03-01',
    timesRedeemed: 5,
  },
];

export const customerPoints: CustomerPoints[] = [
  { customerId: '1', totalPoints: 150, lifetimePoints: 450, totalVisits: 12, totalSpent: 45000 },
  { customerId: '2', totalPoints: 85, lifetimePoints: 285, totalVisits: 8, totalSpent: 28500 },
  { customerId: '3', totalPoints: 220, lifetimePoints: 520, totalVisits: 15, totalSpent: 52000 },
  { customerId: '4', totalPoints: 45, lifetimePoints: 145, totalVisits: 5, totalSpent: 14500 },
  { customerId: '5', totalPoints: 310, lifetimePoints: 810, totalVisits: 22, totalSpent: 81000 },
];

export const customerRewards: CustomerReward[] = [
  { id: '1', customerId: '1', rewardId: '1', redeemedAt: '2025-05-15', pointsUsed: 50, status: 'completed' },
  { id: '2', customerId: '1', rewardId: '2', redeemedAt: '2025-06-01', pointsUsed: 100, status: 'completed' },
  { id: '3', customerId: '2', rewardId: '1', redeemedAt: '2025-05-20', pointsUsed: 50, status: 'completed' },
  { id: '4', customerId: '3', rewardId: '3', redeemedAt: '2025-06-02', pointsUsed: 150, status: 'pending' },
  { id: '5', customerId: '5', rewardId: '4', redeemedAt: '2025-05-28', pointsUsed: 200, status: 'completed' },
];

export const rewardRules: RewardRule[] = [
  {
    id: '1',
    name: 'Service Points',
    type: 'purchase',
    pointsAwarded: 1,
    threshold: 100,
    description: 'Earn 1 point for every KES 100 spent on services',
    isActive: true,
  },
  {
    id: '2',
    name: 'Visit Bonus',
    type: 'visit',
    pointsAwarded: 10,
    threshold: 1,
    description: 'Earn 10 points for each visit',
    isActive: true,
  },
  {
    id: '3',
    name: 'Spending Milestone - Bronze',
    type: 'spending_goal',
    pointsAwarded: 50,
    threshold: 5000,
    description: 'Bonus 50 points when you spend KES 5,000',
    isActive: true,
  },
  {
    id: '4',
    name: 'Spending Milestone - Silver',
    type: 'spending_goal',
    pointsAwarded: 120,
    threshold: 10000,
    description: 'Bonus 120 points when you spend KES 10,000',
    isActive: true,
  },
  {
    id: '5',
    name: 'Loyalty Visits',
    type: 'visit',
    pointsAwarded: 100,
    threshold: 10,
    description: 'Bonus 100 points on your 10th visit',
    isActive: true,
  },
];

export const rewardsDashboardStats: RewardsDashboardStats = {
  totalRewardsCreated: 5,
  totalRewardsClaimed: 112,
  activeRewards: 4,
  pendingRedemptions: 3,
};

export const monthlyRewardUsage = [
  { month: 'Jan', redeemed: 12, points: 850 },
  { month: 'Feb', redeemed: 18, points: 1200 },
  { month: 'Mar', redeemed: 15, points: 1050 },
  { month: 'Apr', redeemed: 22, points: 1600 },
  { month: 'May', redeemed: 28, points: 2100 },
  { month: 'Jun', redeemed: 17, points: 1350 },
];

export const mostRedeemedRewards = [
  { name: 'Free Haircut', count: 45 },
  { name: '10% Off Massage', count: 32 },
  { name: 'KES 500 Spa Credit', count: 18 },
  { name: 'Free Manicure', count: 12 },
  { name: 'VIP Salon Access', count: 5 },
];
