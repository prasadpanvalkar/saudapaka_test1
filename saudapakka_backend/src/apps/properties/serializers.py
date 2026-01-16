from rest_framework import serializers
from .models import Property, PropertyImage, PropertyFloorPlan
from apps.users.serializers import UserSerializer, PublicUserSerializer

class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'is_thumbnail']

class PropertyFloorPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyFloorPlan
        fields = ['id', 'image', 'floor_number', 'floor_name', 'order', 'created_at']

class PropertySerializer(serializers.ModelSerializer):
    # --- Nested Representations ---
    images = PropertyImageSerializer(many=True, read_only=True)
    floor_plans = PropertyFloorPlanSerializer(many=True, read_only=True)
    owner_details = PublicUserSerializer(source='owner', read_only=True)
    
    # --- Human Readable Choice Labels (For Frontend UI) ---
    property_type_display = serializers.CharField(source='get_property_type_display', read_only=True)
    furnishing_status_display = serializers.CharField(source='get_furnishing_status_display', read_only=True)
    availability_status_display = serializers.CharField(source='get_availability_status_display', read_only=True)
    listed_by_display = serializers.CharField(source='get_listed_by_display', read_only=True)
    facing_display = serializers.CharField(source='get_facing_display', read_only=True)
    sub_type_display = serializers.CharField(source='get_sub_type_display', read_only=True)
    
    # --- Computed Fields ---
    has_7_12 = serializers.SerializerMethodField()
    has_mojani = serializers.SerializerMethodField()
    has_active_mandate = serializers.SerializerMethodField()
    active_mandate_id = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            # Basic & System
            'id', 'owner', 'owner_details', 'title', 'description', 'listing_type', 'project_name', 'property_type', 
            'property_type_display', 'sub_type', 'sub_type_display', 'verification_status', 'created_at',

            # Configuration
            'bhk_config', 'bathrooms', 'balconies', 'furnishing_status', 
            'furnishing_status_display',

            # Pricing & Area
            'total_price', 'price_per_sqft', 'maintenance_charges', 
            'maintenance_interval', 'super_builtup_area', 'carpet_area', 'plot_area',

            # Location
            'address_line', 'locality', 'city', 'pincode', 'latitude', 
            'longitude', 'landmarks',

            # Building details
            'specific_floor', 'total_floors', 'facing', 'facing_display', 
            'availability_status', 'availability_status_display', 
            'possession_date', 'age_of_construction',

            # Amenities (Boolean list)
            'has_power_backup', 'has_lift', 'has_swimming_pool', 'has_club_house',
            'has_gym', 'has_park', 'has_reserved_parking', 'has_security',
            'is_vastu_compliant', 'has_intercom', 'has_piped_gas', 'has_wifi',

            # Media & Contact
            'images', 'video_url', 'floor_plan', 'floor_plans', 'whatsapp_number', 
            'listed_by', 'listed_by_display',

            # Legal Docs (Required)
            'building_commencement_certificate',
            'building_completion_certificate',
            'layout_sanction',
            'layout_order',
            'na_order_or_gunthewari',
            'mojani_nakasha',
            'doc_7_12_or_pr_card',
            'title_search_report',
            'has_7_12', 'has_mojani', 'has_active_mandate', 'active_mandate_id',

            # Legal Docs (Optional)
            'rera_project_certificate',
            'gst_registration',
            'sale_deed_registration_copy'
        ]
        
        # --- Security: Fields that the user CANNOT change manually ---
        read_only_fields = [
            'id', 'owner', 'verification_status', 'price_per_sqft', 
            'created_at'
        ]

    # Removed custom validation for now to match revert request
    

    def validate(self, data):
        """
        Cross-field validation to ensure sub_type belongs to the correct property_type.
        """
        property_type = data.get('property_type')
        sub_type = data.get('sub_type')

        if not sub_type:
            return data

        valid_sub_types = {
            'VILLA_BUNGALOW': ['BUNGALOW', 'TWIN_BUNGALOW', 'ROWHOUSE', 'VILLA'],
            'PLOT': ['RES_PLOT', 'COM_PLOT'],
            'LAND': ['AGRI_LAND', 'IND_LAND'],
            'COMMERCIAL_UNIT': ['SHOP', 'OFFICE', 'SHOWROOM'],
            'FLAT': []  # No sub-types for Flat
        }

        allowed = valid_sub_types.get(property_type, [])
        if sub_type and sub_type not in allowed:
            raise serializers.ValidationError({
                "sub_type": f"Invalid sub_type '{sub_type}' for property_type '{property_type}'. Valid choices are: {allowed}"
            })

        # --- Document Validation (Required Fields) ---
        required_docs = [
            'building_commencement_certificate',
            'building_completion_certificate',
            'layout_sanction',
            'layout_order',
            'na_order_or_gunthewari',
            'mojani_nakasha',
            'doc_7_12_or_pr_card',
            'title_search_report'
        ]

        # Only validate on CREATE or when any of these fields are being UPDATED
        # We check if the instance exists to distinguish between create and update
        errors = {}
        for doc in required_docs:
            # If creating, or if the field is present in data (updating)
            # OR if it's an update and the instance doesn't have it yet.
            val = data.get(doc)
            
            # Simple check: if it's missing in data AND not on instance, it's an error
            # But we only want to enforce this strictly if the user is submitting the form.
            if not val and (not self.instance or not getattr(self.instance, doc)):
                errors[doc] = "This document is required."

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def validate_bhk_config(self, value):
        property_type = self.initial_data.get('property_type')
        
        # For plots, land, commercial - BHK can be 0 or null
        if property_type in ['PLOT', 'LAND', 'COMMERCIAL', 'COMMERCIAL_UNIT']:
            return value if value is not None else 0
        
        # For residential - BHK must be >= 1 ONLY if required.
        # However, per user request, we want to allow 0 if the user explicitly chooses it,
        # but logically residential properties should have bedrooms.
        # We'll allow 0 if that's what the model permits, but normally frontend should enforce.
        return value

    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError("Invalid Latitude range.")
        return value

    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError("Invalid Longitude range.")
        return value

    def get_has_7_12(self, obj):
        return bool(obj.doc_7_12_or_pr_card)

    def get_has_mojani(self, obj):
        return bool(obj.mojani_nakasha)

    def get_has_active_mandate(self, obj):
        from apps.mandates.models import Mandate
        return Mandate.objects.filter(
            property_item=obj, 
            status__in=['ACTIVE', 'PENDING']
        ).exists()

    def get_active_mandate_id(self, obj):
        from apps.mandates.models import Mandate
        mandate = Mandate.objects.filter(
            property_item=obj, 
            status__in=['ACTIVE', 'PENDING']
        ).first()
        return str(mandate.id) if mandate else None

    def to_representation(self, instance):
        """
        Custom representation to handle fallback logic for fields.
        """
        ret = super().to_representation(instance)
        
        # Fallback for WhatsApp number: specific -> owner's phone
        if not ret.get('whatsapp_number') and instance.owner:
            ret['whatsapp_number'] = instance.owner.phone_number
            
        return ret

class AdminPropertySerializer(PropertySerializer):
    """
    Serializer for Admin access, including full owner details (contact info).
    """
    owner_details = UserSerializer(source='owner', read_only=True)
