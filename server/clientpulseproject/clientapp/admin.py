from django.contrib import admin
import csv
from django.http import HttpResponse
from django.utils.html import format_html
from django.utils import timezone
from .models import (
    Tenant, UserProfile, Service, StaffMember, Customer, Visit, Sale, Reward, 
    Booking, CustomerReward, ContactMessage, Notification, SubscriptionPlan,
    TenantSubscription, PaymentTransaction, create_notification,
    RewardsDashboard, Reports, Settings, MyNotification, CustomersDashboard, Review,
    User, AuthUser
)
from django.contrib.auth.admin import UserAdmin

class ServiceInline(admin.TabularInline):
    model = Service
    extra = 0
    show_change_link = True
    fields = ('name', 'category', 'price', 'duration', 'is_active')

class StaffMemberInline(admin.TabularInline):
    model = StaffMember
    extra = 0
    show_change_link = True
    fields = ('name', 'phone', 'is_active')

class BookingInline(admin.TabularInline):
    model = Booking
    extra = 0
    show_change_link = True
    fields = ('customer', 'service', 'staff_member', 'booking_date', 'status')
    readonly_fields = ('created_at',)

class VisitInline(admin.TabularInline):
    model = Visit
    extra = 0
    show_change_link = True
    fields = ('customer', 'staff_member', 'total_amount', 'payment_status', 'visit_date')
    readonly_fields = ('visit_date',)

class SaleInline(admin.TabularInline):
    model = Sale
    extra = 0
    show_change_link = True
    fields = ('customer', 'amount', 'description', 'date')
    readonly_fields = ('date',)

class RewardInline(admin.TabularInline):
    model = Reward
    extra = 0
    show_change_link = True
    fields = ('name', 'type', 'points_required', 'status')

class CustomerInline(admin.TabularInline):
    model = Customer
    extra = 0
    show_change_link = True
    fields = ('name', 'email', 'phone', 'status', 'points')
    readonly_fields = ('points',)

class NotificationInline(admin.TabularInline):
    model = Notification
    extra = 0
    show_change_link = True
    fields = ('title', 'recipient_type', 'is_read', 'created_at')
    readonly_fields = ('created_at',)

