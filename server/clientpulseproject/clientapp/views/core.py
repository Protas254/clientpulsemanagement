from rest_framework import generics, permissions, viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from ..models import (
    User, Visit, Customer, Booking, Service, StaffMember, ContactMessage, 
    Tenant, SubscriptionPlan, TenantSubscription, Notification, Review, Product, InventoryLog
)
from ..serializers import (
    UserSerializer, VisitSerializer, TenantSerializer, SubscriptionPlanSerializer, 
    TenantSubscriptionSerializer, ContactMessageSerializer, NotificationSerializer,
    ReviewSerializer, ProductSerializer, InventoryLogSerializer
)

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class DailyStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        today = timezone.now().date()
        tenant = None
        if request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.tenant:
            tenant = request.user.profile.tenant
            
        visits_qs = Visit.objects.filter(visit_date__date=today)
        if tenant:
            visits_qs = visits_qs.filter(tenant=tenant)
            
        total_revenue = visits_qs.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_visits = visits_qs.count()
        
        return Response({
            'date': today,
            'revenue': total_revenue,
            'visits': total_visits
        })

class DashboardStatsView(APIView):
    """General dashboard statistics"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        current_month = now.month
        current_year = now.year
        
        if current_month == 1:
            last_month = 12
            last_month_year = current_year - 1
        else:
            last_month = current_month - 1
            last_month_year = current_year
        
        tenant = None
        if request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.tenant:
            tenant = request.user.profile.tenant
            
        visits_qs = Visit.objects.all()
        customers_qs = Customer.objects.all()
        
        if tenant:
            visits_qs = visits_qs.filter(tenant=tenant)
            customers_qs = customers_qs.filter(tenant=tenant)
        
        # Use Visit model instead of Sale for more accurate tracking
        current_month_revenue = visits_qs.filter(
            visit_date__month=current_month,
            visit_date__year=current_year
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        last_month_revenue = visits_qs.filter(
            visit_date__month=last_month,
            visit_date__year=last_month_year
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        sales_growth = 0
        if last_month_revenue > 0:
            sales_growth = ((current_month_revenue - last_month_revenue) / last_month_revenue) * 100
            
        total_visits = visits_qs.count()
        avg_visit_amount = visits_qs.aggregate(Avg('total_amount'))['total_amount__avg'] or 0
        
        total_customers = customers_qs.count()
        active_customers = customers_qs.filter(
            visits__visit_date__gte=now - timedelta(days=30)
        ).distinct().count()

        # Churn calculation: Visited last month but not this month
        last_month_customers = visits_qs.filter(
            visit_date__month=last_month,
            visit_date__year=last_month_year
        ).values_list('customer', flat=True).distinct()
        
        this_month_customers = visits_qs.filter(
            visit_date__month=current_month,
            visit_date__year=current_year
        ).values_list('customer', flat=True).distinct()
        
        churned_customers_count = len(set(last_month_customers) - set(this_month_customers))
        
        return Response({
            'current_month_sales': float(current_month_revenue),
            'last_month_sales': float(last_month_revenue),
            'sales_growth': round(sales_growth, 1),
            'total_transactions': total_visits,
            'avg_order': round(float(avg_visit_amount), 2),
            'total_customers': total_customers,
            'active_customers': active_customers,
            'churned_customers': churned_customers_count,
        })

class AnalyticsView(APIView):
    """
    Analytics for Reports page:
    - Monthly sales (last 12 months)
    - Customer growth
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        last_12_months = today - timedelta(days=365)
        
        tenant = None
        if request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.tenant:
            tenant = request.user.profile.tenant

        visits_qs = Visit.objects.all()
        if tenant:
            visits_qs = visits_qs.filter(tenant=tenant)

        # 1. Monthly Sales & Customer Acquisition (Last 12 Months)
        # We'll aggregate visits by month
        monthly_stats = visits_qs.filter(
            visit_date__date__gte=last_12_months
        ).annotate(
            month=TruncMonth('visit_date')
        ).values('month').annotate(
            sales=Sum('total_amount'),
            customers=Count('customer', distinct=True)
        ).order_by('month')

        # Format for frontend
        formatted_monthly_data = []
        # Create a map for easy lookup
        stats_map = {item['month'].strftime('%b'): item for item in monthly_stats}
        
        # Generate last 12 months list to ensure all months are present even if 0 sales
        for i in range(11, -1, -1):
            date_cursor = today - timedelta(days=i*30) # Approx
            month_name = date_cursor.strftime('%b')
            
            data = stats_map.get(month_name, {'sales': 0, 'customers': 0})
            formatted_monthly_data.append({
                'month': month_name,
                'sales': float(data['sales'] or 0),
                'customers': data['customers']
            })

        return Response({
            'monthly_sales': formatted_monthly_data
        })

