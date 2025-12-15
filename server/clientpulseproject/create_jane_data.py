#!/usr/bin/env python
"""
Script to create sample purchase data for Jane Atieno.
This will create purchase history and update her points balance.
"""
import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clientpulseproject.settings')
django.setup()

from clientapp.models import Customer, Sale

def create_sample_data_for_jane():
    """Create sample purchases for Jane Atieno"""
    
    # Find Jane
    jane = Customer.objects.filter(name__icontains='Jane').first()
    
    if not jane:
        print("❌ Jane Atieno not found in database")
        return
    
    print(f"✓ Found customer: {jane.name}")
    
    # Delete existing sales for Jane (if any)
    existing_sales = Sale.objects.filter(customer=jane)
    if existing_sales.exists():
        count = existing_sales.count()
        existing_sales.delete()
        print(f"✓ Deleted {count} existing sale(s)")
    
    # Create sample purchases
    purchases = [
        {
            'amount': Decimal('245.00'),
            'description': 'Premium Package',
            'days_ago': 9
        },
        {
            'amount': Decimal('180.00'),
            'description': 'Monthly Service',
            'days_ago': 25
        },
        {
            'amount': Decimal('320.00'),
            'description': 'Starter Kit',  
            'days_ago': 42
        },
        {
            'amount': Decimal('155.00'),
            'description': 'Product Bundle',
            'days_ago': 58
        }
    ]
    
    total_points = 0
    created_sales = []
    
    for purchase in purchases:
        sale = Sale.objects.create(
            customer=jane,
            amount=purchase['amount'],
            description=purchase['description']
        )
        # Manually set the date to past dates for realistic history
        sale.date = datetime.now() - timedelta(days=purchase['days_ago'])
        sale.save()
        
        # Points: 1 point per currency unit
        points = int(purchase['amount'])
        total_points += points
        created_sales.append(sale)
        
        print(f"✓ Created sale: {purchase['description']} - ${purchase['amount']} (+{points} points)")
    
    # Update Jane's points and last purchase
    jane.points = total_points
    jane.last_purchase = max(sale.date for sale in created_sales).date()
    jane.save()
    
    print(f"\n✓ Updated Jane's profile:")
    print(f"  - Total points: {jane.points}")
    print(f"  - Last purchase: {jane.last_purchase}")
    print(f"  - Total sales: {len(created_sales)}")
    print(f"  - Total spent: ${sum(float(s.amount) for s in created_sales):.2f}")
    print(f"\n✓ Jane's data is now ready to display in the customer portal!")

if __name__ == '__main__':
    create_sample_data_for_jane()