class ContactMessageInline(admin.TabularInline):
    model = ContactMessage
    extra = 0
    show_change_link = True
    fields = ('full_name', 'subject', 'message', 'created_at')
    readonly_fields = ('created_at',)

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['name', 'business_type', 'city', 'phone_number', 'get_customer_count', 'is_active', 'created_at', 'get_message_count']
    search_fields = ['name', 'city', 'phone_number']
    list_filter = ['is_active', 'business_type', 'created_at']
    list_editable = ['is_active']
    
    # Organize inlines with Contact Messages at the top for easy access
    inlines = [
        ContactMessageInline,
        BookingInline,
        CustomerInline,
        VisitInline,
        StaffMemberInline,
        ServiceInline,
        RewardInline,
        SaleInline,
        NotificationInline,
    ]
    
    fieldsets = (
        ('Business Information', {
            'fields': ('name', 'business_type', 'city', 'phone_number', 'owner_full_name', 'owner_email')
        }),
        ('Email Branding', {
            'fields': ('email', 'email_from_name'),
            'description': 'Configure how emails appear to your customers.'
        }),
        ('Emails to CUSTOMERS', {
            'fields': (
                'email_cust_booking_received', 'email_cust_booking_approved', 
                'email_cust_booking_rejected', 'email_cust_booking_rescheduled', 
                'email_cust_booking_cancelled', 'email_cust_booking_reminder', 
                'email_cust_booking_noshow', 'email_cust_booking_completed'
            ),
            'description': 'Control which automated emails are sent to your customers.'
        }),
        ('Emails to TENANT', {
            'fields': (
                'email_tenant_new_booking', 'email_tenant_booking_cancelled', 
                'email_tenant_reschedule_request', 'notify_on_payment', 
                'notify_on_customer_signup'
            ),
            'description': 'Control which automated emails are sent to the business owner.'
        }),
        ('Status', {
            'fields': ('is_active', 'created_at'),
            'description': 'Activate or deactivate this tenant. Active tenants can access the system.'
        }),
    )
    
    readonly_fields = ['created_at', 'owner_full_name', 'owner_email']
    
    # Admin actions
    actions = ['activate_tenants', 'deactivate_tenants', 'view_tenant_stats', 'export_tenants_csv']
    
    def owner_full_name(self, obj):
        """Get the full name of the tenant owner"""
        # Find the tenant admin for this tenant
        admin_profile = obj.userprofile_set.filter(role='tenant_admin').first()
        if admin_profile and admin_profile.user:
            return f"{admin_profile.user.first_name} {admin_profile.user.last_name}"
        return "No Owner Assigned"
    
    def owner_email(self, obj):
        """Get the email of the tenant owner"""
        # Find the tenant admin for this tenant
        admin_profile = obj.userprofile_set.filter(role='tenant_admin').first()
        if admin_profile and admin_profile.user:
            return admin_profile.user.email
        return "No Email"

    
    def get_message_count(self, obj):
        """Display count of contact messages for this tenant"""
        count = obj.contactmessage_set.count()
        if count > 0:
            return f'📧 {count} messages'
        return '—'
    get_message_count.short_description = 'Contact Messages'

    def get_customer_count(self, obj):
        """Display count of customers for this tenant"""
        count = obj.customer_set.count()
        if count > 0:
            return f'👥 {count} customers'
        return '—'
    get_customer_count.short_description = 'Customers'
    
    def export_tenants_csv(self, request, queryset):
        meta = self.model._meta
        field_names = [field.name for field in meta.fields]
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename={meta}.csv'
        writer = csv.writer(response)
        
        writer.writerow(field_names)
        for obj in queryset:
            row = writer.writerow([getattr(obj, field) for field in field_names])
        
        return response
    export_tenants_csv.short_description = "Export Selected Tenants to CSV"

    def activate_tenants(self, request, queryset):
        """Activate selected tenants"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} tenant(s) successfully activated.')
    activate_tenants.short_description = "✅ Activate selected tenants"
    
    def deactivate_tenants(self, request, queryset):
        """Deactivate selected tenants"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} tenant(s) successfully deactivated.')
    deactivate_tenants.short_description = "❌ Deactivate selected tenants"
    
    def view_tenant_stats(self, request, queryset):
        """Display statistics for selected tenants"""
        stats = []
        for tenant in queryset:
            stats.append(f"{tenant.name}: {tenant.customer_set.count()} customers, "
                        f"{tenant.booking_set.count()} bookings, "
                        f"{tenant.contactmessage_set.count()} messages")
        self.message_user(request, " | ".join(stats))
    view_tenant_stats.short_description = "📊 View statistics for selected tenants"
    
    class Media:
        css = {
            'all': ('admin/css/custom_admin.css',)
        }

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'tenant']
    search_fields = ['user__username', 'user__email']
    list_filter = ['role', 'tenant']

@admin.register(AuthUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)





class TenantAdminMixin:
    """Mixin to restrict admin access to the user's tenant"""
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'profile') and request.user.profile.tenant:
            return qs.filter(tenant=request.user.profile.tenant)
        return qs.none() # If no tenant, show nothing

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser:
            if hasattr(request.user, 'profile') and request.user.profile.tenant:
                obj.tenant = request.user.profile.tenant
        super().save_model(request, obj, form, change)

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if not request.user.is_superuser:
            # Hide tenant field for non-superusers
            if 'tenant' in form.base_fields:
                form.base_fields['tenant'].widget = admin.widgets.HiddenInput()
                form.base_fields['tenant'].required = False
        return form


@admin.register(Service)
class ServiceAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ['name', 'tenant', 'category', 'price', 'duration', 'is_active']
    search_fields = ['name', 'description', 'tenant__name']
    list_filter = ['tenant', 'category', 'is_active', 'created_at']
    list_editable = ['price', 'is_active']


@admin.register(StaffMember)
class StaffMemberAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ['name', 'tenant', 'specialty', 'phone', 'is_active', 'joined_date']
    search_fields = ['name', 'phone', 'tenant__name', 'specialty']
    list_filter = ['tenant', 'is_active', 'joined_date']


@admin.register(Customer)
class CustomerAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ['name', 'tenant', 'email', 'phone', 'status', 'visit_count', 'points', 'created_at']
    search_fields = ['name', 'email', 'phone', 'tenant__name']
    list_filter = ['tenant', 'status', 'created_at']
    readonly_fields = ['created_at', 'points', 'visit_count']
    filter_horizontal = ['favorite_services']
    actions = ['send_promotion']
    fieldsets = (
        ('Basic Information', {
            'fields': ('tenant', 'name', 'email', 'phone')
        }),
        ('Status & Location', {
            'fields': ('status', 'location')
        }),
        ('Salon/Spa Preferences', {
            'fields': ('favorite_services', 'preferred_staff', 'service_notes')
        }),
        ('Loyalty Program', {
            'fields': ('points', 'visit_count', 'last_purchase')
        }),
        ('Additional Details', {
            'fields': ('notes', 'created_at')
        }),
    )

    def send_promotion(self, request, queryset):
        for customer in queryset:
            create_notification(
                title="Special Promotion",
                message="This week only! 10% off all services at ClientPulse Salon.",
                recipient_type='customer',
                customer=customer
            )
        self.message_user(request, f"Promotion sent to {queryset.count()} customers.")
    send_promotion.short_description = "Send 10%% Discount Promotion"


