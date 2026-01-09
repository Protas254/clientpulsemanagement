from django.db import models
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth.models import AbstractUser
import uuid
import random
import string

# Create your models here.

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        db_table = 'auth_user' # Keep the same table name if possible, or let Django handle it

class AuthUser(User):
    class Meta:
        proxy = True
        app_label = 'auth'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

class Tenant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    business_type = models.CharField(max_length=50) # Kinyozi, Salon, Spa, Multi-service
    city = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=False) # Approved or not
    
    # Branding
    logo = models.ImageField(upload_to='tenant_logos/', null=True, blank=True)
    primary_color = models.CharField(max_length=7, default='#D97706') # Default amber-600
    
    # Automated Campaigns
    auto_campaign_we_miss_you = models.BooleanField(default=False)
    we_miss_you_discount_pct = models.IntegerField(default=10)
    we_miss_you_days = models.IntegerField(default=30)
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Email Branding & Notifications
    email = models.EmailField(null=True, blank=True, help_text="Business email for reply-to")
    email_from_name = models.CharField(max_length=255, default="ClientPulse")
    
    # General Notifications
    notify_on_payment = models.BooleanField(default=True)
    notify_on_customer_signup = models.BooleanField(default=True)

    # Emails to CUSTOMERS
    email_cust_booking_received = models.BooleanField(default=True, help_text="Booking received (pending)")
    email_cust_booking_approved = models.BooleanField(default=True, help_text="Booking approved")
    email_cust_booking_rejected = models.BooleanField(default=True, help_text="Booking rejected")
    email_cust_booking_rescheduled = models.BooleanField(default=True, help_text="Booking rescheduled")
    email_cust_booking_cancelled = models.BooleanField(default=True, help_text="Booking cancelled by business")
    email_cust_booking_reminder = models.BooleanField(default=True, help_text="Booking reminder (24h / 2h)")
    email_cust_booking_noshow = models.BooleanField(default=False, help_text="Booking no-show notice")
    email_cust_booking_completed = models.BooleanField(default=True, help_text="Booking completed / thank you")
    
    # Emails to TENANT
    email_tenant_new_booking = models.BooleanField(default=True, help_text="New booking alert")
    email_tenant_booking_cancelled = models.BooleanField(default=True, help_text="Booking cancellation")
    email_tenant_reschedule_request = models.BooleanField(default=True, help_text="Reschedule request")
    
    # Onboarding & Settings
    business_hours = models.JSONField(default=dict, blank=True, help_text="e.g. {'monday': {'open': '09:00', 'close': '18:00'}, ...}")
    onboarding_completed = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name

class UserProfile(models.Model):
    """Extra profile information for system users (admins, staff)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    photo = models.ImageField(upload_to='admin_photos/', null=True, blank=True)
    
    # Multi-tenancy fields
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    ROLE_CHOICES = [
        ('platform_admin', 'Platform Admin'),
        ('tenant_admin', 'Tenant Admin'),
        ('staff', 'Staff'),
        ('customer', 'Customer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='tenant_admin')
    
    def __str__(self):
        return f"{self.user.username}'s Profile ({self.role})"

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    UserProfile.objects.get_or_create(user=instance)
    instance.profile.save()

class StaffMember(models.Model):
    """Staff members (barbers, stylists, therapists) who provide services"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_profile')
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    specialty = models.CharField(max_length=200, blank=True, help_text="e.g. Senior Barber, Hair Colorist")
    is_active = models.BooleanField(default=True)
    joined_date = models.DateField(auto_now_add=True)
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="Percentage of service revenue earned by staff (0-100)")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.specialty})" if self.specialty else self.name


class Service(models.Model):
    """Services offered (haircut, shave, braiding, massage, facial, etc.)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    CATEGORY_CHOICES = [
        ('hair', 'Hair Services'),
        ('spa', 'Spa & Massage'),
        ('nails', 'Nail Services'),
        ('facial', 'Facial & Beauty'),
        ('massage', 'Massage Services'),
        ('makeup', 'Makeup Services'),
        ('body', 'Body Treatments'),
        ('packages', 'Packages'),
        ('other', 'Other Services'),
    ]
    
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='hair')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration = models.IntegerField(help_text="Duration in minutes", default=30)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - KES {self.price}"


class Product(models.Model):
    """Inventory Products (e.g., Shampoo, Dye, Retail items)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Retail Price")
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Cost Price for profit calc")
    current_stock = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=5)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.current_stock})"

