import smtplib
from django.conf import settings
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clientpulseproject.settings')
django.setup()

def test_smtp():
    print(f"Testing SMTP connection to {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
    print(f"User: {settings.EMAIL_HOST_USER}")
    print(f"SSL: {settings.EMAIL_USE_SSL}, TLS: {settings.EMAIL_USE_TLS}")
    
    try:
        if settings.EMAIL_USE_SSL:
            server = smtplib.SMTP_SSL(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=10)
            if settings.EMAIL_USE_TLS:
                server.starttls()
        
        server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        print("Login successful!")
        server.quit()
    except Exception as e:
        print(f"SMTP Error: {e}")

if __name__ == "__main__":
    test_smtp()
