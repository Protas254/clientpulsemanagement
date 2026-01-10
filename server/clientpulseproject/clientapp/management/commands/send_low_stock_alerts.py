from django.core.management.base import BaseCommand
from django.db.models import F
from clientapp.models import Product, Tenant, UserProfile, create_notification
from django.utils import timezone

class Command(BaseCommand):
    help = 'Sends low stock alerts to tenant admins'

    def handle(self, *args, **options):
        tenants = Tenant.objects.all()
        count = 0

        for tenant in tenants:
            low_stock_products = Product.objects.filter(
                tenant=tenant,
                is_active=True,
                current_stock__lte=F('reorder_level')
            )

            if low_stock_products.exists():
                # Build the shopping list message
                message = "The following products are running low and need restocking:\n\n"
                for p in low_stock_products:
                    message += f"- {p.name}: Current Stock: {p.current_stock} (Reorder Level: {p.reorder_level})\n"
                
                message += "\nPlease log in to your dashboard to manage your inventory."

                # Find tenant admins
                admins = UserProfile.objects.filter(tenant=tenant, role='tenant_admin')
                
                if admins.exists():
                    for admin_profile in admins:
                        create_notification(
                            title="Low Stock Alert (Shopping List)",
                            message=message,
                            recipient_type='admin',
                            user=admin_profile.user,
                            tenant=tenant,
                            send_email=True
                        )
                    self.stdout.write(self.style.SUCCESS(f"Sent low stock alerts for tenant: {tenant.name}"))
                    count += 1
                else:
                    self.stdout.write(self.style.WARNING(f"No admins found for tenant: {tenant.name}"))

        self.stdout.write(self.style.SUCCESS(f"Finished sending low stock alerts for {count} tenants."))
