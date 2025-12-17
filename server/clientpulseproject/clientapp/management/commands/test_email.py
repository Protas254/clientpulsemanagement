from django.core.management.base import BaseCommand
from django.core.mail import send_mail

class Command(BaseCommand):
    help = 'Send a test email'

    def handle(self, *args, **options):
        try:
            send_mail(
                'Test Email',
                'This is a test email from Django.',
                'protasjunior254@gmail.com',
                ['protasjunior254@gmail.com'],
                fail_silently=False,
            )
            self.stdout.write(self.style.SUCCESS('Test email sent successfully!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to send email: {e}'))