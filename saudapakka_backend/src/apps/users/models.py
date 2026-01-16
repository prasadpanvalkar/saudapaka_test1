import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # --- MANDATORY REGISTRATION FIELDS ---
    email = models.EmailField(unique=True, blank=False, null=False)
    first_name = models.CharField(max_length=150, blank=False, null=False)
    last_name = models.CharField(max_length=150, blank=False, null=False)
    phone_number = models.CharField(max_length=15, unique=True, blank=False, null=False)
    
    # Roles
    is_active_seller = models.BooleanField(default=False)
    is_active_broker = models.BooleanField(default=False)
    
    # KYC Status (cached for performance - updated when KYC is verified)
    is_kyc_verified = models.BooleanField(default=False)
    
    ROLE_CHOICES = [
        ('BUYER', 'Buyer'),
        ('SELLER', 'Seller'),
        ('BUILDER', 'Builder'),
        ('BROKER', 'Real Estate Agent'),
        ('PLOTTING_AGENCY', 'Plotting Company/Agency'),
    ]
    role_category = models.CharField(max_length=20, choices=ROLE_CHOICES, default='BUYER')
     
    # OTP Fields
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'phone_number']

    # Fix for clashing related names with standard Auth
    groups = models.ManyToManyField('auth.Group', related_name='custom_user_set', blank=True)
    user_permissions = models.ManyToManyField('auth.Permission', related_name='custom_user_set', blank=True)

    @property
    def full_name(self):
        """Standardizes name display for the frontend."""
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.full_name} ({self.email})"

class KYCVerification(models.Model):
    """Stores verified identity data from Real Sandbox API."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='kyc_data')
    request_id = models.CharField(max_length=100, blank=True, null=True) # entity_id from Sandbox
    full_name = models.CharField(max_length=255, blank=True, null=True)
    dob = models.CharField(max_length=20, blank=True, null=True)
    address_json = models.JSONField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=[
        ('INITIATED', 'Initiated'),
        ('VERIFIED', 'Verified'),
        ('FAILED', 'Failed')
    ], default='INITIATED')
    
    verified_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"KYC: {self.user.email} - {self.status}"

class BrokerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    services_offered = models.JSONField(default=list)
    experience_years = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)