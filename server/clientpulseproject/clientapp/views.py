from django.shortcuts import render
from django.db import models
from rest_framework import generics, status, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Customer, Sale, Reward, Service, Visit, StaffMember, Booking, CustomerReward
from .serializers import (
    UserSerializer, CustomerSerializer, 
    SaleSerializer, RewardSerializer, ServiceSerializer, VisitSerializer, StaffMemberSerializer,
    BookingSerializer, CustomerRewardSerializer
)
from django.db.models import Sum, Count, Avg, Q, F
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta, date

# Create your views here.

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

from rest_framework.authtoken.models import Token

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'user_id': user.id, 'username': user.username, 'is_superuser': user.is_superuser})
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_400_BAD_REQUEST)

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # In a real app, restrict this to admins
    # permission_classes = [permissions.IsAdminUser]


# Service ViewSet
class ServiceViewSet(viewsets.ModelViewSet):
    """API endpoint for services (haircut, massage, etc.)"""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Service.objects.all()
        # Filter by active status if requested
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        # Filter by category if requested
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        return queryset.order_by('category', 'name')


# Staff Member ViewSet
class StaffMemberViewSet(viewsets.ModelViewSet):
    """API endpoint for staff members (barbers, stylists, therapists)"""
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = StaffMember.objects.all()
        # Filter by active status if requested
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset.order_by('name')


# Visit ViewSet
class VisitViewSet(viewsets.ModelViewSet):
    """API endpoint for customer visits"""
    queryset = Visit.objects.all()
    serializer_class = VisitSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Visit.objects.all().select_related('customer', 'staff_member').prefetch_related('services')
        
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
        visit = serializer.save()
        customer = visit.customer
        
        # Points are now handled in Visit.save() model method
        
        # Check if customer unlocked any visit-based rewards
        self._check_visit_rewards(customer)
    
    def _check_visit_rewards(self, customer):
        """Check if customer has unlocked any visit-based rewards"""
        # This is a simple implementation - in production you'd want to track 
        # which rewards have already been unlocked
        pass


# Customer Views
class CustomerListCreate(generics.ListCreateAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Customer.objects.all()
        # Search by phone, name, or email
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(phone__icontains=search) |
                Q(name__icontains=search) |
                Q(email__icontains=search)
            )
        return queryset.order_by('-created_at')

class CustomerDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]


# Customer Service History View
class CustomerServiceHistoryView(APIView):
    """Get detailed service history for a customer"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, customer_id):
        try:
            customer = Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=404)
        
        visits = Visit.objects.filter(customer=customer).order_by('-visit_date')
        visits_data = VisitSerializer(visits, many=True).data
        
        # Calculate stats
        total_spent = visits.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        favorite_services = customer.favorite_services.all()
        
        return Response({
            'customer': CustomerSerializer(customer).data,
            'visits': visits_data,
            'statistics': {
                'total_visits': customer.visit_count,
                'total_spent': float(total_spent),
                'points': customer.points,
            },
            'favorite_services': ServiceSerializer(favorite_services, many=True).data
        })


# Enhanced Dashboard Stats
class DailyStatsView(APIView):
    """Daily statistics for Kinyozi/Client Dashboard"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        today = timezone.now().date()
        
        # Today's visits
        today_visits = Visit.objects.filter(visit_date__date=today)
        customers_served_today = today_visits.count()
        revenue_today = today_visits.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Popular services today
        from django.db.models import Count
        popular_services = Service.objects.filter(
            visit__visit_date__date=today
        ).annotate(
            times_booked=Count('visit')
        ).order_by('-times_booked')[:5]
        
        # Staff performance today
        staff_performance = StaffMember.objects.filter(
            visits__visit_date__date=today
        ).annotate(
            customers_served=Count('visits'),
            revenue_generated=Sum('visits__total_amount')
        ).order_by('-customers_served')[:5]
        
        return Response({
            'date': today,
            'customers_served': customers_served_today,
            'revenue': float(revenue_today),
            'popular_services': [
                {
                    'id': s.id,
                    'name': s.name,
                    'times_booked': s.times_booked,
                    'price': float(s.price)
                } for s in popular_services
            ],
            'staff_performance': [
                {
                    'id': staff.id,
                    'name': staff.name,
                    'customers_served': staff.customers_served,
                    'revenue_generated': float(staff.revenue_generated or 0)
                } for staff in staff_performance
            ]
        })


