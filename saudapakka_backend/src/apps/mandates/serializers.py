from rest_framework import serializers
from .models import Mandate
from apps.properties.serializers import PropertySerializer

class MandateSerializer(serializers.ModelSerializer):
    # Expand property details automatically
    property_details = PropertySerializer(source='property', read_only=True)
    seller_name = serializers.ReadOnlyField(source='seller.full_name')
    broker_name = serializers.ReadOnlyField(source='broker.full_name')

    class Meta:
        model = Mandate
        fields = [
            'id', 'property', 'property_details', 'seller', 'seller_name', 
            'broker', 'broker_name', 'deal_type', 'initiated_by', 
            'is_exclusive', 'commission_rate', 'fixed_amount', 
            'status', 'created_at', 'acceptance_expires_at', 
            'start_date', 'end_date', 'seller_signature', 'broker_signature'
        ]
        read_only_fields = ['status', 'acceptance_expires_at', 'end_date']