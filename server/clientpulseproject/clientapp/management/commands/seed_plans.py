from django.core.management.base import BaseCommand
from clientapp.models import SubscriptionPlan

class Command(BaseCommand):
    help = 'Seeds the database with subscription plans'

    def handle(self, *args, **kwargs):
        plans = [
            {
                'name': 'Starter',
                'price': 2500.00,
                'description': 'Perfect for solo stylists and small barbershops.',
                'features': 'Up to 30 clients, Basic loyalty program, Digital receipts, Email support',
                'is_popular': False
            },
            {
                'name': 'Professional',
                'price': 5000.00,
                'description': 'Ideal for growing salons with multiple staff members.',
                'features': '100 clients, 24/7 WhatsApp Support, Advanced loyalty rules, Staff management, M-Pesa integration, Priority support',
                'is_popular': True
            },
            {
                'name': 'Enterprise',
                'price': 12000.00,
                'description': 'For large spas and multi-location beauty businesses.',
                'features': 'Unlimited clients, 24/7 WhatsApp Support, Multiple locations, Custom branding, API access, Dedicated account manager, 24/7 Phone support',
                'is_popular': False
            }
        ]

        for plan_data in plans:
            plan, created = SubscriptionPlan.objects.get_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created plan: {plan.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Plan already exists: {plan.name}'))
