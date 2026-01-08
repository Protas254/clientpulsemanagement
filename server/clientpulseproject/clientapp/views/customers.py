from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from ..models import Customer, Reward, Visit, Sale, CustomerReward, Booking
from ..serializers import (
    CustomerSerializer, RewardSerializer, VisitSerializer, 
    SaleSerializer, CustomerRewardSerializer, TenantSerializer
)

class CustomerListCreate(generics.ListCreateAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Customer.objects.all()
        
        # Filter by tenant
        if self.request.user.is_authenticated and not self.request.user.is_superuser:
            tenant = None
            if hasattr(self.request.user, 'profile'):
                tenant = self.request.user.profile.tenant
            
            if tenant:
                queryset = queryset.filter(tenant=tenant)
            else:
                queryset = queryset.none()
        
        # Search by phone, name, or email
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(phone__icontains=search) | 
                Q(name__icontains=search) |
                Q(email__icontains=search)
            )
            
        return queryset

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
            serializer.save(tenant=self.request.user.profile.tenant)
        else:
            serializer.save()

class CustomerDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Customer.objects.all()
        if not self.request.user.is_superuser:
            if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
                queryset = queryset.filter(tenant=self.request.user.profile.tenant)
            else:
                queryset = queryset.none()
        return queryset

class CustomerServiceHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            customer = Customer.objects.get(pk=pk)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=404)
            
        # Check permissions
        if not request.user.is_superuser:
             if hasattr(request.user, 'profile') and request.user.profile.tenant:
                 if customer.tenant != request.user.profile.tenant:
                     return Response({'error': 'Permission denied'}, status=403)
        
        visits = Visit.objects.filter(customer=customer).order_by('-visit_date')
        serializer = VisitSerializer(visits, many=True)
        return Response(serializer.data)

class CustomerPortalDetailsView(APIView):
    """
    Admin view to see customer details exactly as they appear in the portal.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            customer = Customer.objects.get(pk=pk)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=404)

        # Check permissions
        if not request.user.is_superuser:
             if hasattr(request.user, 'profile') and request.user.profile.tenant:
                 if customer.tenant != request.user.profile.tenant:
                     return Response({'error': 'Permission denied'}, status=403)

        # Get all active rewards for this tenant
        all_rewards = Reward.objects.filter(tenant=customer.tenant, status='active')
        rewards_data = RewardSerializer(all_rewards, many=True).data

        # Get customer's visit history
        visits = Visit.objects.filter(customer=customer).order_by('-visit_date')
        visits_data = VisitSerializer(visits, many=True).data

        # Get purchase history (backward compatibility)
        purchases = Sale.objects.filter(customer=customer).order_by('-date')
        purchases_data = SaleSerializer(purchases, many=True).data

        # Calculate statistics
        total_spent = visits.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_purchases = purchases.count()

        # Get redemption history
        redemptions = CustomerReward.objects.filter(customer=customer).order_by('-date_claimed')
        redemptions_data = CustomerRewardSerializer(redemptions, many=True).data

        # Get children (for parent-on-behalf booking)
        children = Customer.objects.filter(parent=customer)
        children_data = CustomerSerializer(children, many=True).data
        
        # Serialize objects
        customer_data = CustomerSerializer(customer).data
        tenant_data = TenantSerializer(customer.tenant).data if customer.tenant else None

        return Response({
            'customer': customer_data,
            'tenant': tenant_data,
            'statistics': {
                'total_spent': float(total_spent),
                'total_visits': customer.visit_count,
                'total_purchases': total_purchases,
            },
            'visits': visits_data,
            'purchases': purchases_data,
            'eligible_rewards': rewards_data,
            'redemptions': redemptions_data,
            'children': children_data
        })

class TopCustomersView(APIView):
    """Get top customers by visits and spending"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        tenant = None
        if request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.tenant:
            tenant = request.user.profile.tenant
            
        customers_qs = Customer.objects.all()
        if tenant:
            customers_qs = customers_qs.filter(tenant=tenant)
            
        # Top by visit count
        top_by_visits = customers_qs.filter(
            visit_count__gt=0
        ).order_by('-visit_count')[:10]
        
        # Top by spending
        top_by_spending = customers_qs.annotate(
            total_spent=Sum('visits__total_amount')
        ).filter(total_spent__isnull=False).order_by('-total_spent')[:10]
        
        return Response({
            'top_by_visits': [
                {
                    'id': c.id,
                    'name': c.name,
                    'phone': c.phone,
                    'visit_count': c.visit_count,
                    'points': c.points
                } for c in top_by_visits
            ],
            'top_by_spending': [
                {
                    'id': c.id,
                    'name': c.name,
                    'phone': c.phone,
                    'total_spent': float(c.total_spent or 0),
                    'visit_count': c.visit_count
                } for c in top_by_spending
            ]
        })

class AddChildView(APIView):
    """View for customers to create child profiles linked to their account"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Only customers can add children to themselves
        parent_customer = None
        if hasattr(request.user, 'customer_profile'):
            parent_customer = request.user.customer_profile
        
        if not parent_customer:
            return Response({'error': 'Only customers can add child profiles'}, status=403)
            
        name = request.data.get('name')
        if not name:
             return Response({'error': 'Name is required'}, status=400)
             
        # Create child profile
        child = Customer.objects.create(
            name=name,
            parent=parent_customer,
            tenant=parent_customer.tenant,
            is_minor=True,
            is_registered=False,
            status='ACTIVE'
        )
        
        serializer = CustomerSerializer(child)
        return Response(serializer.data, status=201)
