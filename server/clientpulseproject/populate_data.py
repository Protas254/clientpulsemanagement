import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clientpulseproject.settings')
django.setup()

from clientapp.models import Service, Reward, StaffMember, Tenant

def populate():
    print("Populating data...")
    
    # Ensure we have a tenant (optional, but good practice if multi-tenancy is enforced)
    # For now, we'll create global objects or assign to the first tenant if exists
    tenant = Tenant.objects.first()
    
    # --- Services ---
    services_data = [
        # Hair
        {'name': 'Men\'s Haircut', 'category': 'barber', 'price': 500, 'duration': 30, 'description': 'Standard men\'s haircut with clipper and scissors.'},
        {'name': 'Beard Trim', 'category': 'barber', 'price': 300, 'duration': 15, 'description': 'Professional beard shaping and trimming.'},
        {'name': 'Ladies\' Cut & Style', 'category': 'hair', 'price': 1500, 'duration': 60, 'description': 'Wash, cut, and blowdry styling.'},
        {'name': 'Braiding', 'category': 'hair', 'price': 2500, 'duration': 120, 'description': 'Complex braiding styles.'},
        
        # Spa
        {'name': 'Full Body Massage', 'category': 'spa', 'price': 3500, 'duration': 60, 'description': 'Relaxing Swedish massage.'},
        {'name': 'Deep Tissue Massage', 'category': 'spa', 'price': 4500, 'duration': 60, 'description': 'Therapeutic deep tissue massage.'},
        
        # Nails
        {'name': 'Manicure', 'category': 'nails', 'price': 1000, 'duration': 45, 'description': 'Classic manicure with polish.'},
        {'name': 'Pedicure', 'category': 'nails', 'price': 1500, 'duration': 60, 'description': 'Relaxing pedicure with foot scrub.'},
        
        # Facial
        {'name': 'Basic Facial', 'category': 'facial', 'price': 2000, 'duration': 45, 'description': 'Cleansing and moisturizing facial.'},
    ]
    
    for s_data in services_data:
        service, created = Service.objects.get_or_create(
            name=s_data['name'],
            defaults={
                'category': s_data['category'],
                'price': s_data['price'],
                'duration': s_data['duration'],
                'description': s_data['description'],
                'tenant': tenant
            }
        )
        if created:
            print(f"Created Service: {service.name}")
        else:
            print(f"Service already exists: {service.name}")

    # --- Rewards ---
    rewards_data = [
        {'name': 'Free Haircut', 'description': 'Get a free haircut after 10 visits', 'points_required': 0, 'visits_required': 10, 'type': 'free_service', 'value': '500'},
        {'name': '10% Off Massage', 'description': 'Redeem 500 points for a discount', 'points_required': 500, 'visits_required': 0, 'type': 'discount', 'value': '10'},
        {'name': 'Free Manicure', 'description': 'Redeem 1000 points', 'points_required': 1000, 'visits_required': 0, 'type': 'free_service', 'value': '1000'},
        {'name': 'Loyalty Cash KES 200', 'description': 'Convert points to cash discount', 'points_required': 200, 'visits_required': 0, 'type': 'cashback', 'value': '200'},
    ]
    
    for r_data in rewards_data:
        reward, created = Reward.objects.get_or_create(
            name=r_data['name'],
            defaults={
                'description': r_data['description'],
                'points_required': r_data['points_required'],
                'visits_required': r_data['visits_required'],
                'type': r_data['type'],
                'value': r_data['value'],
                'tenant': tenant,
                'status': 'active'
            }
        )
        if created:
            print(f"Created Reward: {reward.name}")
        else:
            print(f"Reward already exists: {reward.name}")

    # --- Staff ---
    staff_data = [
        {'name': 'Sarah Mwangi', 'phone': '0711223344'},
        {'name': 'John Kamau', 'phone': '0722334455'},
        {'name': 'Alice Ochieng', 'phone': '0733445566'},
        {'name': 'David Koech', 'phone': '0744556677'},
    ]
    
    for st_data in staff_data:
        staff, created = StaffMember.objects.get_or_create(
            name=st_data['name'],
            defaults={
                'phone': st_data['phone'],
                'tenant': tenant,
                'is_active': True
            }
        )
        if created:
            print(f"Created Staff: {staff.name}")
        else:
            print(f"Staff already exists: {staff.name}")

if __name__ == '__main__':
    populate()
