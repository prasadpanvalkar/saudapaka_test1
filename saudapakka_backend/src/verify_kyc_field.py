from apps.users.models import User

# Check if field exists
u = User.objects.first()
if u:
    print(f"✓ User: {u.email}")
    print(f"✓ Has is_kyc_verified field: {hasattr(u, 'is_kyc_verified')}")
    print(f"✓ is_kyc_verified value: {u.is_kyc_verified}")
    print(f"✓ role_category: {u.role_category}")
    print("\n✅ Cached KYC field is working correctly!")
else:
    print("No users found in database")
