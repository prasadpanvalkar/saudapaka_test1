import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.conf import settings

def get_acceptance_expiry():
    return timezone.now() + timedelta(days=7)

class Mandate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # RENAMED from 'property' to 'property_item' to avoid conflict with @property decorator
    property_item = models.ForeignKey(
        'properties.Property', 
        related_name='mandates', 
        on_delete=models.CASCADE
    )
    
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='seller_mandates', on_delete=models.CASCADE)
    broker = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='broker_mandates', null=True, blank=True, on_delete=models.SET_NULL)
    
    DEAL_TYPES = [('WITH_BROKER', 'With Broker'), ('WITH_PLATFORM', 'With Platform')]
    deal_type = models.CharField(max_length=20, choices=DEAL_TYPES)
    initiated_by = models.CharField(max_length=10, choices=[('SELLER', 'Seller'), ('BROKER', 'Broker')])
    is_exclusive = models.BooleanField(default=True)

    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    fixed_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    STATUS_CHOICES = [
        ('PENDING', 'Pending Signature'),
        ('ACTIVE', 'Active'),
        ('REJECTED', 'Rejected'),
        ('EXPIRED', 'Expired'),
        ('TERMINATED', 'Terminated Early'),
        ('TERMINATED_BY_USER', 'Terminated by User')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    created_at = models.DateTimeField(auto_now_add=True)
    acceptance_expires_at = models.DateTimeField(default=get_acceptance_expiry)
    signed_at = models.DateTimeField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    seller_signature = models.ImageField(upload_to='signatures/sellers/', null=True, blank=True)
    broker_signature = models.ImageField(upload_to='signatures/brokers/', null=True, blank=True)
    
    # Selfie Verification
    seller_selfie = models.ImageField(upload_to='selfies/sellers/', null=True, blank=True)
    broker_selfie = models.ImageField(upload_to='selfies/brokers/', null=True, blank=True)
    
    # New fields for mandate upgrade
    rejection_reason = models.TextField(null=True, blank=True)
    renewed_from = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='renewals')
    is_near_expiry_notified = models.BooleanField(default=False)
    
    mandate_number = models.CharField(max_length=20, blank=True, null=True, unique=True)
    
    @property
    def is_expired(self):
        if self.status == 'ACTIVE' and self.end_date:
            return timezone.now().date() > self.end_date
        return False

    @property
    def days_remaining(self):
        if self.status == 'ACTIVE' and self.end_date:
            delta = self.end_date - timezone.now().date()
            return max(0, delta.days)
        return 0

    def generate_mandate_number(self):
        # Format: DDMMYY(Init2)x(Accept2)
        # Example: 140126QAxSB
        
        # 1. Date (Created At or Now)
        date_str = (self.created_at or timezone.now()).strftime('%d%m%y')
        
        # 2. Initiator
        initiator_name = "XX"
        acceptor_name = "XX"
        
        if self.initiated_by == 'SELLER' and self.seller:
            initiator_name = (self.seller.first_name or self.seller.email or "SE")[:2].upper()
            if self.broker:
                acceptor_name = (self.broker.first_name or self.broker.email or "BR")[:2].upper()
            else:
                acceptor_name = "PE" # Pending
                
        elif self.initiated_by == 'BROKER' and self.broker:
            initiator_name = (self.broker.first_name or self.broker.email or "BR")[:2].upper()
            if self.seller:
                acceptor_name = (self.seller.first_name or self.seller.email or "SE")[:2].upper()
            else:
                acceptor_name = "PE"
        
        return f"{date_str}{initiator_name}x{acceptor_name}"

    def save(self, *args, **kwargs):
        if self.status == 'ACTIVE' and not self.signed_at:
            self.signed_at = timezone.now()
            if not self.start_date:
                self.start_date = timezone.now().date()

        if self.status == 'ACTIVE' and self.start_date and not self.end_date:
            self.end_date = self.start_date + timedelta(days=90)
            
        # Generate Mandate Number
        new_number = self.generate_mandate_number()
        # Only update if it changed or if it's new, but careful about uniqueness?
        # The user wants it to reflect the names, so it SHOULD update if names/acceptor change.
        # But ID usually shouldn't change. However, for "Pending" -> "Accepted", it makes sense to update "PE" to "SB".
        self.mandate_number = new_number
            
        super().save(*args, **kwargs)

    def __str__(self):
        # Updated to use property_item
        return f"Mandate: {self.mandate_number or self.id} - {self.status}"