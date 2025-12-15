from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, UserListView, 
    CustomerListCreate, CustomerDetail, CustomerServiceHistoryView,
    SaleListCreate, SaleDetail, 
    DashboardStatsView, DailyStatsView, TopCustomersView,
    RewardListCreate, RewardDetail, 
    CustomerRewardCheckView, CustomerSignupView, CustomerPortalDetailsView,
    ServiceViewSet, VisitViewSet, StaffMemberViewSet,
    AnalyticsView, BookingViewSet, CustomerRewardViewSet, RewardsStatsView
)

# Router for ViewSets
router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'visits', VisitViewSet, basename='visit')
router.register(r'staff', StaffMemberViewSet, basename='staff')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'customer-rewards', CustomerRewardViewSet, basename='customer-reward')

urlpatterns = [
    # Router URLs (services, visits, staff)
    path('', include(router.urls)),
    
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('customer-signup/', CustomerSignupView.as_view(), name='customer-signup'),
    path('users/', UserListView.as_view(), name='user-list'),
    
    # Customers
    path('customers/', CustomerListCreate.as_view(), name='customer-list-create'),
    path('customers/<int:pk>/', CustomerDetail.as_view(), name='customer-detail'),
    path('customers/<int:pk>/portal-details/', CustomerPortalDetailsView.as_view(), name='customer-portal-details'),
    path('customers/<int:customer_id>/service-history/', CustomerServiceHistoryView.as_view(), name='customer-service-history'),
    
    # Sales (backward compatibility)
    path('sales/', SaleListCreate.as_view(), name='sale-list-create'),
    path('sales/<int:pk>/', SaleDetail.as_view(), name='sale-detail'),
    
    # Dashboard & Analytics
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/daily-stats/', DailyStatsView.as_view(), name='daily-stats'),
    path('dashboard/top-customers/', TopCustomersView.as_view(), name='top-customers'),
    path('dashboard/analytics/', AnalyticsView.as_view(), name='analytics'),
    
    # Rewards
    path('rewards/', RewardListCreate.as_view(), name='reward-list-create'),
    path('rewards/<int:pk>/', RewardDetail.as_view(), name='reward-detail'),
    path('rewards/stats/', RewardsStatsView.as_view(), name='rewards-stats'),
    path('check-rewards/', CustomerRewardCheckView.as_view(), name='check-rewards'),
]
