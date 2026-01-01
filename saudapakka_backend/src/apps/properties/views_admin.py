from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Property
from .serializers import PropertySerializer

class AdminPropertyViewSet(viewsets.ModelViewSet):
    """
    Restricted API for platform administrators to manage all listings.
    """
    queryset = Property.objects.all().order_by('-created_at')
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAdminUser] # Ensures only Staff/Superusers access this

    def perform_create(self, serializer):
        # Admin-created listings are auto-verified and owned by the Platform
        serializer.save(
            owner=self.request.user,
            verification_status='VERIFIED'
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Manually approve a user-submitted property."""
        property_obj = self.get_object()
        property_obj.verification_status = 'VERIFIED'
        property_obj.save()
        return Response({"message": "Property approved and live."})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a property with a specific reason."""
        reason = request.data.get('reason', 'Documents are unclear.')
        property_obj = self.get_object()
        property_obj.verification_status = 'REJECTED'
        property_obj.rejection_reason = reason
        property_obj.save()
        return Response({"message": "Property rejected."})
    
    # Inside your AdminPropertyViewSet...
    def destroy(self, request, *args, **kwargs):
        """
        Admin-only delete. Admins can override mandate restrictions 
        if necessary for platform cleanup.
        """
        property_obj = self.get_object()
        
        # Optional: Add a log entry here to track who deleted what
        print(f"Admin {request.user.email} is deleting Property: {property_obj.title}")
        
        property_obj.delete()
        return Response({"message": "Property permanently removed by Admin."}, status=status.HTTP_204_NO_CONTENT)