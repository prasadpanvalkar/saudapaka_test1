from rest_framework import viewsets, permissions
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from rest_framework.decorators import action
User = get_user_model()

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=True, methods=['get'])
    def kyc_details(self, request, pk=None):
        """View the raw DigiLocker/Aadhaar data for a specific user."""
        user = self.get_object()
        try:
            kyc = user.kycverification
            return Response({
                "full_name": kyc.full_name,
                "aadhaar_masked": kyc.aadhaar_number,
                "dob": kyc.dob,
                "raw_data": kyc.address_json,
                "status": kyc.status
            })
        except:
            return Response({"error": "No KYC found"}, status=404)