@admin.register(Notification)
class NotificationAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ['title', 'tenant', 'recipient_type', 'is_read', 'created_at']
    list_filter = ['tenant', 'recipient_type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'tenant__name']
    readonly_fields = ['created_at']


@admin.register(Visit)
class VisitAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ['customer', 'tenant', 'staff_member', 'total_amount', 'payment_status', 'visit_date']
    search_fields = ['customer__name', 'customer__phone', 'staff_member__name', 'tenant__name']
    list_filter = ['tenant', 'payment_status', 'visit_date', 'staff_member']
    readonly_fields = ['visit_date']
    filter_horizontal = ['services']
    autocomplete_fields = ['customer', 'staff_member']
    fieldsets = (
        ('Visit Information', {
            'fields': ('tenant', 'customer', 'visit_date')
        }),
        ('Services & Staff', {
            'fields': ('services', 'staff_member')
        }),
        ('Payment', {
            'fields': ('total_amount', 'payment_status')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    )


@admin.register(Sale)
class SaleAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ['customer', 'tenant', 'amount', 'description', 'date']
    search_fields = ['customer__name', 'description', 'tenant__name']
    list_filter = ['tenant', 'date']
    readonly_fields = ['date']
    autocomplete_fields = ['customer']


@admin.register(Reward)
class RewardAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ['name', 'tenant', 'type', 'points_required', 'visits_required', 'status', 'times_redeemed', 'expiry_date']
    search_fields = ['name', 'description', 'tenant__name']
    list_filter = ['tenant', 'type', 'status', 'created_at']
    readonly_fields = ['created_at', 'times_redeemed']
    filter_horizontal = ['applicable_services']
    fieldsets = (
        ('Basic Information', {
            'fields': ('tenant', 'name', 'description', 'type')
        }),
        ('Reward Requirements', {
            'fields': ('points_required', 'visits_required', 'applicable_services')
        }),
        ('Reward Details', {
            'fields': ('value', 'expiry_date')
        }),
        ('Status & Stats', {
            'fields': ('status', 'times_redeemed', 'created_at')
        }),
    )

@admin.register(Booking)
class BookingAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ['customer', 'tenant', 'service', 'staff_member', 'booking_date', 'status', 'created_at']
    search_fields = ['customer__name', 'customer__phone', 'service__name', 'tenant__name']
    list_filter = ['tenant', 'status', 'booking_date', 'staff_member']
    readonly_fields = ['created_at']
    autocomplete_fields = ['customer', 'staff_member']
    list_editable = ['status']


@admin.register(CustomerReward)
class CustomerRewardAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ['customer', 'tenant', 'reward', 'status', 'date_claimed', 'date_redeemed']
    search_fields = ['customer__name', 'reward__name', 'tenant__name']
    list_filter = ['tenant', 'status', 'date_claimed']
    readonly_fields = ['date_claimed']
    autocomplete_fields = ['customer', 'reward']


@admin.register(ContactMessage)
class ContactMessageAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ['full_name', 'tenant', 'email', 'subject', 'is_read', 'created_at', 'reply_action']
    search_fields = ['full_name', 'email', 'subject', 'message', 'tenant__name']
    list_filter = ['tenant', 'is_read', 'created_at']
    readonly_fields = ['created_at', 'replied_at']
    actions = ['mark_as_read', 'mark_as_unread']
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('tenant', 'full_name', 'email', 'phone')
        }),
        ('Message Details', {
            'fields': ('subject', 'message', 'is_read'),
            'classes': ('wide',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'replied_at'),
            'classes': ('collapse',)
        }),
    )
    
    def message_preview(self, obj):
        """Show a preview of the message"""
        if len(obj.message) > 50:
            return obj.message[:50] + '...'
        return obj.message
    message_preview.short_description = 'Message'

    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
    mark_as_read.short_description = 'Mark selected messages as read'
    
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
    mark_as_unread.short_description = 'Mark selected messages as unread'
    
    def reply_action(self, obj):
        return format_html(
            '<a class="button" href="mailto:{}?subject=Re: {}" style="background-color: #795548; color: white; padding: 2px 10px; border-radius: 4px; text-decoration: none;">Reply</a>',
            obj.email,
            obj.subject
        )
    reply_action.short_description = 'Action'
    
    # Make the list view more informative
    list_per_page = 25
    date_hierarchy = 'created_at'


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'interval', 'is_popular', 'is_active']
    list_editable = ['is_active', 'is_popular']
    search_fields = ['name', 'description']

