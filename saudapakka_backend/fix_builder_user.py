# Fix Builder Test User - Remove is_staff flag
# Run this in Django shell: python manage.py shell < fix_builder_user.py

from django.contrib.auth import get_user_model

User = get_user_model()

# Find the builder test user
try:
    user = User.objects.get(email="builder.test@example.com")  # Replace with your actual email
    print(f"Found user: {user.email}")
    print(f"Current state: is_staff={user.is_staff}, role_category={user.role_category}")
    
    # Fix the user
    user.is_staff = False
    user.is_superuser = False
    user.role_category = 'BUILDER'
    user.is_active_seller = True  # Builder should have seller permissions
    user.is_active_broker = False
    user.save()
    
    print(f"✅ Fixed! New state: is_staff={user.is_staff}, role_category={user.role_category}")
    
except User.DoesNotExist:
    print("❌ User not found. Please update the email in the script.")
    print("\nAll users in database:")
    for u in User.objects.all():
        print(f"  - {u.email} (role: {u.role_category}, staff: {u.is_staff})")
