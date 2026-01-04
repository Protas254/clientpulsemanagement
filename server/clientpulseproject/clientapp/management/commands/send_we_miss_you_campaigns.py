from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from clientapp.models import Tenant, Customer, Notification
from django.core.mail import send_mail
from django.conf import settings

class Command(BaseCommand):
    help = 'Sends automated "We Miss You" campaigns to inactive customers'

    def handle(self, *args, **options):
        today = timezone.now().date()
        tenants = Tenant.objects.filter(auto_campaign_we_miss_you=True, status='active')
        
        processed_count = 0
        for tenant in tenants:
            self.stdout.write(f"Processing tenant: {tenant.name}")
            days_threshold = tenant.we_miss_you_days
            cutoff_date = today - timedelta(days=days_threshold)
            
            # Find customers who haven't visited since cutoff_date
            # and haven't received a campaign in the last 30 days (to avoid spamming)
            inactive_customers = Customer.objects.filter(
                tenant=tenant,
                last_purchase__lte=cutoff_date
            ).exclude(
                last_we_miss_you_sent__gt=today - timedelta(days=30)
            )
            
            for customer in inactive_customers:
                if not customer.email:
                    continue
                    
                self.stdout.write(f"  Sending campaign to: {customer.name} ({customer.email})")
                
                discount = tenant.we_miss_you_discount_pct
                subject = f"We miss you at {tenant.name}!"
                message = f"Hi {customer.name},\n\nIt's been a while since your last visit to {tenant.name}. We'd love to see you again!\n\nUse the code MISSYOU{discount} to get {discount}% off your next service.\n\nBook now: http://localhost:3000/portal\n\nBest regards,\nThe {tenant.name} Team"
                
                try:
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [customer.email],
                        fail_silently=False,
                    )
                    
                    # Create notification
                    Notification.objects.create(
                        recipient_type='customer',
                        customer=customer,
                        title="We miss you! Special offer inside",
                        message=f"Get {discount}% off your next visit with code MISSYOU{discount}"
                    )
                    
                    # Update last sent date
                    customer.last_we_miss_you_sent = today
                    customer.save()
                    processed_count += 1
                    
                except Exception as e:
                    self.stderr.write(f"    Failed to send to {customer.email}: {str(e)}")

        self.stdout.write(self.style.SUCCESS(f'Successfully processed {processed_count} "We Miss You" campaigns'))
