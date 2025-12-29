from django.contrib import admin
from django.contrib import admin
from .models import Customer, Sale, Reward, Service, Visit, StaffMember, Booking, CustomerReward, ContactMessage, Notification, create_notification, Tenant, UserProfile

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
    fields = ('full_name', 'subject', 'created_at')
    readonly_fields = ('created_at',)

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['name', 'business_type', 'city', 'phone_number', 'is_active', 'created_at']
    search_fields = ['name', 'city', 'phone_number']
    list_filter = ['is_active', 'business_type', 'created_at']
    list_editable = ['is_active']
    inlines = [
        ServiceInline,
        StaffMemberInline,
        BookingInline,
        VisitInline,
        SaleInline,
        RewardInline,
        NotificationInline,
        ContactMessageInline
    ]

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'tenant']
    search_fields = ['user__username', 'user__email']
    list_filter = ['role', 'tenant']





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
    list_display = ['name', 'tenant', 'phone', 'is_active', 'joined_date']
    search_fields = ['name', 'phone', 'tenant__name']
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
    list_display = ['full_name', 'tenant', 'email', 'phone', 'subject', 'created_at']
    search_fields = ['full_name', 'email', 'subject', 'message', 'tenant__name']
    list_filter = ['tenant', 'created_at']
    readonly_fields = ['created_at']
