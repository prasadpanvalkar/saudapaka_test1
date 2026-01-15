from django.contrib.auth import get_user_model

User = get_user_model()

print("\n=== FIXING INCONSISTENT USER DATA ===\n")

# Fix users where role_category doesn't match their active flags
fixed_count = 0

for user in User.objects.filter(is_staff=False):
    original_category = user.role_category
    needs_fix = False
    
    # Determine correct role_category based on flags
    if user.is_active_broker and user.role_category != 'BROKER':
        user.role_category = 'BROKER'
        needs_fix = True
    elif user.is_active_seller and user.role_category not in ['SELLER', 'BUILDER', 'PLOTTING_AGENCY']:
        # If they're a seller but don't have a specific category, default to SELLER
        user.role_category = 'SELLER'
        needs_fix = True
    
    if needs_fix:
        user.save()
        print(f"✅ Fixed {user.email}:")
        print(f"   Changed role_category: {original_category} → {user.role_category}")
        print(f"   is_active_seller: {user.is_active_seller}, is_active_broker: {user.is_active_broker}")
        print()
        fixed_count += 1

if fixed_count == 0:
    print("✅ No inconsistencies found - all data is correct!")
else:
    print(f"\n✅ Fixed {fixed_count} user(s)")

print("\n=== UPDATED ROLE COUNTS ===")
print(f"Admins: {User.objects.filter(is_staff=True).count()}")
print(f"Buyers: {User.objects.filter(role_category='BUYER', is_staff=False).count()}")
print(f"Sellers: {User.objects.filter(role_category='SELLER', is_staff=False).count()}")
print(f"Builders: {User.objects.filter(role_category='BUILDER', is_staff=False).count()}")
print(f"Brokers: {User.objects.filter(role_category='BROKER', is_staff=False).count()}")
print(f"Plotting Agencies: {User.objects.filter(role_category='PLOTTING_AGENCY', is_staff=False).count()}")
