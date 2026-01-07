from rest_framework import viewsets, permissions
from rest_framework.response import Response
from django.db.models import Q
from ..models import Booking, Visit, Service, StaffMember, Review, create_notification
from ..serializers import (
    BookingSerializer, VisitSerializer, ServiceSerializer, 
    StaffMemberSerializer, ReviewSerializer
)
from django.utils import timezone

class BookingViewSet(viewsets.ModelViewSet):
    """API endpoint for bookings"""
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'list']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Booking.objects.all().select_related('customer', 'service', 'staff_member')
        
        # Filter by tenant or customer
        if self.request.user.is_authenticated and not self.request.user.is_superuser:
            tenant = None
            if hasattr(self.request.user, 'profile'):
                tenant = self.request.user.profile.tenant
            elif hasattr(self.request.user, 'customer_profile'):
                tenant = self.request.user.customer_profile.tenant
            
            if tenant:
                queryset = queryset.filter(tenant=tenant)
            elif hasattr(self.request.user, 'customer_profile'):
                queryset = queryset.filter(customer=self.request.user.customer_profile)
            else:
                queryset = queryset.none()
        
        # Filter by customer if requested
        customer_id = self.request.query_params.get('customer', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
            
        # Filter by status if requested
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)

        # Search by customer or staff name
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(customer__name__icontains=search_query) |
                Q(staff_member__name__icontains=search_query)
            )
            
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date and end_date:
            queryset = queryset.filter(booking_date__date__range=[start_date, end_date])
            
        return queryset.order_by('-booking_date')

    def perform_create(self, serializer):
        tenant = None
        if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
            tenant = self.request.user.profile.tenant
        elif hasattr(self.request.user, 'customer_profile') and self.request.user.customer_profile.tenant:
            tenant = self.request.user.customer_profile.tenant
            
        serializer.save(tenant=tenant)

class VisitViewSet(viewsets.ModelViewSet):
    """API endpoint for customer visits"""
    queryset = Visit.objects.all()
    serializer_class = VisitSerializer
    def get_permissions(self):
        if self.action == 'retrieve':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Visit.objects.all().select_related('customer', 'staff_member').prefetch_related('services')
        
        # Filter by tenant
        if self.request.user.is_authenticated and not self.request.user.is_superuser:
            tenant = None
            if hasattr(self.request.user, 'profile'):
                tenant = self.request.user.profile.tenant
            elif hasattr(self.request.user, 'customer_profile'):
                tenant = self.request.user.customer_profile.tenant
            
            if tenant:
                queryset = queryset.filter(tenant=tenant)
            elif hasattr(self.request.user, 'customer_profile'):
                 queryset = queryset.filter(customer=self.request.user.customer_profile)
            else:
                queryset = queryset.none()
        
        # Filter by customer if requested
        customer_id = self.request.query_params.get('customer', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        # Filter by date range if requested
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            queryset = queryset.filter(visit_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(visit_date__lte=date_to)
            
        return queryset.order_by('-visit_date')
    
    def perform_create(self, serializer):
        """Create visit and update customer loyalty points"""
        tenant = None
        if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
            tenant = self.request.user.profile.tenant
            
        visit = serializer.save(tenant=tenant)
        customer = visit.customer
        
        # Points are now handled in Visit.save() model method
        
        # Check if customer unlocked any visit-based rewards
        self._check_visit_rewards(customer)
    
    def _check_visit_rewards(self, customer):
        """Check if customer has unlocked any visit-based rewards"""
        # This is a simple implementation - in production you'd want to track 
        # which rewards have already been unlocked
        pass

class ServiceViewSet(viewsets.ModelViewSet):
    """API endpoint for services (haircut, massage, etc.)"""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Service.objects.all()
        
        # Filter by tenant
        if self.request.user.is_authenticated and not self.request.user.is_superuser:
            tenant = None
            if hasattr(self.request.user, 'profile'):
                tenant = self.request.user.profile.tenant
            elif hasattr(self.request.user, 'customer_profile'):
                tenant = self.request.user.customer_profile.tenant
            
            if tenant:
                queryset = queryset.filter(tenant=tenant)
            else:
                queryset = queryset.none()
        
        # Filter by active status if requested
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        # Filter by category if requested
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        return queryset.order_by('category', 'name')
        
    def perform_create(self, serializer):
        if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
            serializer.save(tenant=self.request.user.profile.tenant)
        else:
            serializer.save()

class StaffMemberViewSet(viewsets.ModelViewSet):
    """API endpoint for staff members (barbers, stylists, therapists)"""
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = StaffMember.objects.all()
        
        # Filter by tenant
        if self.request.user.is_authenticated and not self.request.user.is_superuser:
            tenant = None
            if hasattr(self.request.user, 'profile'):
                tenant = self.request.user.profile.tenant
            elif hasattr(self.request.user, 'customer_profile'):
                tenant = self.request.user.customer_profile.tenant
            
            if tenant:
                queryset = queryset.filter(tenant=tenant)
            else:
                queryset = queryset.none()
                
        # Filter by active status if requested
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset.order_by('name')

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
            serializer.save(tenant=self.request.user.profile.tenant)
        else:
            serializer.save()