class TenantSearchView(generics.ListAPIView):
    """
    Public endpoint to search for tenants (businesses)
    Used by customers to find their business
    """
    queryset = Tenant.objects.filter(is_active=True)
    serializer_class = TenantSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Tenant.objects.filter(is_active=True)
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset[:10] # Limit to 10 results

class NotificationViewSet(viewsets.ModelViewSet):
    """API endpoint for notifications"""
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Notification.objects.all()
        
        if user.is_superuser:
            return queryset
            
        # Filter by user type
        if hasattr(user, 'profile'):
            if user.profile.role == 'tenant_admin':
                # Show notifications for this tenant admin
                queryset = queryset.filter(
                    recipient_type='admin',
                    tenant=user.profile.tenant
                )
            elif user.profile.role == 'staff':
                # Show notifications for this staff member
                # Assuming staff member is linked to user
                try:
                    staff = StaffMember.objects.get(user=user)
                    queryset = queryset.filter(
                        recipient_type='staff',
                        staff=staff
                    )
                except StaffMember.DoesNotExist:
                    queryset = queryset.none()
            elif user.profile.role == 'customer':
                 # This case might be handled by customer_profile check below, 
                 # but if they have a user profile with role customer:
                 try:
                     customer = Customer.objects.get(user=user)
                     queryset = queryset.filter(
                         recipient_type='customer',
                         customer=customer
                     )
                 except Customer.DoesNotExist:
                     queryset = queryset.none()
        elif hasattr(user, 'customer_profile'):
             queryset = queryset.filter(
                 recipient_type='customer',
                 customer=user.customer_profile
             )
        else:
            queryset = queryset.none()
            
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        # Get the queryset that would be returned by get_queryset
        qs = self.get_queryset()
        qs.filter(is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

class TenantSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Fetch tenant settings for the authenticated user's tenant"""
        if not hasattr(request.user, 'profile') or not request.user.profile.tenant:
            return Response({'error': 'No tenant associated with user'}, status=status.HTTP_400_BAD_REQUEST)
            
        tenant = request.user.profile.tenant
        serializer = TenantSerializer(tenant)
        return Response(serializer.data)
    
    def patch(self, request):
        """Update tenant settings for the authenticated user's tenant"""
        if not hasattr(request.user, 'profile') or not request.user.profile.tenant:
            return Response({'error': 'No tenant associated with user'}, status=status.HTTP_400_BAD_REQUEST)
            
        tenant = request.user.profile.tenant
        serializer = TenantSerializer(tenant, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TenantViewSet(viewsets.ModelViewSet):
    """API endpoint for managing tenants (Super Admin only)"""
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Tenant.objects.all()
        # Only superusers can see all tenants
        if not self.request.user.is_superuser:
            # Regular users can only see their own tenant
            if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
                queryset = queryset.filter(id=self.request.user.profile.tenant.id)
            else:
                queryset = queryset.none()
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get statistics for a specific tenant"""
        tenant = self.get_object()
        
        # Count related objects
        total_customers = Customer.objects.filter(tenant=tenant).count()
        total_bookings = Booking.objects.filter(tenant=tenant).count()
        total_services = Service.objects.filter(tenant=tenant).count()
        total_staff = StaffMember.objects.filter(tenant=tenant).count()
        pending_messages = ContactMessage.objects.filter(tenant=tenant).count()
        
        return Response({
            'total_customers': total_customers,
            'total_bookings': total_bookings,
            'total_services': total_services,
            'total_staff': total_staff,
            'pending_messages': pending_messages,
        })

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """API endpoint for managing subscription plans"""
    queryset = SubscriptionPlan.objects.all().order_by('price')
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

class TenantSubscriptionViewSet(viewsets.ModelViewSet):
    """API endpoint for managing tenant subscriptions"""
    queryset = TenantSubscription.objects.all()
    serializer_class = TenantSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = TenantSubscription.objects.all()
        # Superusers see all, tenants see only their own
        if not self.request.user.is_superuser:
            if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
                queryset = queryset.filter(tenant=self.request.user.profile.tenant)
            else:
                queryset = queryset.none()
        return queryset

class ContactMessageViewSet(viewsets.ModelViewSet):
    """API endpoint for contact messages"""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = ContactMessage.objects.all()
        
        # Filter by tenant if not superuser
        if not self.request.user.is_superuser:
            if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
                queryset = queryset.filter(tenant=self.request.user.profile.tenant)
            else:
                queryset = queryset.none()
        else:
            
            tenant_id = self.request.query_params.get('tenant', None)
            if tenant_id:
                queryset = queryset.filter(tenant_id=tenant_id)
            else:
                queryset = queryset.filter(tenant__isnull=True)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        # Automatically assign tenant if user has one
        tenant = None
        if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
            tenant = self.request.user.profile.tenant
        
        # If no tenant from user profile, check if provided in request data
        if not tenant:
            tenant_id = self.request.data.get('tenant')
            if tenant_id:
                try:
                    tenant = Tenant.objects.get(id=tenant_id)
                except Tenant.DoesNotExist:
                    pass
        
        serializer.save(tenant=tenant)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        message = self.get_object()
        message.is_read = True
        message.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def delete_messages(self, request):
        ids = request.data.get('ids', [])
        if not ids:
             return Response({'error': 'No IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.get_queryset()
        queryset.filter(id__in=ids).delete()
        return Response({'status': 'messages deleted'})

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Review.objects.all()
        tenant_id = self.request.query_params.get('tenant', None)
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id, is_public=True)
        
        # If authenticated and not superuser, show all for their tenant
        if self.request.user.is_authenticated and not self.request.user.is_superuser:
            if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
                queryset = Review.objects.filter(tenant=self.request.user.profile.tenant)
        
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        visit_id = self.request.data.get('visit')
        reviewer_type = self.request.data.get('reviewer_type', 'customer')
        
        # If authenticated and not a customer profile, it's likely a business owner
        if self.request.user.is_authenticated and not hasattr(self.request.user, 'customer_profile'):
            reviewer_type = 'business_owner'

        if visit_id:
            try:
                visit = Visit.objects.get(id=visit_id)
                serializer.save(
                    tenant=visit.tenant,
                    customer=visit.customer,
                    visit=visit,
                    reviewer_type=reviewer_type,
                    user=self.request.user if reviewer_type == 'business_owner' else None
                )
            except Visit.DoesNotExist:
                serializer.save(
                    reviewer_type=reviewer_type,
                    user=self.request.user if reviewer_type == 'business_owner' else None
                )
        else:
            tenant = None
            if self.request.user.is_authenticated and hasattr(self.request.user, 'profile'):
                tenant = self.request.user.profile.tenant
            
            serializer.save(
                tenant=tenant,
                reviewer_type=reviewer_type,
                user=self.request.user if reviewer_type == 'business_owner' else None
            )

class ProductViewSet(viewsets.ModelViewSet):
    """API endpoint for inventory products"""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Product.objects.all()
        # Filter by tenant
        if not self.request.user.is_superuser:
            if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
                queryset = queryset.filter(tenant=self.request.user.profile.tenant)
            else:
                queryset = queryset.none()
        return queryset.order_by('name')

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
            serializer.save(tenant=self.request.user.profile.tenant)
        else:
            serializer.save()

class InventoryLogViewSet(viewsets.ModelViewSet):
    """API endpoint for inventory logs"""
    queryset = InventoryLog.objects.all()
    serializer_class = InventoryLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = InventoryLog.objects.all()
        # Filter by tenant
        if not self.request.user.is_superuser:
            if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
                queryset = queryset.filter(tenant=self.request.user.profile.tenant)
            else:
                queryset = queryset.none()
        
        # Filter by product if requested
        product_id = self.request.query_params.get('product', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
            
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        tenant = None
        if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
            tenant = self.request.user.profile.tenant
        
        # Also update the product stock
        # Ideally this should be in serializer.save() or signal, but performing here is explicit for API calls (e.g. manual restock)
        # Note: If this is called, we assume the Change Quantity is valid.
        
        log = serializer.save(tenant=tenant, created_by=self.request.user)
        
        product = log.product
        product.current_stock += log.change_quantity
        product.save()


class PayrollView(APIView):
    """
    Calculate staff payroll based on commission
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'profile') or not request.user.profile.tenant:
             return Response({'error': 'No tenant associated'}, status=status.HTTP_400_BAD_REQUEST)
        
        tenant = request.user.profile.tenant
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            # Default to current month
            today = timezone.now().date()
            start_date = today.replace(day=1)
            end_date = today # Till now
        
        staff_members = StaffMember.objects.filter(tenant=tenant)
        payroll_data = []
        
        for staff in staff_members:
            # Get completed visits for this staff
            visits = Visit.objects.filter(
                staff_member=staff,
                tenant=tenant,
                visit_date__date__range=[start_date, end_date],
                payment_status='paid' # Only calculate for paid visits? Or all completed?
            )
            
            total_revenue = visits.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            commission_amount = (total_revenue * staff.commission_percentage) / 100
            
            payroll_data.append({
                'staff_id': staff.id,
                'staff_name': staff.name,
                'commission_percentage': float(staff.commission_percentage),
                'total_revenue': float(total_revenue),
                'commission_earned': float(commission_amount),
                'visit_count': visits.count()
            })
            
        return Response({
            'period': {'start': start_date, 'end': end_date},
            'payroll': payroll_data
        })
