from rest_framework import generics, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from ..models import Reward, CustomerReward, Customer, Visit, Sale
from ..utils import format_datetime_safely
from ..serializers import RewardSerializer, CustomerRewardSerializer, TenantSerializer, VisitSerializer, SaleSerializer

class RewardListCreate(generics.ListCreateAPIView):
    queryset = Reward.objects.all()
    serializer_class = RewardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Reward.objects.all()
        if not self.request.user.is_superuser:
            if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
                queryset = queryset.filter(tenant=self.request.user.profile.tenant)
            else:
                queryset = queryset.none()
        return queryset
        
    def perform_create(self, serializer):
        if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
            serializer.save(tenant=self.request.user.profile.tenant)
        else:
            serializer.save()

class RewardDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reward.objects.all()
    serializer_class = RewardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Reward.objects.all()
        if not self.request.user.is_superuser:
            if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
                queryset = queryset.filter(tenant=self.request.user.profile.tenant)
            else:
                queryset = queryset.none()
        return queryset

class CustomerRewardCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = request.data.get('identifier')
        if not identifier:
            return Response({'error': 'Identifier (phone, email or name) is required'}, status=400)

        # Try to find customer by phone, email or name
        customer = Customer.objects.filter(
            Q(email__iexact=identifier) | 
            Q(name__iexact=identifier) |
            Q(phone__icontains=identifier)
        ).first()
        
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)

        # Get all active rewards (frontend will handle locking logic)
        all_rewards = Reward.objects.filter(status='active')
        rewards_data = RewardSerializer(all_rewards, many=True).data

        # Calculate statistics
        total_spent = Visit.objects.filter(customer=customer).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_purchases = Sale.objects.filter(customer=customer).count()

        # Get history (sliced for return)
        visits = Visit.objects.filter(customer=customer).order_by('-visit_date')[:10]
        visits_data = VisitSerializer(visits, many=True).data

        purchases = Sale.objects.filter(customer=customer).order_by('-date')[:10]
        purchases_data = SaleSerializer(purchases, many=True).data

        # Get redemption history
        redemptions = CustomerReward.objects.filter(customer=customer).order_by('-date_claimed')[:10]
        redemptions_data = CustomerRewardSerializer(redemptions, many=True).data

        # Get referrals
        referrals = Customer.objects.filter(referred_by=customer).order_by('-created_at')
        referrals_data = [
            {
                'id': str(ref.id),
                'name': ref.name,
                'date': ref.created_at.isoformat(),
                'points_earned': 50
            } for ref in referrals
        ]

        return Response({
            'tenant': TenantSerializer(customer.tenant).data if customer.tenant else None,
            'customer': {
                'id': customer.id,
                'name': customer.name,
                'email': customer.email,
                'phone': customer.phone,
                'location': customer.location,
                'status': customer.status,
                'notes': customer.notes,
                'points': customer.points,
                'visit_count': customer.visit_count,
                'last_purchase': customer.last_purchase,
                'created_at': customer.created_at,
                'tenant_id': customer.tenant.id if customer.tenant else None,
                'referral_code': customer.referral_code,
            },
            'statistics': {
                'total_spent': float(total_spent),
                'total_visits': customer.visit_count,
                'total_purchases': total_purchases,
            },
            'visits': visits_data,
            'purchases': purchases_data,
            'eligible_rewards': rewards_data,
            'redemptions': redemptions_data,
            'referrals': referrals_data
        })

class CustomerRewardViewSet(viewsets.ModelViewSet):
    """API endpoint for customer rewards"""
    queryset = CustomerReward.objects.all()
    serializer_class = CustomerRewardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = CustomerReward.objects.all().select_related('customer', 'reward')
        
        # Filter by tenant
        if self.request.user.is_authenticated and not self.request.user.is_superuser:
            if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
                queryset = queryset.filter(tenant=self.request.user.profile.tenant)
            elif hasattr(self.request.user, 'customer_profile'):
                 queryset = queryset.filter(customer=self.request.user.customer_profile)
        
        # Filter by customer if requested
        customer_id = self.request.query_params.get('customer', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
            
        return queryset.order_by('-date_claimed')

    def perform_create(self, serializer):
        customer_reward = serializer.save(status='redeemed', date_redeemed=timezone.now())
        customer = customer_reward.customer
        reward = customer_reward.reward
        
        # Deduct points if applicable
        if reward.points_required > 0:
            if customer.points >= reward.points_required:
                customer.points -= reward.points_required
                customer.save()
            else:
                # This should ideally be checked before save, but serializer validation can handle it
                pass

class RewardsStatsView(APIView):
    """Statistics for Rewards Dashboard"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        tenant = None
        if request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.tenant:
            tenant = request.user.profile.tenant
            
        rewards_qs = Reward.objects.all()
        customer_rewards_qs = CustomerReward.objects.all()
        
        if tenant:
            rewards_qs = rewards_qs.filter(tenant=tenant)
            customer_rewards_qs = customer_rewards_qs.filter(tenant=tenant)
            
        total_rewards_created = rewards_qs.count()
        
        # Total rewards claimed (CustomerReward entries)
        total_rewards_claimed = customer_rewards_qs.count()
        
        # Active rewards (Reward objects that are active)
        active_rewards = rewards_qs.filter(status='active').count()
        
        # Pending redemptions (CustomerReward with status 'pending')
        pending_redemptions = customer_rewards_qs.filter(status='pending').count()

        # Monthly Usage (Last 6 months)
        six_months_ago = timezone.now() - timezone.timedelta(days=180)
        monthly_usage_qs = customer_rewards_qs.filter(date_claimed__gte=six_months_ago)\
            .annotate(month=TruncMonth('date_claimed'))\
            .values('month')\
            .annotate(redeemed=Count('id'))\
            .order_by('month')
            
        monthly_usage = []
        for entry in monthly_usage_qs:
            monthly_usage.append({
                'month': format_datetime_safely(entry['month'], '%b'),
                'redeemed': entry['redeemed'],
                'points': 0 # Placeholder, would need aggregation on related Reward.points_required
            })

        # Most Redeemed
        most_redeemed_qs = customer_rewards_qs.values('reward__name')\
            .annotate(count=Count('id'))\
            .order_by('-count')[:5]
            
        most_redeemed = []
        for entry in most_redeemed_qs:
            most_redeemed.append({
                'name': entry['reward__name'],
                'count': entry['count']
            })
        
        return Response({
            'total_rewards_created': total_rewards_created,
            'total_rewards_claimed': total_rewards_claimed,
            'active_rewards': active_rewards,
            'pending_redemptions': pending_redemptions,
            'monthly_usage': monthly_usage,
            'most_redeemed': most_redeemed
        })