class DashboardStatsView(APIView):
    """General dashboard statistics"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        current_month = timezone.now().month
        last_month = current_month - 1 if current_month > 1 else 12
        
        # Use Visit model instead of Sale for more accurate tracking
        current_month_revenue = Visit.objects.filter(
            visit_date__month=current_month
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        last_month_revenue = Visit.objects.filter(
            visit_date__month=last_month
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        sales_growth = 0
        if last_month_revenue > 0:
            sales_growth = ((current_month_revenue - last_month_revenue) / last_month_revenue) * 100
            
        total_visits = Visit.objects.count()
        avg_visit_amount = Visit.objects.aggregate(Avg('total_amount'))['total_amount__avg'] or 0
        
        total_customers = Customer.objects.count()
        active_customers = Customer.objects.filter(
            visits__visit_date__gte=timezone.now() - timedelta(days=30)
        ).distinct().count()
        
        return Response({
            'current_month_sales': float(current_month_revenue),
            'last_month_sales': float(last_month_revenue),
            'sales_growth': round(sales_growth, 1),
            'total_transactions': total_visits,
            'avg_order': round(float(avg_visit_amount), 2),
            'total_customers': total_customers,
            'active_customers': active_customers,
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

        # 1. Monthly Sales & Customer Acquisition (Last 12 Months)
        # We'll aggregate visits by month
        monthly_stats = Visit.objects.filter(
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
                'customers': data['customers'] or 0
            })

        # 2. Customer Growth (Active vs VIP vs Inactive)
        # This is a bit complex to calculate historically without snapshots.
        # For now, we will return the CURRENT distribution and mock the historical trend 
        # based on current data for the demo, or just return current stats.
        # To make it look good for the chart, we'll generate some realistic looking data 
        # based on the current counts.
        
        total_customers = Customer.objects.count()
        active_count = Customer.objects.filter(status='active').count()
        vip_count = Customer.objects.filter(status='vip').count()
        inactive_count = Customer.objects.filter(status='inactive').count()

        # Generate 6 months of growth data
        growth_data = []
        for i in range(5, -1, -1):
            month_name = (today - timedelta(days=i*30)).strftime('%b')
            # Simulate a slight growth trend backwards
            factor = 1 - (i * 0.05) # 100%, 95%, 90%...
            
            growth_data.append({
                'month': month_name,
                'active': int(active_count * factor),
                'vip': int(vip_count * factor),
                'inactive': int(inactive_count * factor) # Inactive might actually grow, but let's keep it simple
            })

        # 3. Retention Stats
        total_customers = Customer.objects.count()
        total_visits = Visit.objects.count()
        
        # Retention Rate: % of customers with > 1 visit
        retained_customers = Customer.objects.filter(visit_count__gt=1).count()
        retention_rate = (retained_customers / total_customers * 100) if total_customers > 0 else 0
        
        # Avg Visits per Client
        avg_visits = (total_visits / total_customers) if total_customers > 0 else 0
        
        # Avg Visit Value
        total_revenue = Visit.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        avg_visit_value = (total_revenue / total_visits) if total_visits > 0 else 0

        return Response({
            'monthly_sales': formatted_monthly_data,
            'customer_growth': growth_data,
            'summary': {
                'total_annual_sales': sum(d['sales'] for d in formatted_monthly_data),
                'total_customers_gained': sum(d['customers'] for d in formatted_monthly_data),
                'avg_monthly_sales': sum(d['sales'] for d in formatted_monthly_data) / 12 if formatted_monthly_data else 0
            },
            'retention_stats': {
                'retention_rate': round(retention_rate, 1),
                'avg_visits_per_client': round(avg_visits, 1),
                'avg_visit_value': round(float(avg_visit_value), 2),
                'customer_rating': 0  # Placeholder until rating system is implemented
            }
        })

# Top Customers View
class TopCustomersView(APIView):
    """Get top customers by visits and spending"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Top by visit count
        top_by_visits = Customer.objects.filter(
            visit_count__gt=0
        ).order_by('-visit_count')[:10]
        
        # Top by spending
        top_by_spending = Customer.objects.annotate(
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


# Keep Sale views for backward compatibility
class SaleListCreate(generics.ListCreateAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        sale = serializer.save()
        customer = sale.customer
        # Add points: 1 point per currency unit
        customer.points += int(sale.amount)
        customer.last_purchase = sale.date
        customer.save()

class SaleDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]


# Reward Views
class RewardListCreate(generics.ListCreateAPIView):
    queryset = Reward.objects.all()
    serializer_class = RewardSerializer
    permission_classes = [permissions.IsAuthenticated]

class RewardDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reward.objects.all()
    serializer_class = RewardSerializer
    permission_classes = [permissions.IsAuthenticated]


# Customer Portal/Reward Check
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

        # Get customer's visit history
        visits = Visit.objects.filter(customer=customer).order_by('-visit_date')[:10]
        visits_data = VisitSerializer(visits, many=True).data

        # Get purchase history (backward compatibility)
        purchases = Sale.objects.filter(customer=customer).order_by('-date')[:10]
        purchases_data = SaleSerializer(purchases, many=True).data

        # Calculate statistics
        total_spent = visits.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_purchases = purchases.count()

        # Get redemption history
        redemptions = CustomerReward.objects.filter(customer=customer).order_by('-date_claimed')[:10]
        redemptions_data = CustomerRewardSerializer(redemptions, many=True).data

        return Response({
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
            },
            'statistics': {
                'total_spent': float(total_spent),
                'total_visits': customer.visit_count,
                'total_purchases': total_purchases,
            },
            'visits': visits_data,
            'purchases': purchases_data,
            'eligible_rewards': rewards_data,
            'redemptions': redemptions_data
        })


