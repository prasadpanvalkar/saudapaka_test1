from django.contrib.auth import get_user_model

User = get_user_model()

# List all users to find the right one
print("\n=== All Users in Database ===")
for u in User.objects.all():
    print(f"Email: {u.email}")
    print(f"  - Name: {u.first_name} {u.last_name}")
    print(f"  - Role: {u.role_category}")
    print(f"  - is_staff: {u.is_staff}")
    print(f"  - is_active_seller: {u.is_active_seller}")
    print()

# Find users with is_staff=True
staff_users = User.objects.filter(is_staff=True)
if staff_users.exists():
    print("\n=== Fixing Staff Users ===")
    for user in staff_users:
        print(f"Fixing: {user.email}")
        
        # Keep their current role_category if they have one
        if not user.role_category or user.role_category == 'BUYER':
            user.role_category = 'BUILDER'
        
        # Remove staff privileges
        user.is_staff = False
        user.is_superuser = False
        
        # Set appropriate permissions based on role
        if user.role_category in ['SELLER', 'BUILDER', 'PLOTTING_AGENCY']:
            user.is_active_seller = True
            user.is_active_broker = False
        elif user.role_category == 'BROKER':
            user.is_active_broker = True
            user.is_active_seller = False
        
        user.save()
        print(f"  ✅ Fixed! New role: {user.role_category}, is_staff: {user.is_staff}")
else:
    print("\n✅ No staff users found that need fixing.")

print("\n=== Done ===")
