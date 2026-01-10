from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from clientapp.models import Booking, create_notification
from clientapp.utils import format_datetime_safely

class Command(BaseCommand):
    help = 'Sends reminders to customers (24-hour and 30-minute)'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # --- 1. HANDLE 24-HOUR REMINDERS ---
        # Look for bookings starting in 23-25 hours from now
        start_24h = now + timedelta(hours=23, minutes=50)
        end_24h = now + timedelta(hours=24, minutes=10)
        
        bookings_24h = Booking.objects.filter(
            status='confirmed',
            reminder_24h_sent=False,
            booking_date__range=(start_24h, end_24h)
        )
        
        for booking in bookings_24h:
            try:
                date_str = format_datetime_safely(booking.booking_date, '%A, %b %d')
                time_str = format_datetime_safely(booking.booking_date, '%H:%M')
                
                create_notification(
                    title="24-Hour Reminder",
                    message=f"Hello {booking.customer.name}, this is a reminder of your appointment for {booking.service.name} tomorrow, {date_str} at {time_str}. We look forward to seeing you!",
                    recipient_type='customer',
                    customer=booking.customer,
                    tenant=booking.tenant,
                    send_email=True
                )
                
                booking.reminder_24h_sent = True
                booking.save(update_fields=['reminder_24h_sent'])
                self.stdout.write(self.style.SUCCESS(f'Sent 24h reminder to {booking.customer.name}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed 24h reminder: {str(e)}'))

        # --- 2. HANDLE 30-MINUTE REMINDERS ---
        # Look for bookings starting in 25-35 minutes from now
        start_30m = now + timedelta(minutes=25)
        end_30m = now + timedelta(minutes=35)
        
        bookings_30m = Booking.objects.filter(
            status='confirmed',
            reminder_sent=False,
            booking_date__range=(start_30m, end_30m)
        )
        
        for booking in bookings_30m:
            try:
                time_str = format_datetime_safely(booking.booking_date, '%H:%M')
                create_notification(
                    title="Booking Reminder",
                    message=f"Hello {booking.customer.name}, your {booking.service.name} appointment is in 30 minutes ({time_str}). We are ready for you!",
                    recipient_type='customer',
                    customer=booking.customer,
                    tenant=booking.tenant,
                    send_email=True
                )
                
                booking.reminder_sent = True
                booking.save(update_fields=['reminder_sent'])
                self.stdout.write(self.style.SUCCESS(f'Sent 30m reminder to {booking.customer.name}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed 30m reminder: {str(e)}'))
