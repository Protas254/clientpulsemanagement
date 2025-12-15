#!/usr/bin/env python
"""
Script to clear all authentication tokens from the database.
This forces all users to log in again with fresh, valid tokens.
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clientpulseproject.settings')
django.setup()

# Import the Token model
from rest_framework.authtoken.models import Token

def clear_all_tokens():
    """Delete all authentication tokens from the database."""
    count = Token.objects.all().count()
    Token.objects.all().delete()
    print(f"✓ Cleared {count} authentication token(s)")
    print("All users must now log in again to get new valid tokens.")

if __name__ == '__main__':
    clear_all_tokens()
