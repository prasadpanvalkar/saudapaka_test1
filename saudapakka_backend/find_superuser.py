from django.contrib.auth import get_user_model

User = get_user_model()

print("\n=== Superuser Accounts ===")
superusers = User.objects.filter(is_superuser=True)

if superusers.exists():
    for user in superusers:
        print(f"Email: {user.email}")
        print(f"Name: {user.first_name} {user.last_name}")
        print(f"is_staff: {user.is_staff}")
        print(f"is_superuser: {user.is_superuser}")
        print()
else:
    print("No superuser accounts found!")
    print("\nAll staff accounts:")
    for user in User.objects.filter(is_staff=True):
        print(f"  - {user.email} (is_superuser: {user.is_superuser})")
