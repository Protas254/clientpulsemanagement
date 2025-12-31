from django.db import models
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth.models import User

# Create your models here.

# Create your models here.

class Tenant(models.Model):
    name = models.CharField(max_length=200)
    business_type = models.CharField(max_length=50) # Kinyozi, Salon, Spa
    city = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=False) # Approved or not
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    def __str__(self):
        return self.name

class UserProfile(models.Model):
    """Extra profile information for system users (admins, staff)"""
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
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_profile')
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    joined_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class Service(models.Model):
    """Services offered (haircut, shave, braiding, massage, facial, etc.)"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    CATEGORY_CHOICES = [
        ('hair', 'Hair Services'),
        ('spa', 'Spa & Massage'),
        ('nails', 'Nail Services'),
        ('facial', 'Facial & Beauty'),
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


class Customer(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='customer_profile')
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    status = models.CharField(max_length=20, default='ACTIVE')
    location = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    points = models.IntegerField(default=0)
    last_purchase = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # New fields for Kinyozi/Salon/Spa
    visit_count = models.IntegerField(default=0, help_text="Total number of visits")
    favorite_services = models.ManyToManyField(Service, blank=True, related_name='favorited_by')
    preferred_staff = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='preferred_customers')
    service_notes = models.TextField(blank=True, help_text="Style preferences, allergies, special notes")
    photo = models.ImageField(upload_to='customer_photos/', null=True, blank=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            # Notification: New Customer (Admin)
            for admin in User.objects.filter(is_superuser=True):
                create_notification(
                    title="New Customer Registered",
                    message=f"New customer registered: {self.name}.",
                    recipient_type='admin',
                    user=admin
                )

    def __str__(self):
        return self.name


class Visit(models.Model):
    """Customer visit/appointment with services rendered"""
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
    
    def __str__(self):
        return f"{self.customer.name} - {self.visit_date.strftime('%Y-%m-%d')}"
    
    def save(self, *args, **kwargs):
        """Auto-increment customer visit count when creating new visit"""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.customer.visit_count += 1
            # Add points: 1 point per currency unit
            points_earned = int(self.total_amount)
            self.customer.points += points_earned
            self.customer.last_purchase = self.visit_date.date()
            self.customer.save()
            
            # Notification: Points Earned
            create_notification(
                title="Points Earned",
                message=f"You earned {points_earned} points today. Total points: {self.customer.points}.",
                recipient_type='customer',
                customer=self.customer
            )


# Keep Sale model for backward compatibility
class Sale(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='sales')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.name} - {self.amount}"


class Reward(models.Model):
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
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='bookings')
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    staff_member = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    booking_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    reminder_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.name} - {self.service.name} - {self.booking_date}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        send_approval = False
        create_visit = False

        if not is_new:
            old_instance = Booking.objects.get(pk=self.pk)
            if old_instance.status != 'confirmed' and self.status == 'confirmed':
                send_approval = True
            if old_instance.status != 'completed' and self.status == 'completed':
                create_visit = True
        else:
            if self.status == 'completed':
                create_visit = True
            elif self.status == 'confirmed':
                send_approval = True
            
        super().save(*args, **kwargs)

        if is_new:
            # Notification: New Booking (Admin & Staff)
            # Notify all superusers
            for admin in User.objects.filter(is_superuser=True):
                create_notification(
                    title="New Booking",
                    message=f"New booking from {self.customer.name} for {self.service.name}.",
                    recipient_type='admin',
                    user=admin
                )
            
            if self.staff_member:
                create_notification(
                    title="New Appointment Assigned",
                    message=f"Upcoming appointment: {self.customer.name} - {self.service.name} - {self.booking_date.strftime('%H:%M')}.",
                    recipient_type='staff',
                    staff=self.staff_member
                )

        if send_approval:
            # Notification: Appointment Confirmation
            create_notification(
                title="Appointment Confirmation",
                message=f"Hello {self.customer.name}, your {self.service.name} appointment is confirmed for {self.booking_date.strftime('%Y-%m-%d at %H:%M')}.",
                recipient_type='customer',
                customer=self.customer
            )
            self._send_approval_email()
        
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
            customer=self.customer,
            staff_member=self.staff_member,
            visit_date=timezone.now(), # Use current time for the actual visit record
            total_amount=self.service.price,
            payment_status='paid', # Assume paid if completed, or could be pending
            notes=f"Created from Booking ID {self.id}. {self.notes}"
        )
        visit.services.add(self.service)
        # Visit.save() handles updating customer points/visit count automatically via its own save method

    def _send_approval_email(self):
        import threading
        from django.conf import settings
        if not self.customer.email:
            return

        subject = 'Your Booking Has Been Approved'
        message = f'''Dear {self.customer.name},

Your booking has been approved!

Booking Details:
- Service: {self.service.name}
- Date & Time: {self.booking_date.strftime('%Y-%m-%d %H:%M')}
- Staff Member: {self.staff_member.name if self.staff_member else 'TBA'}

Thank you for choosing our service.

Best regards,
ClientPulse Team'''

        def send():
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [self.customer.email, settings.DEFAULT_FROM_EMAIL],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Error sending approval email: {e}")

        threading.Thread(target=send).start()


class CustomerReward(models.Model):
    """Track rewards claimed by customers"""
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
            # Notification: Reward Unlocked
            create_notification(
                title="Reward Unlocked",
                message=f"Congratulations! You've earned a {self.reward.name}. Show this message to redeem.",
                recipient_type='customer',
                customer=self.customer
            )
            
        if old_status != 'redeemed' and self.status == 'redeemed':
            # Notification: Reward Redeemed (Admin)
            for admin in User.objects.filter(is_superuser=True):
                create_notification(
                    title="Reward Redeemed",
                    message=f"A reward has been redeemed by {self.customer.name} - {self.reward.name}.",
                    recipient_type='admin',
                    user=admin
                )

    def __str__(self):
        return f"{self.customer.name} - {self.reward.name}"


class ContactMessage(models.Model):
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


class Notification(models.Model):
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

def create_notification(title, message, recipient_type, customer=None, user=None, staff=None, send_email=False):
    """Helper to create a notification and optionally send an email"""
    notification = Notification.objects.create(
        title=title,
        message=message,
        recipient_type=recipient_type,
        customer=customer,
        user=user,
        staff=staff
    )
    
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
            
            def send():
                try:
                    send_mail(
                        title,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [recipient_email],
                        fail_silently=True,
                    )
                except Exception as e:
                    print(f"Error sending email: {e}")
            
            threading.Thread(target=send).start()
    
    return notification


class SubscriptionPlan(models.Model):
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
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, default='active') # active, past_due, canceled
    start_date = models.DateField(auto_now_add=True)
    next_billing_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tenant.name} - {self.plan.name}"


class PaymentTransaction(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='pending') # paid, pending, failed
    reference_number = models.CharField(max_length=100, unique=True)
    payment_method = models.CharField(max_length=50, default='M-Pesa')

    def __str__(self):
        return f"{self.tenant.name} - {self.amount} - {self.status}"


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