@admin.register(TenantSubscription)
class TenantSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'plan', 'status', 'start_date', 'next_billing_date']
    list_filter = ['status', 'plan']
    search_fields = ['tenant__name']
    autocomplete_fields = ['tenant', 'plan']

@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_date', 'tenant', 'plan', 'amount', 'status', 'payment_method']
    list_filter = ['status', 'payment_method', 'transaction_date']
    search_fields = ['tenant__name', 'reference_number']
    readonly_fields = ['transaction_date']


@admin.register(MyNotification)
class MyNotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'message', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['title', 'message']
    readonly_fields = ['created_at', 'title', 'message', 'recipient_type', 'user', 'tenant', 'customer', 'staff']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated:
            return qs.filter(user=request.user)
        return qs.none()
    
    def has_add_permission(self, request):
        return False

@admin.register(CustomersDashboard)
class CustomersDashboardAdmin(admin.ModelAdmin):
    change_list_template = 'admin/customers_dashboard_change_list.html'
    
    def changelist_view(self, request, extra_context=None):
        from django.db.models import Count
        
        # Get stats
        total_customers = Customer.objects.count()
        active_customers = Customer.objects.filter(status='ACTIVE').count()
        new_this_month = Customer.objects.filter(created_at__month=timezone.now().month).count()
        
        # Top tenants by customers
        top_tenants = Tenant.objects.annotate(cust_count=Count('customer')).order_by('-cust_count')[:5]
        
        extra_context = extra_context or {}
        extra_context['stats'] = {
            'total_customers': total_customers,
            'active_customers': active_customers,
            'new_this_month': new_this_month,
        }
        extra_context['top_tenants'] = top_tenants
        extra_context['title'] = 'Customers Dashboard'
        
        return super().changelist_view(request, extra_context=extra_context)

    def has_add_permission(self, request):
        return False

@admin.register(RewardsDashboard)
class RewardsDashboardAdmin(admin.ModelAdmin):
    change_list_template = 'admin/rewards_dashboard_change_list.html'
    
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['stats'] = {
            'total_rewards': Reward.objects.count(),
            'active_rewards': Reward.objects.filter(status='active').count(),
            'total_claimed': CustomerReward.objects.count(),
            'pending_redemptions': CustomerReward.objects.filter(status='pending').count(),
        }
        extra_context['title'] = 'Rewards Dashboard'
        return super().changelist_view(request, extra_context=extra_context)

    def has_add_permission(self, request):
        return False

@admin.register(Reports)
class ReportsAdmin(admin.ModelAdmin):
    change_list_template = 'admin/reports_change_list.html'
    
    def changelist_view(self, request, extra_context=None):
        from django.db.models import Sum
        from django.db.models.functions import TruncMonth
        
        # Get analytics
        total_revenue = Visit.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        total_visits = Visit.objects.count()
        
        monthly_revenue = Visit.objects.annotate(month=TruncMonth('visit_date')) \
            .values('month') \
            .annotate(revenue=Sum('total_amount')) \
            .order_by('-month')[:6]
            
        extra_context = extra_context or {}
        extra_context['analytics'] = {
            'total_revenue': total_revenue,
            'total_visits': total_visits,
            'monthly_revenue': monthly_revenue,
        }
        extra_context['title'] = 'Business Reports'
        return super().changelist_view(request, extra_context=extra_context)

    def has_add_permission(self, request):
        return False

@admin.register(Review)
class ReviewAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ['get_reviewer_name', 'reviewer_type', 'tenant', 'rating', 'is_public', 'created_at']
    list_filter = ['reviewer_type', 'tenant', 'rating', 'is_public', 'created_at']
    search_fields = ['customer__name', 'comment', 'tenant__name', 'user__username', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at']
    list_editable = ['is_public']

    def get_reviewer_name(self, obj):
        if obj.customer:
            return obj.customer.name
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return "Anonymous"
    get_reviewer_name.short_description = 'Reviewer'

@admin.register(Settings)
class SettingsAdmin(admin.ModelAdmin):
    list_display = ['name', 'business_type', 'city', 'phone_number', 'is_active']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'profile') and request.user.profile.tenant:
            return qs.filter(id=request.user.profile.tenant.id)
        return qs.none()

    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False






