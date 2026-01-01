from rest_framework import serializers
from .models import Property, PropertyImage
from apps.users.serializers import UserSerializer

class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'is_cover', 'created_at']

class PropertySerializer(serializers.ModelSerializer):
    # --- Nested Representations ---
    images = PropertyImageSerializer(many=True, read_only=True)
    owner_details = UserSerializer(source='owner', read_only=True)
    
    # --- Human Readable Choice Labels (For Frontend UI) ---
    property_type_display = serializers.CharField(source='get_property_type_display', read_only=True)
    furnishing_status_display = serializers.CharField(source='get_furnishing_status_display', read_only=True)
    availability_status_display = serializers.CharField(source='get_availability_status_display', read_only=True)
    listed_by_display = serializers.CharField(source='get_listed_by_display', read_only=True)
    facing_display = serializers.CharField(source='get_facing_display', read_only=True)

    class Meta:
        model = Property
        fields = [
            # Basic & System
            'id', 'owner', 'owner_details', 'title', 'project_name', 'property_type', 
            'property_type_display', 'verification_status', 'created_at',

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
            'images', 'video_url', 'floor_plan', 'whatsapp_number', 
            'listed_by', 'listed_by_display',

            # Legal Docs
            'doc_7_12', 'doc_mojani', 'has_7_12', 'has_mojani'
        ]
        
        # --- Security: Fields that the user CANNOT change manually ---
        read_only_fields = [
            'id', 'owner', 'verification_status', 'price_per_sqft', 
            'created_at', 'has_7_12', 'has_mojani'
        ]

    def validate(self, data):
        """
        Professional Validation: Ensure logical data consistency.
        """
        if data.get('carpet_area') and data.get('super_builtup_area'):
            if data['carpet_area'] > data['super_builtup_area']:
                raise serializers.ValidationError(
                    {"carpet_area": "Carpet area cannot be larger than Super Built-up area."}
                )
        return data
    

    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError("Invalid Latitude range.")
        return value

    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError("Invalid Longitude range.")
        return value
    