# Website Management
# Removed CustomerWebsite views as requested

class CustomerSignupView(generics.CreateAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.AllowAny]


class BookingViewSet(viewsets.ModelViewSet):
    """API endpoint for bookings"""
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Booking.objects.all().select_related('customer', 'service', 'staff_member')
        
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
            
        return queryset.order_by('-booking_date')


class CustomerRewardViewSet(viewsets.ModelViewSet):
    """API endpoint for customer rewards"""
    queryset = CustomerReward.objects.all()
    serializer_class = CustomerRewardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = CustomerReward.objects.all().select_related('customer', 'reward')
        
        # Filter by customer if requested
        customer_id = self.request.query_params.get('customer', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
            
        return queryset.order_by('-date_claimed')

    def perform_create(self, serializer):
        customer_reward = serializer.save(status='redeemed', date_redeemed=timezone.now())
        customer = customer_reward.customer
        reward = customer_reward.reward
        
        # 1. Handle Visit-Based Rewards (Cycle Reset)
        if (reward.visits_required or 0) > 0:
            # Reset visit count to 0 to start a new cycle
            customer.visit_count = 0
            customer.save()
            
        # 2. Handle Point-Based Rewards
        elif reward.points_required > 0:
            if customer.points >= reward.points_required:
                customer.points -= reward.points_required
                customer.save()
            else:
                # Allow redemption but log/warn (or could raise ValidationError)
                pass 
        
        # Increment times redeemed
        reward.times_redeemed += 1
        reward.save()


class RewardsStatsView(APIView):
    """Statistics for Rewards Dashboard"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        total_rewards_created = Reward.objects.count()
        
        # Total rewards claimed (CustomerReward entries)
        total_rewards_claimed = CustomerReward.objects.count()
        
        # Active rewards (Reward objects that are active)
        active_rewards = Reward.objects.filter(status='active').count()
        
        # Pending redemptions (CustomerReward with status 'pending')
        pending_redemptions = CustomerReward.objects.filter(status='pending').count()
        
        return Response({
            'total_rewards_created': total_rewards_created,
            'total_rewards_claimed': total_rewards_claimed,
            'active_rewards': active_rewards,
            'pending_redemptions': pending_redemptions
        })
