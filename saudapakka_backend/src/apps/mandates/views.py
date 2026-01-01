from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Mandate
from .serializers import MandateSerializer
from rest_framework.exceptions import ValidationError

class MandateViewSet(viewsets.ModelViewSet):
    serializer_class = MandateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Admins see all, Users see only their own deals
        if user.is_staff:
            return Mandate.objects.all()
        return Mandate.objects.filter(seller=user) | Mandate.objects.filter(broker=user)

    def perform_create(self, serializer):
        user = self.request.user
        initiated_by = self.request.data.get('initiated_by')
        
        # Case 1: Broker is approaching a Seller
        if initiated_by == 'BROKER':
            # We must provide the 'seller' (owner_id) and 'property' (property_id)
            seller_id = self.request.data.get('seller')
            if not seller_id:
                raise ValidationError("You must specify which Seller you are approaching.")
            serializer.save(broker=user, initiated_by='BROKER')

        # Case 2: Seller is hiring a Broker (or SaudaPakka)
        elif initiated_by == 'SELLER':
            # We must provide the 'broker' (broker_id) and 'property' (property_id)
            broker_id = self.request.data.get('broker')
            if not broker_id:
                raise ValidationError("You must specify which Broker you are hiring.")
            serializer.save(seller=user, initiated_by='SELLER')


    @action(detail=True, methods=['post'])
    def accept_and_sign(self, request, pk=None):
        """
        The "Counter-Signature" API. This completes the contract.
        """
        mandate = self.get_object()
        
        if mandate.status != 'PENDING':
            return Response({"error": "This mandate is not in a pending state."}, status=400)

        # 2. ATTACH THE SECOND SIGNATURE
        signature_file = request.FILES.get('signature')
        if not signature_file:
            return Response({"error": "Digital signature file is required to accept."}, status=400)

        # Logic: If I am the Seller accepting a Broker's request
        if request.user == mandate.seller:
            mandate.seller_signature = signature_file
        # Logic: If I am the Broker accepting a Seller's request
        elif request.user == mandate.broker:
            mandate.broker_signature = signature_file
        # Logic: If Admin is signing on behalf of SaudaPakka
        elif request.user.is_staff and mandate.deal_type == 'WITH_PLATFORM':
            mandate.broker_signature = signature_file # Platform acts as the broker role here

        # 3. ACTIVATE THE 90-DAY CLOCK
        mandate.status = 'ACTIVE'
        mandate.start_date = timezone.now().date()
        mandate.save() # Triggers auto-calculation of 90-day end_date in models.py

        return Response({"message": "Mandate signed by both parties. It is now legally ACTIVE."})