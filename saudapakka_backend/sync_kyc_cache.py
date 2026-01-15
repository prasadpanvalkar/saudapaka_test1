"""
Migration script to add is_kyc_verified field to User model and sync existing KYC data.

This script:
1. Creates the is_kyc_verified field on the User model
2. Updates all existing users who have verified KYC to set is_kyc_verified=True

Run this after adding the field to the model:
python manage.py shell < sync_kyc_cache.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User, KYCVerification

print("Syncing KYC verification cache...")

# Update all users who have verified KYC
verified_kycs = KYCVerification.objects.filter(status='VERIFIED')
count = 0

for kyc in verified_kycs:
    user = kyc.user
    if not user.is_kyc_verified:
        user.is_kyc_verified = True
        user.save(update_fields=['is_kyc_verified'])
        count += 1
        print(f"✓ Updated {user.email}")

print(f"\n✅ Updated {count} users with verified KYC status")
print(f"Total verified KYC records: {verified_kycs.count()}")
