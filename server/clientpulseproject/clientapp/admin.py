from django.contrib import admin
from django.contrib import admin
from .models import Customer, Sale, Reward, Service, Visit, StaffMember, Booking, CustomerReward


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'duration', 'is_active']
    search_fields = ['name', 'description']
    list_filter = ['category', 'is_active', 'created_at']
    list_editable = ['price', 'is_active']


@admin.register(StaffMember)
class StaffMemberAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'is_active', 'joined_date']
    search_fields = ['name', 'phone']
    list_filter = ['is_active', 'joined_date']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'status', 'visit_count', 'points', 'created_at']
    search_fields = ['name', 'email', 'phone']
    list_filter = ['status', 'created_at']
    readonly_fields = ['created_at', 'points', 'visit_count']
    filter_horizontal = ['favorite_services']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'email', 'phone')
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


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ['customer', 'staff_member', 'total_amount', 'payment_status', 'visit_date']
    search_fields = ['customer__name', 'customer__phone', 'staff_member__name']
    list_filter = ['payment_status', 'visit_date', 'staff_member']
    readonly_fields = ['visit_date']
    filter_horizontal = ['services']
    autocomplete_fields = ['customer', 'staff_member']
    fieldsets = (
        ('Visit Information', {
            'fields': ('customer', 'visit_date')
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
class SaleAdmin(admin.ModelAdmin):
    list_display = ['customer', 'amount', 'description', 'date']
    search_fields = ['customer__name', 'description']
    list_filter = ['date']
    readonly_fields = ['date']
    autocomplete_fields = ['customer']


@admin.register(Reward)
class RewardAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'points_required', 'visits_required', 'status', 'times_redeemed', 'expiry_date']
    search_fields = ['name', 'description']
    list_filter = ['type', 'status', 'created_at']
    readonly_fields = ['created_at', 'times_redeemed']
    filter_horizontal = ['applicable_services']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'type')
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
class BookingAdmin(admin.ModelAdmin):
    list_display = ['customer', 'service', 'staff_member', 'booking_date', 'status', 'created_at']
    search_fields = ['customer__name', 'customer__phone', 'service__name']
    list_filter = ['status', 'booking_date', 'staff_member']
    readonly_fields = ['created_at']
    autocomplete_fields = ['customer', 'staff_member']
    list_editable = ['status']


@admin.register(CustomerReward)
class CustomerRewardAdmin(admin.ModelAdmin):
    list_display = ['customer', 'reward', 'status', 'date_claimed', 'date_redeemed']
    search_fields = ['customer__name', 'reward__name']
    list_filter = ['status', 'date_claimed']
    readonly_fields = ['date_claimed']
    autocomplete_fields = ['customer', 'reward']