class ServiceProductConsumption(models.Model):
    """Mapping of products consumed by a service (e.g., 1 Hair Dye consumes 1 Red Dye Tube)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='product_consumption')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1, help_text="Amount consumed per service")

    def __str__(self):
        return f"{self.service.name} uses {self.quantity} x {self.product.name}"

class InventoryLog(models.Model):
    """Log of stock changes"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='logs')
    change_quantity = models.IntegerField(help_text="Positive for addition, negative for deduction")
    reason = models.CharField(max_length=50) # restock, service_use, sale, adjustment, damage
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.product.name}: {self.change_quantity} ({self.reason})"


class Customer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='customer_profile')
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, default='ACTIVE')
    location = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    points = models.IntegerField(default=0)
    last_purchase = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Real World Solution: Walk-in / Child / No-Account handling
    is_registered = models.BooleanField(default=False, help_text="True if they have a system user account")
    is_minor = models.BooleanField(default=False, help_text="Flag for children/minors")
    parent_contact = models.CharField(max_length=20, blank=True, null=True, help_text="Parent contact info for minors")
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    
    # New fields for Kinyozi/Salon/Spa
    visit_count = models.IntegerField(default=0, help_text="Total number of visits")
    favorite_services = models.ManyToManyField(Service, blank=True, related_name='favorited_by')
    preferred_staff = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='preferred_customers')
    last_we_miss_you_sent = models.DateField(null=True, blank=True)
    service_notes = models.TextField(blank=True, help_text="Style preferences, allergies, special notes")
    photo = models.ImageField(upload_to='customer_photos/', null=True, blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Visit(models.Model):
    """Customer visit/appointment with services rendered"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('partial', 'Partially Paid'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='visits')
    services = models.ManyToManyField(Service)
    staff_member = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='visits')
    visit_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='paid')
    notes = models.TextField(blank=True)
    booking = models.ForeignKey('Booking', on_delete=models.SET_NULL, null=True, blank=True, related_name='visit_record')
    review_request_sent = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.customer.name} - {self.visit_date.strftime('%Y-%m-%d')}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
            
            
            # Inventory deduction is now handled via m2m_changed signal in signals.py
            # to ensure services are actually linked before deducting.

    def _deduct_inventory(self):
        """Deduct inventory for services in this visit"""
        for service in self.services.all():
            for consumption in service.product_consumption.all():
                product = consumption.product
                quantity_used = consumption.quantity
                
                # Check if enough stock (optional, or just go into negative)
                # We will go into negative to track usage even if stock is off, or just update.
                product.current_stock -= quantity_used
                product.save()
                
                # Create Log
                InventoryLog.objects.create(
                    tenant=self.tenant,
                    product=product,
                    change_quantity=-quantity_used,
                    reason='service_use',
                    notes=f"Used in Visit {self.id} for Service {service.name}"
                )


# Keep Sale model for backward compatibility
class Sale(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='sales')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.name} - {self.amount}"


class Reward(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=200)
    description = models.TextField()
    points_required = models.IntegerField()
    type = models.CharField(max_length=50) # discount, gift, cashback, free_service
    value = models.CharField(max_length=100)
    expiry_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    times_redeemed = models.IntegerField(default=0)
    
    # New fields for visit-based rewards
    visits_required = models.IntegerField(null=True, blank=True, help_text="Number of visits required (leave empty for points-only rewards)")
    applicable_services = models.ManyToManyField(Service, blank=True, related_name='rewards')

    def __str__(self):
        return self.name


class Booking(models.Model):
    """Customer appointment booking"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('no_show', 'No-Show'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='bookings')
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    staff_member = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    booking_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    reminder_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Parent booking on behalf of child
    booked_by_customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='booked_on_behalf')

    def __str__(self):
        return f"{self.customer.name} - {self.service.name} - {self.booking_date}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None or not Booking.objects.filter(pk=self.pk).exists()
        send_approval = False
        create_visit = False

        if not is_new:
            try:
                old_instance = Booking.objects.get(pk=self.pk)
                if old_instance.status != 'confirmed' and self.status == 'confirmed':
                    send_approval = True
                if old_instance.status != 'completed' and self.status == 'completed':
                    create_visit = True
            except Booking.DoesNotExist:
                # If the booking doesn't exist, treat it as new
                is_new = True
                if self.status == 'completed':
                    create_visit = True
                elif self.status == 'confirmed':
                    send_approval = True
        else:
            if self.status == 'completed':
                create_visit = True
            elif self.status == 'confirmed':
                send_approval = True
            
        super().save(*args, **kwargs)

        # All booking notifications are now handled by signals.py
        # This prevents duplicate notifications
        
        if create_visit:
            self._create_visit_from_booking()

    def _create_visit_from_booking(self):
        """Create a Visit record from this booking"""
        # Avoid circular imports if any
        from .models import Visit
        
        # Check if a visit already exists for this booking to prevent duplicates
        # We can use a simple heuristic or add a OneToOneField if we wanted strict linking
        # For now, we'll just create it.
        
        visit = Visit.objects.create(
            tenant=self.tenant,
            customer=self.customer,
            staff_member=self.staff_member,
            visit_date=timezone.now(), # Use current time for the actual visit record
            total_amount=self.service.price,
            payment_status='paid', # Assume paid if completed, or could be pending
            notes=f"Created from Booking ID {self.id}. {self.notes}"
        )
        visit.services.add(self.service)
        # Visit.save() handles updating customer points/visit count automatically via its own save method



