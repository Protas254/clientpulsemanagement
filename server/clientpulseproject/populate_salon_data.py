#!/usr/bin/env python
"""
Script to populate initial Kinyozi/Salon/Spa data
Run with: python3 populate_salon_data.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clientpulseproject.settings')
django.setup()

from clientapp.models import Service, StaffMember, Reward

def populate_services():
    """Create common salon/spa services"""
    services_data = [
        # Hair Services
        {'name': 'Haircut - Men', 'category': 'hair', 'price': 300, 'duration': 30, 'description': 'Standard men\'s haircut'},
        {'name': 'Haircut - Women', 'category': 'hair', 'price': 500, 'duration': 45, 'description': 'Women\'s haircut and styling'},
        {'name': 'Haircut - Kids', 'category': 'hair', 'price': 200, 'duration': 20, 'description': 'Children\'s haircut'},
        {'name': 'Shave', 'category': 'hair', 'price': 150, 'duration': 15, 'description': 'Clean shave'},
        {'name': 'Beard Trim', 'category': 'hair', 'price': 200, 'duration': 20, 'description': 'Beard grooming and styling'},
        {'name': 'Hair Wash', 'category': 'hair', 'price': 100, 'duration': 15, 'description': 'Hair washing and conditioning'},
        {'name': 'Braiding - Basic', 'category': 'hair', 'price': 800, 'duration': 120, 'description': 'Basic braiding styles'},
        {'name': 'Braiding - Complex', 'category': 'hair', 'price': 1500, 'duration': 180, 'description': 'Complex braiding styles'},
        {'name': 'Hair Treatment', 'category': 'hair', 'price': 1000, 'duration': 60, 'description': 'Deep conditioning treatment'},
        {'name': 'Hair Coloring', 'category': 'hair', 'price': 2000, 'duration': 90, 'description': 'Full hair coloring service'},
        
        # Spa & Massage
        {'name': 'Full Body Massage', 'category': 'spa', 'price': 3000, 'duration': 90, 'description': 'Relaxing full body massage'},
        {'name': 'Back Massage', 'category': 'spa', 'price': 1500, 'duration': 45, 'description': 'Back and shoulder massage'},
        {'name': 'Foot Massage', 'category': 'spa', 'price': 1000, 'duration': 30, 'description': 'Foot reflexology massage'},
        {'name': 'Hot Stone Massage', 'category': 'spa', 'price': 4000, 'duration': 90, 'description': 'Hot stone therapy'},
        {'name': 'Aromatherapy', 'category': 'spa', 'price': 3500, 'duration': 60, 'description': 'Aromatherapy session'},
        
        # Nail Services
        {'name': 'Manicure - Basic', 'category': 'nails', 'price': 500, 'duration': 30, 'description': 'Basic manicure'},
        {'name': 'Manicure - Gel', 'category': 'nails', 'price': 1000, 'duration': 45, 'description': 'Gel manicure'},
        {'name': 'Pedicure - Basic', 'category': 'nails', 'price': 600, 'duration': 30, 'description': 'Basic pedicure'},
        {'name': 'Pedicure - Spa', 'category': 'nails', 'price': 1200, 'duration': 60, 'description': 'Luxury spa pedicure'},
        {'name': 'Nail Art', 'category': 'nails', 'price': 800, 'duration': 30, 'description': 'Creative nail art'},
        
        # Facial & Beauty
        {'name': 'Facial - Basic', 'category': 'facial', 'price': 1000, 'duration': 45, 'description': 'Basic facial cleansing'},
        {'name': 'Facial - Deep Cleanse', 'category': 'facial', 'price': 1500, 'duration': 60, 'description': 'Deep pore cleansing facial'},
        {'name': 'Facial - Anti-Aging', 'category': 'facial', 'price': 2500, 'duration': 75, 'description': 'Anti-aging treatment'},
        {'name': 'Eyebrow Threading', 'category': 'facial', 'price': 200, 'duration': 15, 'description': 'Eyebrow shaping'},
        {'name': 'Makeup', 'category': 'facial', 'price': 2000, 'duration': 60, 'description': 'Professional makeup application'},
        
        # Other Services
        {'name': 'Bridal Package', 'category': 'other', 'price': 8000, 'duration': 240, 'description': 'Complete bridal beauty package'},
        {'name': 'Consultation', 'category': 'other', 'price': 0, 'duration': 15, 'description': 'Free beauty consultation'},
    ]
    
    created_count = 0
    for service_data in services_data:
        service, created = Service.objects.get_or_create(
            name=service_data['name'],
            defaults=service_data
        )
        if created:
            created_count += 1
            print(f"✓ Created service: {service.name}")
        else:
            print(f"- Service already exists: {service.name}")
    
    print(f"\nTotal services created: {created_count}/{len(services_data)}")


def populate_staff():
    """Create sample staff members"""
    staff_data = [
        {'name': 'James Mwangi', 'phone': '0712345678'},
        {'name': 'Mary Njeri', 'phone': '0723456789'},
        {'name': 'David Omondi', 'phone': '0734567890'},
        {'name': 'Grace Wanjiku', 'phone': '0745678901'},
    ]
    
    created_count = 0
    for staff_info in staff_data:
        staff, created = StaffMember.objects.get_or_create(
            phone=staff_info['phone'],
            defaults=staff_info
        )
        if created:
            created_count += 1
            print(f"✓ Created staff member: {staff.name}")
        else:
            print(f"- Staff member already exists: {staff.name}")
    
    print(f"\nTotal staff created: {created_count}/{len(staff_data)}")


def populate_sample_rewards():
    """Create sample loyalty rewards"""
    rewards_data = [
        {
            'name': '5 Visits = Free Haircut',
            'description': 'Get a free standard haircut after 5 visits',
            'points_required': 0,
            'visits_required': 5,
            'type': 'free_service',
            'value': 'Free Men\'s Haircut',
            'status': 'active'
        },
        {
            'name': '10 Visits = Free Massage',
            'description': 'Get a free back massage after 10 visits',
            'points_required': 0,
            'visits_required': 10,
            'type': 'free_service',
            'value': 'Free Back Massage',
            'status': 'active'
        },
        {
            'name': '1000 Points = KES 100 Discount',
            'description': 'Redeem 1000 points for KES 100 off any service',
            'points_required': 1000,
            'visits_required': None,
            'type': 'discount',
            'value': 'KES 100',
            'status': 'active'
        },
        {
            'name': '2500 Points = 20% Off',
            'description': 'Get 20% off on any service',
            'points_required': 2500,
            'visits_required': None,
            'type': 'discount',
            'value': '20%',
            'status': 'active'
        },
        {
            'name': 'Birthday Special',
            'description': 'Free service on your birthday month',
            'points_required': 0,
            'visits_required': 1,
            'type': 'free_service',
            'value': 'Any service up to KES 500',
            'status': 'active'
        },
    ]
    
    created_count = 0
    for reward_data in rewards_data:
        reward, created = Reward.objects.get_or_create(
            name=reward_data['name'],
            defaults=reward_data
        )
        if created:
            created_count += 1
            print(f"✓ Created reward: {reward.name}")
        else:
            print(f"- Reward already exists: {reward.name}")
    
    print(f"\nTotal rewards created: {created_count}/{len(rewards_data)}")


if __name__ == '__main__':
    print("=" * 60)
    print("  Populating Kinyozi/Salon/Spa Initial Data")
    print("=" * 60)
    
    print("\n📋 Creating Services...")
    populate_services()
    
    print("\n👥 Creating Staff Members...")
    populate_staff()
    
    print("\n🎁 Creating Sample Rewards...")
    populate_sample_rewards()
    
    print("\n" + "=" * 60)
    print("  ✅ Data population complete!")
    print("=" * 60)
    
    # Print summary
    print("\nCurrent Database Summary:")
    print(f"  Services: {Service.objects.count()}")
    print(f"  Staff Members: {StaffMember.objects.count()}")
    print(f"  Rewards: {Reward.objects.count()}")
    print()
