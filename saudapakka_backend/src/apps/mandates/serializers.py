from rest_framework import serializers
from .models import Mandate
from apps.properties.serializers import PropertySerializer

class MandateSerializer(serializers.ModelSerializer):
    # 1. Expand property details using the renamed source 'property_item'
    property_details = PropertySerializer(source='property_item', read_only=True)
    
    # 2. Get names from the updated User model (first + last name)
    seller_name = serializers.SerializerMethodField()
    seller_role = serializers.SerializerMethodField()
    broker_name = serializers.SerializerMethodField()
    
    # 3. Add the helper countdown fields for the frontend
    days_remaining = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()

    class Meta:
        model = Mandate
        fields = [
            'id', 
            'property_item',    # Updated field name
            'property_details', 
            'seller', 
            'seller_name', 
            'seller_role',
            'broker', 
            'broker_name', 
            'deal_type', 
            'initiated_by', 
            'is_exclusive', 
            'commission_rate', 
            'fixed_amount', 
            'status', 
            'created_at', 
            'acceptance_expires_at', 
            'signed_at',
            'start_date', 
            'end_date', 
            'days_remaining',
            'is_expired',
            'seller_signature', 
            'broker_signature',
            'rejection_reason',
            'renewed_from',
            'seller_selfie',
            'broker_selfie',
            'mandate_number'
        ]
        read_only_fields = ['status', 'acceptance_expires_at', 'end_date', 'signed_at', 'seller']

    def get_seller_name(self, obj):
        if obj.seller:
            return f"{obj.seller.first_name} {obj.seller.last_name}".strip()
        return "Unknown Seller"

    def get_broker_name(self, obj):
        if obj.deal_type == 'WITH_PLATFORM':
            return "SaudaPakka (Platform)"
        if obj.broker:
            # Check if it's the Platform Admin
            if obj.broker.is_superuser:
                return "SaudaPakka (Platform)"
            return f"{obj.broker.first_name} {obj.broker.last_name}".strip()
        return "Not Assigned"
        
    def get_seller_role(self, obj):
        if obj.seller:
            cat = obj.seller.role_category
            if cat == 'PLOTTING_AGENCY':
                return "Plotting Agency"
            elif cat == 'BUILDER':
                return "Builder"
            return "Property Owner" # Default for Seller/Buyer
        return "Unknown"