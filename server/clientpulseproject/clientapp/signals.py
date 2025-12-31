from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.contrib.auth.models import User
from .models import (
    Tenant, Booking, Customer, StaffMember, PaymentTransaction, 
    Notification, create_notification, UserProfile, ContactMessage
)

# --- TENANT SIGNALS ---

@receiver(pre_save, sender=Tenant)
def track_tenant_status_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Tenant.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
            instance._old_is_active = old_instance.is_active
            
            # Sync is_active with status
            # If is_active is toggled to True, ensure status is active
            if instance.is_active and not old_instance.is_active:
                instance.status = 'active'
            # If status is changed to active, ensure is_active is True
            elif instance.status == 'active' and old_instance.status != 'active':
                instance.is_active = True
                
        except Tenant.DoesNotExist:
            pass

@receiver(post_save, sender=Tenant)
def tenant_notifications(sender, instance, created, **kwargs):
    # Find tenant admin
    admin_profile = instance.userprofile_set.filter(role='tenant_admin').first()
    admin_user = admin_profile.user if admin_profile else None

    # 1. New Business Application (Notify Super Admin)
    if created:
        # Assuming superusers are platform admins
        superusers = User.objects.filter(is_superuser=True)
        for su in superusers:
            create_notification(
                title="New Business Application",
                message=f"New business '{instance.name}' has registered and is pending approval.",
                recipient_type='admin',
                user=su,
                send_email=True
            )
        return

    # Check for approval via is_active OR status
    is_approved = False
    
    # Check is_active change
    if hasattr(instance, '_old_is_active') and not instance._old_is_active and instance.is_active:
        is_approved = True
        
    # Check status change to active
    if hasattr(instance, '_old_status') and instance._old_status != 'active' and instance.status == 'active':
        is_approved = True

    if is_approved:
        # Business Approved
        if admin_user:
            create_notification(
                title="Business Approved",
                message=f"Congratulations! Your business '{instance.name}' has been approved. You can now log in to your dashboard.",
                recipient_type='admin',
                user=admin_user,
                send_email=True
            )
        return # Exit to avoid double notification if status also changed

    # Other Status Changes
    if hasattr(instance, '_old_status') and instance._old_status != instance.status:
        new_status = instance.status
        
        if new_status == 'rejected':
            # Business Rejected
            if admin_user:
                create_notification(
                    title="Business Application Rejected",
                    message=f"Your application for '{instance.name}' has been rejected. Please contact support.",
                    recipient_type='admin',
                    user=admin_user,
                    send_email=True
                )
        
        elif new_status == 'suspended':
            # Business Suspended
            if admin_user:
                create_notification(
                    title="Business Suspended",
                    message=f"Your business '{instance.name}' has been suspended. Access is restricted.",
                    recipient_type='admin',
                    user=admin_user,
                    send_email=True
                )

# --- BOOKING SIGNALS ---

