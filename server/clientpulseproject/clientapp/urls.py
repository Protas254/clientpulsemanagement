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
    AnalyticsView, BookingViewSet, CustomerRewardViewSet, RewardsStatsView,
    initiate_stk_push, mpesa_callback, ContactMessageViewSet, NotificationViewSet,
    CustomerProfileUpdateView, AdminProfileUpdateView, BusinessRegistrationView,
    TenantSearchView, TenantViewSet, SubscriptionPlanViewSet, TenantSubscriptionViewSet,
    TenantSettingsView, ReviewViewSet,
    PasswordResetRequestView, PasswordResetConfirmView,
    RequestOTPView, VerifyOTPView, ResetPasswordOTPView,
    ProductViewSet, InventoryLogViewSet, PayrollView
)

# Router for ViewSets
router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'visits', VisitViewSet, basename='visit')
router.register(r'staff', StaffMemberViewSet, basename='staff')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'customer-rewards', CustomerRewardViewSet, basename='customer-reward')
router.register(r'contact-messages', ContactMessageViewSet, basename='contact-message')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'tenants', TenantViewSet, basename='tenant')
router.register(r'subscription-plans', SubscriptionPlanViewSet, basename='subscription-plan')
router.register(r'tenant-subscriptions', TenantSubscriptionViewSet, basename='tenant-subscription')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'inventory-logs', InventoryLogViewSet, basename='inventory-log')

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('business-register/', BusinessRegistrationView.as_view(), name='business-register'),
    path('login/', LoginView.as_view(), name='login'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('password-reset/request-otp/', RequestOTPView.as_view(), name='request-otp'),
    path('password-reset/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('password-reset/reset-with-otp/', ResetPasswordOTPView.as_view(), name='reset-with-otp'),
    path('customer-signup/', CustomerSignupView.as_view(), name='customer-signup'),
    path('tenants/search/', TenantSearchView.as_view(), name='tenant-search'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('admin/update-profile/', AdminProfileUpdateView.as_view(), name='admin-profile-update'),
    path('tenant/settings/', TenantSettingsView.as_view(), name='tenant-settings'),
    
    # Customers
    path('customers/', CustomerListCreate.as_view(), name='customer-list-create'),
    path('customers/<uuid:pk>/', CustomerDetail.as_view(), name='customer-detail'),
    path('customers/<uuid:pk>/portal-details/', CustomerPortalDetailsView.as_view(), name='customer-portal-details'),
    path('customers/<uuid:pk>/update-profile/', CustomerProfileUpdateView.as_view(), name='customer-profile-update'),
    path('customers/<uuid:customer_id>/service-history/', CustomerServiceHistoryView.as_view(), name='customer-service-history'),
    
    # Sales (backward compatibility)
    path('sales/', SaleListCreate.as_view(), name='sale-list-create'),
    path('sales/<uuid:pk>/', SaleDetail.as_view(), name='sale-detail'),
    
    # Dashboard & Analytics
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/daily-stats/', DailyStatsView.as_view(), name='daily-stats'),
    path('dashboard/top-customers/', TopCustomersView.as_view(), name='top-customers'),
    path('dashboard/analytics/', AnalyticsView.as_view(), name='analytics'),
    path('payroll/', PayrollView.as_view(), name='payroll'),
    
    # Rewards
    path('rewards/', RewardListCreate.as_view(), name='reward-list-create'),
    path('rewards/<uuid:pk>/', RewardDetail.as_view(), name='reward-detail'),
    path('rewards/stats/', RewardsStatsView.as_view(), name='rewards-stats'),
    path('check-rewards/', CustomerRewardCheckView.as_view(), name='check-rewards'),
    
    # M-Pesa
    path('mpesa/stk-push/', initiate_stk_push, name='initiate-stk-push'),
    path('mpesa/callback/', mpesa_callback, name='mpesa-callback'),

    # Router URLs (services, visits, staff) - Must be last to avoid shadowing custom paths
    path('', include(router.urls)),
]
