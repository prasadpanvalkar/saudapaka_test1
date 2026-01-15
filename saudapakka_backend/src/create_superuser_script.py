import os
import django
import sys

# Add project root to path if needed, though manageable in docker
sys.path.append('/app')

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saudapakka.settings")
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

email = 'admin1@gmail.com'
password = 'admin1'

try:
    if not User.objects.filter(email=email).exists():
        # Passing arguments explicitly to avoid signature confusion
        User.objects.create_superuser(
            username=email,
            email=email,
            password=password,
            first_name='Super',
            last_name='Admin',
            phone_number='0000000000'
        )
        print("Superuser created successfully.")
    else:
        print("Superuser already exists.")
except Exception as e:
    print(f"Error creating superuser: {e}")
