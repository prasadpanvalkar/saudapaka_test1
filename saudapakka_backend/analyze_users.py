from django.contrib.auth import get_user_model

User = get_user_model()

print("\n=== DETAILED USER ROLE ANALYSIS ===\n")

for user in User.objects.all().order_by('email'):
    print(f"📧 {user.email}")
    print(f"   Name: {user.first_name} {user.last_name}")
    print(f"   is_staff: {user.is_staff}")
    print(f"   is_superuser: {user.is_superuser}")
    print(f"   role_category: {user.role_category}")
    print(f"   is_active_seller: {user.is_active_seller}")
    print(f"   is_active_broker: {user.is_active_broker}")
    print()

print("\n=== ROLE COUNTS ===")
print(f"Total Users: {User.objects.count()}")
print(f"Admins (is_staff=True): {User.objects.filter(is_staff=True).count()}")
print(f"Buyers (role_category=BUYER, not staff): {User.objects.filter(role_category='BUYER', is_staff=False).count()}")
print(f"Sellers (role_category=SELLER, not staff): {User.objects.filter(role_category='SELLER', is_staff=False).count()}")
print(f"Builders (role_category=BUILDER, not staff): {User.objects.filter(role_category='BUILDER', is_staff=False).count()}")
print(f"Brokers (role_category=BROKER, not staff): {User.objects.filter(role_category='BROKER', is_staff=False).count()}")
print(f"Brokers (is_active_broker=True, not staff): {User.objects.filter(is_active_broker=True, is_staff=False).count()}")
print(f"Plotting Agencies (role_category=PLOTTING_AGENCY, not staff): {User.objects.filter(role_category='PLOTTING_AGENCY', is_staff=False).count()}")
