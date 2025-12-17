from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from clientapp.models import Booking
from django.core.mail import send_mail
from django.conf import settings

class Command(BaseCommand):
    help = 'Sends reminders to customers 30 minutes before their booking time'

    def handle(self, *args, **options):
        now = timezone.now()
        thirty_minutes_from_now = now + timedelta(minutes=30)
        
        # Define a window for the reminder (e.g., bookings starting in 25 to 35 minutes)
        start_window = thirty_minutes_from_now - timedelta(minutes=5)
        end_window = thirty_minutes_from_now + timedelta(minutes=5)
        
        bookings = Booking.objects.filter(
            status='confirmed',
            reminder_sent=False,
            booking_date__range=(start_window, end_window)
        )
        
        for booking in bookings:
            try:
                subject = 'Reminder: Your appointment is in 30 minutes'
                message = f"Hello {booking.customer.name},\n\nYour schedule will be ready in 30minutes time for your {booking.service.name} booking.\n\nBooking Details:\n- Service: {booking.service.name}\n- Time: {booking.booking_date.strftime('%H:%M')}\n\nWe look forward to seeing you!\n\nBest regards,\nClientPulse Team"
                
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [booking.customer.email],
                    fail_silently=False,
                )
                
                booking.reminder_sent = True
                booking.save()
                self.stdout.write(self.style.SUCCESS(f'Successfully sent reminder to {booking.customer.email} for booking {booking.id}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to send reminder for booking {booking.id}: {str(e)}'))
