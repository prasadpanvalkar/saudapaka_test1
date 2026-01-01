from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
import django_filters

from .models import Property, PropertyImage, SavedProperty, RecentlyViewed
from .serializers import PropertySerializer, PropertyImageSerializer
from .permissions import IsOwnerOrReadOnly

# --- ADVANCED FILTERING LOGIC ---

class PropertyFilter(django_filters.FilterSet):
    # Professional Price Range Filters
    min_price = django_filters.NumberFilter(field_name="total_price", lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name="total_price", lookup_expr='lte')
    
    # Area Filters
    min_area = django_filters.NumberFilter(field_name="carpet_area", lookup_expr='gte')
    
    # Exact Match Filters
    city = django_filters.CharFilter(field_name="city", lookup_expr='icontains')
    bhk = django_filters.NumberFilter(field_name="bhk_config")
    
    class Meta:
        model = Property
        fields = [
            'property_type', 'bhk_config', 'city', 'locality', 
            'furnishing_status', 'availability_status', 'facing'
        ]

# --- MAIN VIEWSET ---

class PropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser] 
    
    # Filtering & Search Configuration
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyFilter
    search_fields = ['title', 'project_name', 'address_line', 'locality', 'city', 'landmarks']
    ordering_fields = ['total_price', 'created_at', 'super_builtup_area']

    def get_queryset(self):
        """
        Visibility Logic:
        1. Admin: Everything.
        2. Owners: Verified + Their Own (Pending/Rejected).
        3. Public: Verified Only.
        """
        user = self.request.user
        base_query = Property.objects.all().prefetch_related('images').select_related('owner')

        if user.is_staff:
            return base_query.order_by('-created_at')
        
        if user.is_authenticated:
            return base_query.filter(
                Q(verification_status='VERIFIED') | Q(owner=user)
            ).distinct().order_by('-created_at')
            
        return base_query.filter(verification_status='VERIFIED').order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        
        # Check User Authorization
        if not (user.is_active_seller or user.is_active_broker):
            raise permissions.PermissionDenied(
                "Access Denied: You must complete KYC to list properties."
            )
        
        # Save with owner and initial pending status
        serializer.save(owner=user, verification_status='PENDING')

    # --- IMAGE MANAGEMENT ---

    @action(detail=True, methods=['post'], url_path='upload_image')
    def upload_image(self, request, pk=None):
        """Allows uploading multiple images to the gallery"""
        property_obj = self.get_object()
        
        if property_obj.owner != request.user and not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=403)

        image_file = request.data.get('image')
        is_cover = request.data.get('is_cover', False) # Option to set as main image

        if not image_file:
            return Response({"error": "No file uploaded"}, status=400)

        photo = PropertyImage.objects.create(
            property=property_obj, 
            image=image_file, 
            is_cover=is_cover
        )
        
        return Response(PropertyImageSerializer(photo).data, status=201)

    # --- USER INTERACTIONS (SAVE/RECENT/HISTORY) ---

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def save_property(self, request, pk=None):
        property_obj = self.get_object()
        saved_item, created = SavedProperty.objects.get_or_create(user=request.user, property=property_obj)
        if not created:
            saved_item.delete()
            return Response({'message': 'Removed from saved'}, status=200)
        return Response({'message': 'Saved successfully'}, status=201)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def record_view(self, request, pk=None):
        """Called when user opens a property. Updates the 'Recently Viewed' list."""
        property_obj = self.get_object()
        RecentlyViewed.objects.update_or_create(user=request.user, property=property_obj)
        serializer = self.get_serializer(property_obj)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_saved(self, request):
        saved = SavedProperty.objects.filter(user=request.user).select_related('property')
        props = [s.property for s in saved]
        serializer = self.get_serializer(props, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_recent(self, request):
        recent = RecentlyViewed.objects.filter(user=request.user).order_by('-viewed_at')[:10]
        props = [r.property for r in recent]
        serializer = self.get_serializer(props, many=True)
        return Response(serializer.data)
    


    def destroy(self, request, *args, **kwargs):
        property_obj = self.get_object()
        
        # Security: The 'IsOwnerOrReadOnly' permission already handles basic ownership,
        # but we add a business logic check here.
        
        # Check if the property has an ACTIVE mandate (Safety Check)
        if property_obj.mandates.filter(status='SIGNED').exists():
            return Response(
                {"error": "Cannot delete a property with an active signed mandate. Please cancel the mandate first."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        self.perform_destroy(property_obj)
        return Response({"message": "Property deleted successfully."}, status=status.HTTP_204_NO_CONTENT)