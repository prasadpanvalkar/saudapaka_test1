# Generated migration for adding is_kyc_verified field to User model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),  # Update this to match your latest migration
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_kyc_verified',
            field=models.BooleanField(default=False),
        ),
    ]