class CustomerReward(models.Model):
    """Track rewards claimed by customers"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    STATUS_CHOICES = [
        ('pending', 'Pending Redemption'),
        ('redeemed', 'Redeemed/Used'),
        ('expired', 'Expired'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='customer_rewards')
    reward = models.ForeignKey(Reward, on_delete=models.CASCADE)
    date_claimed = models.DateTimeField(auto_now_add=True)
    date_redeemed = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_status = None
        if not is_new:
            old_status = CustomerReward.objects.get(pk=self.pk).status
            
        super().save(*args, **kwargs)
        
        if is_new:
            # Notification logic moved to signals.py
            pass
            
        if old_status != 'redeemed' and self.status == 'redeemed':
            # Notification logic moved to signals.py
            pass

    def __str__(self):
        return f"{self.customer.name} - {self.reward.name}"


class ContactMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    replied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} - {self.subject}"


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    REVIEWER_TYPES = [
        ('customer', 'Customer'),
        ('business_owner', 'Business Owner'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='business_reviews')
    visit = models.OneToOneField(Visit, on_delete=models.CASCADE, related_name='review', null=True, blank=True)
    rating = models.IntegerField(default=5) # 1-5 stars
    comment = models.TextField(blank=True)
    reviewer_type = models.CharField(max_length=20, choices=REVIEWER_TYPES, default='customer')
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        name = self.customer.name if self.customer else (self.user.get_full_name() or self.user.username if self.user else "Anonymous")
        return f"{name} ({self.reviewer_type}) - {self.rating} Stars"


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    NOTIFICATION_TYPES = [
        ('customer', 'Customer'),
        ('admin', 'Admin'),
        ('staff', 'Staff'),
    ]
    
    recipient_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    staff = models.ForeignKey(StaffMember, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} - {self.created_at}"

def create_notification(title, message, recipient_type, customer=None, user=None, staff=None, tenant=None, send_email=False):
    """Helper to create a notification and optionally send an email"""
    if not tenant:
        if user and hasattr(user, 'profile'):
            tenant = user.profile.tenant
        elif customer:
            tenant = customer.tenant
        elif staff:
            tenant = staff.tenant

    # Check tenant preferences if applicable
    if send_email and tenant:
        if recipient_type in ['admin', 'staff']:
            # Tenant/Staff preferences
            if "New Booking" in title and not tenant.email_tenant_new_booking:
                send_email = False
            elif "Booking Cancelled" in title and not tenant.email_tenant_booking_cancelled:
                send_email = False
            elif "Reschedule" in title and not tenant.email_tenant_reschedule_request:
                send_email = False
            elif "New Customer" in title and not tenant.notify_on_customer_signup:
                send_email = False
            elif "Payment" in title and not tenant.notify_on_payment:
                send_email = False
        elif recipient_type == 'customer':
            # Customer preferences
            if "Booking Received" in title and not tenant.email_cust_booking_received:
                send_email = False
            elif any(x in title for x in ["Booking Confirmed", "Booking Approved"]) and not tenant.email_cust_booking_approved:
                send_email = False
            elif "Booking Rejected" in title and not tenant.email_cust_booking_rejected:
                send_email = False
            elif "Booking Rescheduled" in title and not tenant.email_cust_booking_rescheduled:
                send_email = False
            elif "Booking Cancelled" in title and not tenant.email_cust_booking_cancelled:
                send_email = False
            elif "Reminder" in title and not tenant.email_cust_booking_reminder:
                send_email = False
            elif "No-Show" in title and not tenant.email_cust_booking_noshow:
                send_email = False
            elif any(x in title for x in ["Thank You", "Completed", "Thank You for Your Visit"]) and not tenant.email_cust_booking_completed:
                send_email = False

    notification = Notification.objects.create(
        tenant=tenant,
        title=title,
        message=message,
        recipient_type=recipient_type,
        customer=customer,
        user=user,
        staff=staff
    )

    # Send WebSocket update
    if tenant:
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'dashboard_{tenant.id}',
                {
                    'type': 'dashboard_update',
                    'message': {
                        'title': title,
                        'message': message,
                        'recipient_type': recipient_type,
                        'created_at': notification.created_at.isoformat()
                    }
                }
            )
        except Exception as e:
            print(f"Error sending WebSocket update: {e}")
    
    if send_email:
        recipient_email = None
        if recipient_type == 'customer' and customer:
            recipient_email = customer.email
        elif recipient_type == 'admin' and user:
            recipient_email = user.email
        elif recipient_type == 'staff' and staff:
            recipient_email = staff.email
        
        if recipient_email:
            import threading
            from django.conf import settings
            from django.core.mail import EmailMessage
            
            def send():
                try:
                    # Dynamic branding
                    from_email = settings.DEFAULT_FROM_EMAIL
                    reply_to = []
                    
                    if tenant:
                        # Branded as Tenant for customers, or platform-owned for tenants
                        if recipient_type == 'customer':
                            from_email = f"{tenant.email_from_name} <{settings.EMAIL_HOST_USER}>"
                            if tenant.email:
                                reply_to = [tenant.email]
                        else:
                            # For admins/staff, it comes from ClientPulse
                            from_email = f"ClientPulse <{settings.EMAIL_HOST_USER}>"
                    
                    email = EmailMessage(
                        subject=title,
                        body=message,
                        from_email=from_email,
                        to=[recipient_email],
                        reply_to=reply_to,
                    )
                    email.send(fail_silently=False)
                except Exception as e:
                    print(f"Error sending email: {e}")
            
            threading.Thread(target=send).start()
    
    return notification


class SubscriptionPlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100) # Starter, Professional, Enterprise
    price = models.DecimalField(max_digits=10, decimal_places=2)
    interval = models.CharField(max_length=20, default='month') # month, year
    description = models.TextField(blank=True)
    features = models.TextField(help_text="Comma-separated list of features")
    is_popular = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - KES {self.price}/{self.interval}"
    
    def get_features_list(self):
        return [f.strip() for f in self.features.split(',')]


class TenantSubscription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, default='active') # active, past_due, canceled
    start_date = models.DateField(auto_now_add=True)
    next_billing_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tenant.name} - {self.plan.name}"


class PaymentTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='pending') # paid, pending, failed
    reference_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    checkout_request_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    payment_method = models.CharField(max_length=50, default='M-Pesa')
    
    # Link to Booking or Visit
    booking = models.ForeignKey('Booking', on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    visit = models.ForeignKey('Visit', on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')

    def __str__(self):
        return f"{self.tenant.name} - {self.amount} - {self.status}"


class OTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    def __str__(self):
        return f"OTP for {self.user.username}: {self.code}"


class Expense(models.Model):
    """Operating Expenses (OPEX) like Rent, Electricity, etc."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='expenses')
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100) # Rent, Electricity, Marketing, Salaries, etc.
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    expense_date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.category}: {self.amount} ({self.expense_date})"

class GalleryImage(models.Model):
    """Business/Staff Portfolio Gallery"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='gallery_images')
    staff_member = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='portfolio_images')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, related_name='portfolio_images')
    image = models.ImageField(upload_to='portfolio/')
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or f"Gallery Image {self.id}"


# --- Proxy Models for Admin Dashboard Sections ---

class RewardsDashboard(Reward):
    class Meta:
        proxy = True
        verbose_name = 'Rewards Dashboard'
        verbose_name_plural = 'Rewards Dashboard'

class Reports(Visit):
    class Meta:
        proxy = True
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'

class Settings(Tenant):
    class Meta:
        proxy = True
        verbose_name = 'Settings'
        verbose_name_plural = 'Settings'

class MyNotification(Notification):
    class Meta:
        proxy = True
        verbose_name = 'My Notification'
        verbose_name_plural = 'My Notifications'

class CustomersDashboard(Customer):
    class Meta:
        proxy = True
        verbose_name = 'Customers Dashboard'
        verbose_name_plural = 'Customers Dashboard'
