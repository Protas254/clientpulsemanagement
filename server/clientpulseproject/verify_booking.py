import os
import django
import sys
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django environment
sys.path.append('/home/junior/Desktop/Dev Section/ClientPulse/client-connect-pro-37/server/clientpulseproject')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clientpulseproject.settings')
django.setup()

from clientapp.models import Customer, Service, StaffMember, Booking, Visit

def verify_booking_logic():
    print("Starting Booking Verification...")

    # 1. Create Test Data
    print("Creating test data...")
    customer, _ = Customer.objects.get_or_create(
        email="test_booking@example.com",
        defaults={
            "name": "Test Booking Customer",
            "phone": "1234567890",
            "status": "active"
        }
    )
    
    service, _ = Service.objects.get_or_create(
        name="Test Service",
        defaults={
            "price": 1000.00,
            "duration": 60,
            "category": "hair"
        }
    )
    
    staff, _ = StaffMember.objects.get_or_create(
        name="Test Staff",
        defaults={
            "phone": "0987654321"
        }
    )

    # 2. Create Booking
    print("Creating booking...")
    booking_date = timezone.now() + timedelta(days=1)
    booking = Booking.objects.create(
        customer=customer,
        service=service,
        staff_member=staff,
        booking_date=booking_date,
        status='pending',
        notes="Test booking"
    )
    
    print(f"Booking created: ID {booking.id}, Status: {booking.status}")

    # 3. Verify Booking exists
    if not Booking.objects.filter(id=booking.id).exists():
        print("FAIL: Booking not saved to database.")
        return

    # 4. Update Status to Completed
    print("Updating booking status to completed...")
    booking.status = 'completed'
    booking.save()
    
    # 5. Check if Visit was created (Expected to fail initially)
    print("Checking for Visit creation...")
    # We look for a visit for this customer, with this service, around this time
    # Note: Since we just updated it, the visit date should be roughly now or the booking date depending on implementation
    # Let's check if ANY visit exists for this customer created in the last few seconds
    
    recent_visit = Visit.objects.filter(
        customer=customer,
        services=service,
        visit_date__gte=timezone.now() - timedelta(seconds=10)
    ).first()
    
    # Note: Visit model has visit_date (datetime) but no created_at field in the definition I saw earlier?
    # Let's check the model definition again.
    # Visit model: visit_date = models.DateTimeField(auto_now_add=True)
    # So visit_date is effectively created_at
    
    recent_visit = Visit.objects.filter(
        customer=customer,
        services=service,
        visit_date__gte=timezone.now() - timedelta(seconds=10)
    ).first()

    if recent_visit:
        print(f"SUCCESS: Visit created automatically! ID: {recent_visit.id}")
        
        # Refresh customer to check points
        customer.refresh_from_db()
        print(f"Customer Points: {customer.points}")
        if customer.points >= 1000:
            print("SUCCESS: Points added correctly.")
        else:
            print("FAIL: Points NOT added.")
    else:
        print("INFO: Visit NOT created automatically (Expected behavior before fix).")

    # Cleanup
    print("Cleaning up...")
    booking.delete()
    if recent_visit:
        recent_visit.delete()
    # Don't delete customer/service/staff to avoid breaking other things if they existed before
    if customer.email == "test_booking@example.com":
        customer.delete()
    if service.name == "Test Service":
        service.delete()
    if staff.name == "Test Staff":
        staff.delete()

if __name__ == "__main__":
    verify_booking_logic()
