from django.db import models
from django.utils import timezone

# Create your models here.

# Create your models here.

class StaffMember(models.Model):
    """Staff members (barbers, stylists, therapists) who provide services"""
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    joined_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class Service(models.Model):
    """Services offered (haircut, shave, braiding, massage, facial, etc.)"""
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

    def __str__(self):
        return self.name


class Visit(models.Model):
    """Customer visit/appointment with services rendered"""
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
            self.customer.points += int(self.total_amount)
            self.customer.last_purchase = self.visit_date.date()
            self.customer.save()


# Keep Sale model for backward compatibility
class Sale(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='sales')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.name} - {self.amount}"


class Reward(models.Model):
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
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.name} - {self.service.name} - {self.booking_date}"

    def save(self, *args, **kwargs):
        # Check if status changed to completed
        if self.pk:
            old_instance = Booking.objects.get(pk=self.pk)
            if old_instance.status != 'completed' and self.status == 'completed':
                self._create_visit_from_booking()
        elif self.status == 'completed':
            # New booking created as completed (unlikely but possible)
            self._create_visit_from_booking()
            
        super().save(*args, **kwargs)

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


class CustomerReward(models.Model):
    """Track rewards claimed by customers"""
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
    
    def __str__(self):
        return f"{self.customer.name} - {self.reward.name}"