@receiver(pre_save, sender=Booking)
def track_booking_changes(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Booking.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
            instance._old_staff = old_instance.staff_member
            instance._old_date = old_instance.booking_date
        except Booking.DoesNotExist:
            pass

@receiver(post_save, sender=Booking)
def booking_notifications(sender, instance, created, **kwargs):
    customer = instance.customer
    tenant = instance.tenant
    
    # Find tenant admin
    admin_profile = tenant.userprofile_set.filter(role='tenant_admin').first()
    admin_user = admin_profile.user if admin_profile else None

    if created:
        # 1. New Booking Created
        
        # Notify Customer
        create_notification(
            title="Booking Received",
            message=f"Your booking for {instance.service.name} on {instance.booking_date.strftime('%Y-%m-%d %H:%M')} has been received.",
            recipient_type='customer',
            customer=customer,
            send_email=True
        )
        
        # Notify Tenant Admin
        if admin_user:
            create_notification(
                title="New Booking",
                message=f"New booking from {customer.name} for {instance.service.name}.",
                recipient_type='admin',
                user=admin_user,
                send_email=True
            )
            
        # Notify Staff (if assigned initially)
        if instance.staff_member and instance.staff_member.email:
             # We don't have a direct User link to StaffMember easily in this model yet, 
             # assuming StaffMember has email field.
             # create_notification supports 'staff' recipient_type if we pass StaffMember object
             create_notification(
                title="New Appointment",
                message=f"You have a new appointment with {customer.name} on {instance.booking_date.strftime('%Y-%m-%d %H:%M')}.",
                recipient_type='staff',
                staff=instance.staff_member,
                send_email=True
             )
        return

    # Updates
    if hasattr(instance, '_old_status') and instance._old_status != instance.status:
        new_status = instance.status
        
        if new_status == 'confirmed':
            create_notification(
                title="Booking Confirmed",
                message=f"Your booking for {instance.service.name} has been confirmed.",
                recipient_type='customer',
                customer=customer,
                send_email=True
            )
            
        elif new_status == 'cancelled':
            create_notification(
                title="Booking Cancelled",
                message=f"Your booking for {instance.service.name} has been cancelled.",
                recipient_type='customer',
                customer=customer,
                send_email=True
            )
            # Notify Staff if they were assigned
            if instance.staff_member:
                create_notification(
                    title="Appointment Cancelled",
                    message=f"Appointment with {customer.name} has been cancelled.",
                    recipient_type='staff',
                    staff=instance.staff_member,
                    send_email=True
                )

    # Rescheduling
    if hasattr(instance, '_old_date') and instance._old_date != instance.booking_date:
        create_notification(
            title="Booking Rescheduled",
            message=f"Your booking has been rescheduled to {instance.booking_date.strftime('%Y-%m-%d %H:%M')}.",
            recipient_type='customer',
            customer=customer,
            send_email=True
        )
        if instance.staff_member:
             create_notification(
                title="Appointment Rescheduled",
                message=f"Appointment with {customer.name} rescheduled to {instance.booking_date.strftime('%Y-%m-%d %H:%M')}.",
                recipient_type='staff',
                staff=instance.staff_member,
                send_email=True
             )

    # Staff Assignment
    if hasattr(instance, '_old_staff') and instance._old_staff != instance.staff_member:
        if instance.staff_member:
            create_notification(
                title="New Appointment Assigned",
                message=f"You have been assigned to a booking with {customer.name}.",
                recipient_type='staff',
                staff=instance.staff_member,
                send_email=True
            )
        if instance._old_staff:
             create_notification(
                title="Appointment Unassigned",
                message=f"You have been unassigned from the booking with {customer.name}.",
                recipient_type='staff',
                staff=instance._old_staff,
                send_email=True
            )

# --- CUSTOMER SIGNALS ---

@receiver(post_save, sender=Customer)
def customer_notifications(sender, instance, created, **kwargs):
    if created:
        # Notify Tenant Admin
        tenant = instance.tenant
        admin_profile = tenant.userprofile_set.filter(role='tenant_admin').first()
        if admin_profile and admin_profile.user:
            create_notification(
                title="New Customer",
                message=f"{instance.name} has joined your business.",
                recipient_type='admin',
                user=admin_profile.user,
                send_email=False # Maybe too spammy for email
            )

# --- STAFF SIGNALS ---

@receiver(post_save, sender=StaffMember)
def staff_notifications(sender, instance, created, **kwargs):
    if created:
        # Notify Tenant Admin
        tenant = instance.tenant
        admin_profile = tenant.userprofile_set.filter(role='tenant_admin').first()
        if admin_profile and admin_profile.user:
            create_notification(
                title="Staff Added",
                message=f"{instance.name} has been added to your staff list.",
                recipient_type='admin',
                user=admin_profile.user,
                send_email=False
            )

# --- PAYMENT SIGNALS ---

@receiver(post_save, sender=PaymentTransaction)
def payment_notifications(sender, instance, created, **kwargs):
    if created:
        # Notify Tenant Admin
        tenant = instance.tenant
        admin_profile = tenant.userprofile_set.filter(role='tenant_admin').first()
        if admin_profile and admin_profile.user:
            if instance.status == 'completed':
                create_notification(
                    title="Payment Successful",
                    message=f"Payment of {instance.amount} received via {instance.payment_method}.",
                    recipient_type='admin',
                    user=admin_profile.user,
                    send_email=True
                )
            elif instance.status == 'failed':
                create_notification(
                    title="Payment Failed",
                    message=f"Payment of {instance.amount} failed.",
                    recipient_type='admin',
                    user=admin_profile.user,
                    send_email=True
                )
# --- CONTACT MESSAGE SIGNALS ---

@receiver(post_save, sender=ContactMessage)
def contact_message_notifications(sender, instance, created, **kwargs):
    if created:
        # Notify Tenant Admin
        tenant = instance.tenant
        if tenant:
            admin_profile = tenant.userprofile_set.filter(role='tenant_admin').first()
            if admin_profile and admin_profile.user:
                create_notification(
                    title="New Contact Message",
                    message=f"You have a new message from {instance.full_name}: {instance.subject}",
                    recipient_type='admin',
                    user=admin_profile.user,
                    send_email=True
                )
        else:
            # If no tenant, it's a platform-level message, notify Super Admins
            superusers = User.objects.filter(is_superuser=True)
            for su in superusers:
                create_notification(
                    title="New Platform Message",
                    message=f"New platform message from {instance.full_name}: {instance.subject}",
                    recipient_type='admin',
                    user=su,
                    send_email=True
                )
