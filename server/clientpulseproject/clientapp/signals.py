from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
User = get_user_model()
from django.utils import timezone
from .models import (
    Tenant, Booking, Customer, StaffMember, PaymentTransaction, 
    Notification, create_notification, UserProfile, ContactMessage, Service, Visit
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
        
        # Notify Customer - Booking Confirmation
        create_notification(
            title="Booking Confirmed",
            message=f"Your booking for {instance.service.name} on {instance.booking_date.strftime('%B %d, %Y at %I:%M %p')} has been confirmed. We look forward to seeing you!",
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
                title="Booking Approved",
                message=f"Great news! Your booking for {instance.service.name} on {instance.booking_date.strftime('%B %d, %Y at %I:%M %p')} has been approved by our team.",
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
            # Notify Tenant Admin
            if admin_user:
                create_notification(
                    title="Booking Cancelled",
                    message=f"Booking for {customer.name} has been cancelled.",
                    recipient_type='admin',
                    user=admin_user,
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
        
        elif new_status == 'rejected':
            create_notification(
                title="Booking Rejected",
                message=f"Unfortunately, your booking for {instance.service.name} has been rejected.",
                recipient_type='customer',
                customer=customer,
                send_email=True
            )
            
        elif new_status == 'no_show':
            create_notification(
                title="Booking No-Show",
                message=f"We missed you! Your booking for {instance.service.name} was marked as a no-show.",
                recipient_type='customer',
                customer=customer,
                send_email=True
            )
            
        elif new_status == 'completed':
            # Try to find the visit created from this booking to get its ID
            from .models import Visit
            visit = Visit.objects.filter(
                customer=customer, 
                tenant=tenant,
                visit_date__date=timezone.now().date()
            ).order_by('-visit_date').first()
            
            # Build the thank you message
            message = f"Thank you for choosing us, {customer.name}! We hope you enjoyed your {instance.service.name} service."
            
            if visit:
                # Use the dedicated review page
                review_link = f"http://localhost:5173/review/{visit.id}"
                message += f"\n\nWe'd love to hear about your experience! Please take a moment to leave us a review: {review_link}"
            else:
                message += "\n\nWe'd love to hear about your experience! Please visit your customer portal to leave us a review."
                
            create_notification(
                title="Thank You for Your Visit!",
                message=message,
                recipient_type='customer',
                customer=customer,
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
        # Notify Tenant Admin
        if admin_user:
            create_notification(
                title="Booking Rescheduled",
                message=f"Booking for {customer.name} has been rescheduled to {instance.booking_date.strftime('%Y-%m-%d %H:%M')}.",
                recipient_type='admin',
                user=admin_user,
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
        tenant = instance.tenant
        
        # 1. Notify Tenant Admin(s)
        admin_profiles = UserProfile.objects.filter(tenant=tenant, role='tenant_admin')
        for admin_profile in admin_profiles:
            if admin_profile.user and admin_profile.user.email:
                create_notification(
                    title="New Customer Signup",
                    message=f"Great news! A new customer, {instance.name}, has just registered with {tenant.name}.",
                    recipient_type='admin',
                    user=admin_profile.user,
                    send_email=True
                )
        
        # 2. Notify the Customer (Welcome Email)
        if instance.email:
            create_notification(
                title=f"Welcome to {tenant.name}!",
                message=f"Hi {instance.name},\n\nThank you for joining {tenant.name}! Your account has been successfully created. You can now log in to our portal to view your rewards and book services.\n\nWe look forward to seeing you soon!",
                recipient_type='customer',
                customer=instance,
                send_email=True
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

# --- VISIT SIGNALS ---

@receiver(post_save, sender=Visit)
def visit_review_request(sender, instance, created, **kwargs):
    """Send a review request when a visit is marked as paid"""
    if instance.payment_status == 'paid' and not instance.review_request_sent:
        customer = instance.customer
        tenant = instance.tenant
        
        if customer and tenant:
            # In a real app, we'd delay this by 2 hours using Celery.
            # For now, we'll send it immediately.
            
            # The review link points to the customer portal or a dedicated review page
            # We'll use a dedicated review page route: /review/:visitId
            review_link = f"http://localhost:5173/review/{instance.id}"
            
            create_notification(
                title="How was your visit?",
                message=f"Hi {customer.name}, thank you for visiting {tenant.name} today! We'd love to hear your feedback. Please rate your experience here: {review_link}",
                recipient_type='customer',
                customer=customer,
                send_email=True
            )
            
            # Mark as sent using update to avoid recursion
            Visit.objects.filter(pk=instance.pk).update(review_request_sent=True)

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

# --- SERVICE POPULATION ---

@receiver(post_save, sender=Tenant)
def populate_tenant_services(sender, instance, created, **kwargs):
    if created:
        services_to_create = []
        
        kinyozi_services = [
            ('Haircut (Adult)', 'hair', 500, 30, 'Professional haircut tailored to your style.'),
            ('Haircut (Kids)', 'hair', 300, 20, 'Gentle, child-friendly haircut.'),
            ('Beard Trim', 'hair', 200, 15, 'Clean shaping and trimming of the beard.'),
            ('Beard Shave (Clean Shave)', 'hair', 250, 20, 'Smooth, close shave for a fresh look.'),
            ('Hairline / Shape-up', 'hair', 150, 10, 'Precise edge-up for a sharp finish.'),
            ('Hair Wash', 'hair', 200, 15, 'Refreshing wash and scalp cleanse.'),
            ('Hair Dye (Men)', 'hair', 1000, 45, 'Color treatment for hair or beard.'),
            ('Scalp Massage', 'hair', 300, 15, 'Relaxing massage to boost blood circulation.'),
            ('Haircut + Beard Trim', 'packages', 650, 45, 'Complete grooming in one session.'),
            ('Full Grooming Package', 'packages', 1200, 75, 'Haircut, beard, wash, and finishing touches.'),
        ]
        
        salon_services = [
            ('Hair Wash & Blow-dry', 'hair', 800, 45, 'Cleanse, dry, and style your hair.'),
            ('Hair Styling', 'hair', 1500, 60, 'Styling for everyday or special occasions.'),
            ('Braiding', 'hair', 2500, 180, 'Neat and stylish protective braids.'),
            ('Weaving / Extensions', 'hair', 3500, 120, 'Hair extensions for length and volume.'),
            ('Wig Installation', 'hair', 2000, 90, 'Secure and natural-looking wig fitting.'),
            ('Hair Relaxing', 'hair', 1500, 90, 'Smoothening treatment for easy styling.'),
            ('Hair Treatment', 'hair', 1200, 45, 'Nourishing care for damaged hair.'),
            ('Hair Coloring', 'hair', 3000, 120, 'Professional hair color application.'),
            ('Keratin Treatment', 'hair', 5000, 180, 'Long-lasting smooth and frizz-free hair.'),
            ('Manicure', 'nails', 800, 45, 'Nail shaping, cleaning, and polish for hands.'),
            ('Pedicure', 'nails', 1000, 60, 'Foot care, nail grooming, and polish.'),
            ('Gel Nails', 'nails', 1500, 60, 'Long-lasting gel polish finish.'),
            ('Acrylic Nails', 'nails', 2500, 90, 'Strong nail extensions with custom shapes.'),
            ('Nail Art', 'nails', 500, 30, 'Creative designs and decorative nail styling.'),
            ('Nail Repair', 'nails', 200, 15, 'Fixing broken or damaged nails.'),
            ('Makeup (Casual)', 'makeup', 1500, 45, 'Light makeup for everyday wear.'),
            ('Bridal Makeup', 'makeup', 5000, 120, 'Elegant makeup for weddings.'),
            ('Event Makeup', 'makeup', 3000, 90, 'Glamorous look for special events.'),
            ('Photoshoot Makeup', 'makeup', 3500, 90, 'Camera-ready professional makeup.'),
        ]
        
        spa_services = [
            ('Full Body Massage', 'massage', 3500, 60, 'Relaxing massage for overall wellness.'),
            ('Swedish Massage', 'massage', 3000, 60, 'Gentle massage for relaxation and stress relief.'),
            ('Deep Tissue Massage', 'massage', 4000, 60, 'Targets muscle tension and pain.'),
            ('Hot Stone Massage', 'massage', 4500, 90, 'Warm stones for deep muscle relaxation.'),
            ('Reflexology', 'massage', 2000, 45, 'Pressure-point therapy on feet and hands.'),
            ('Head & Shoulder Massage', 'massage', 1500, 30, 'Relieves tension in upper body.'),
            ('Facial Treatment', 'facial', 2500, 45, 'Refreshes and revitalizes the skin.'),
            ('Deep Cleansing Facial', 'facial', 3000, 60, 'Removes impurities and unclogs pores.'),
            ('Anti-Aging Facial', 'facial', 4000, 60, 'Improves skin tone and reduces fine lines.'),
            ('Acne Treatment', 'facial', 3500, 60, 'Targets breakouts and skin irritation.'),
            ('Body Scrub', 'body', 2500, 45, 'Exfoliates dead skin for smoothness.'),
            ('Body Wrap', 'body', 3500, 60, 'Nourishing treatment to hydrate and detoxify skin.'),
            ('Detox Treatment', 'body', 4000, 60, 'Helps remove toxins and refresh the body.'),
        ]
        
        b_type = instance.business_type.lower()
        
        if b_type == 'kinyozi':
            services_to_create = kinyozi_services
        elif b_type == 'salon':
            services_to_create = salon_services
        elif b_type == 'spa':
            services_to_create = spa_services
        elif b_type == 'multi-service':
            services_to_create = kinyozi_services + salon_services + spa_services
            
        for name, cat, price, duration, desc in services_to_create:
            Service.objects.create(
                tenant=instance,
                name=name,
                category=cat,
                price=price,
                duration=duration,
                description=desc
            )
