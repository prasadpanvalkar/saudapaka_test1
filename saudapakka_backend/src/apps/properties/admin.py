from django.contrib import admin
from .models import Property
from django.contrib.auth import get_user_model

User = get_user_model()

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    # 1. Columns shown in the list view
    list_display = (
        'title', 
        'project_name', 
        'total_price', 
        'property_type', 
        'verification_status', 
        'owner_display',  # Custom display for SaudaPakka
        'created_at'
    )
    
    # 2. Filters on the right side
    list_filter = (
        'verification_status', 
        'property_type', 
        'city', 
        'furnishing_status',
        'availability_status'
    )
    
    # 3. Search bar fields
    search_fields = ('title', 'project_name', 'city', 'locality', 'owner__email')
    
    # 4. Organizing the Detail Form into Sections
    fieldsets = (
        ('Basic Information', {
            'fields': ('owner', 'title', 'project_name', 'property_type', 'verification_status')
        }),
        ('Configuration', {
            'fields': ('bhk_config', 'bathrooms', 'balconies', 'furnishing_status')
        }),
        ('Pricing & Areas', {
            'fields': ('total_price', 'price_per_sqft', 'maintenance_charges', 'maintenance_interval', 'super_builtup_area', 'carpet_area', 'plot_area')
        }),
        ('Location Details', {
            'fields': ('address_line', 'locality', 'city', 'pincode', 'latitude', 'longitude', 'landmarks')
        }),
        ('Building & Status', {
            'fields': ('specific_floor', 'total_floors', 'facing', 'availability_status', 'possession_date', 'age_of_construction')
        }),
        ('Amenities', {
            'fields': (
                'has_power_backup', 'has_lift', 'has_swimming_pool', 'has_club_house', 
                'has_gym', 'has_park', 'has_reserved_parking', 'has_security', 
                'is_vastu_compliant', 'has_intercom', 'has_piped_gas', 'has_wifi'
            )
        }),
        ('Media & Contact', {
            'fields': ('video_url', 'whatsapp_number', 'listed_by')
        }),
    )

    # 5. Read-only fields
    readonly_fields = ('created_at', 'price_per_sqft')

    def owner_display(self, obj):
        """
        Shows 'SaudaPakka (Platform)' in the list view if 
        the owner is a superuser.
        """
        if obj.owner and obj.owner.is_superuser:
            return "🛡️ SaudaPakka (Platform)"
        return obj.owner.full_name if obj.owner else "No Owner"
    owner_display.short_description = 'Listed By'

    def save_model(self, request, obj, form, change):
        """
        Logic for Admin Direct Listings:
        1. If it's a new property (not an update) and owner isn't set, 
           assign it to the platform admin.
        2. Auto-verify listings created directly via Admin panel.
        """
        if not change:  # This is a new 'Add' operation
            # Assign current admin if no owner is selected
            if not obj.owner:
                obj.owner = request.user
            
            # Direct Admin listings are trusted and auto-verified
            obj.verification_status = 'VERIFIED'
        
        super().save_model(request, obj, form, change)