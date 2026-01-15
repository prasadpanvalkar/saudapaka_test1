from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from apps.properties.models import Property
from apps.mandates.models import Mandate
from django.db.models import Count, Avg, Q

# Import models from other apps
from apps.properties.models import Property
from apps.users.models import BrokerProfile, KYCVerification

User = get_user_model()

# ==========================================
# 1. ANALYTICS & STATS (For Dashboard Graphs)
# ==========================================

class AdminDashboardStats(APIView):
    """
    A professional HQ view providing real-time platform KPIs.
    Strictly restricted to Super Admins.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        now = timezone.now()
        last_30_days = now - timedelta(days=30)

        return Response({
            # --- 1. User & Growth Metrics ---
            "users": {
                "total": User.objects.count(),
                "sellers": User.objects.filter(is_active_seller=True).count(),
                "brokers": User.objects.filter(is_active_broker=True).count(),
                "new_this_month": User.objects.filter(date_joined__gte=last_30_days).count(),
                "kyc_verified": User.objects.filter(kyc_data__status='VERIFIED').count(),
                "kyc_pending": User.objects.filter(kyc_data__status='INITIATED').count(),
            },

            # --- 2. Inventory (Property) Metrics ---
            "properties": {
                "total": Property.objects.count(),
                "pending_verification": Property.objects.filter(verification_status='PENDING').count(),
                "live_verified": Property.objects.filter(verification_status='VERIFIED').count(),
                "rejected": Property.objects.filter(verification_status='REJECTED').count(),
            },

            # --- 3. Legal & Deal Pipeline (Mandates) ---
            "mandates": {
                "total_requests": Mandate.objects.count(),
                "active_legal_deals": Mandate.objects.filter(status='ACTIVE').count(),
                "pending_signatures": Mandate.objects.filter(status='PENDING').count(),
                "expired_this_month": Mandate.objects.filter(status='EXPIRED', end_date__gte=now.date()).count(),
            },

            # --- 4. Market Intelligence (For Frontend Charts) ---
            "market_insights": {
                "avg_property_price": Property.objects.filter(verification_status='VERIFIED').aggregate(Avg('total_price'))['total_price__avg'] or 0,
                "top_localities": Property.objects.values('locality').annotate(count=Count('id')).order_by('-count')[:5],
                "inventory_by_bhk": Property.objects.values('bhk_config').annotate(count=Count('id')).order_by('bhk_config'),
            },

            # --- 5. System Health ---
            "platform_meta": {
                "last_updated": now,
                "server_time": now.strftime("%Y-%m-%d %H:%M:%S")
            }
        })

# ==========================================
# 2. PROPERTY VERIFICATION WORKFLOW
# ==========================================

class AdminPropertyList(generics.ListAPIView):
    """
    List properties based on status.
    Usage: /api/admin/properties/?status=PENDING
    """
    permission_classes = [permissions.IsAdminUser]
    # We need to import the serializer. We will do this in the serializers step.
    # For now, we assume PropertySerializer exists.
    # We need to import the serializer. We will do this in the serializers step.
    # For now, we assume PropertySerializer exists.
    from apps.properties.serializers import AdminPropertySerializer 
    serializer_class = AdminPropertySerializer

    def get_queryset(self):
        status_param = self.request.query_params.get('status', 'PENDING')
        return Property.objects.filter(verification_status=status_param).order_by('-created_at')

class AdminPropertyAction(APIView):
    """
    Approve or Reject a property.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            property_obj = Property.objects.get(pk=pk)
        except Property.DoesNotExist:
            return Response({"error": "Property not found"}, status=404)

        action = request.data.get('action') # 'APPROVE' or 'REJECT'
        reason = request.data.get('reason', '')

        if action == 'APPROVE':
            property_obj.verification_status = 'VERIFIED'
            property_obj.rejection_reason = None
            property_obj.save()
            return Response({"message": f"Property '{property_obj.title}' is now LIVE."})

        elif action == 'REJECT':
            property_obj.verification_status = 'REJECTED'
            property_obj.rejection_reason = reason
            property_obj.save()
            return Response({"message": f"Property rejected."})

        return Response({"error": "Invalid action. Use APPROVE or REJECT"}, status=400)

# ==========================================
# 3. USER MANAGEMENT (Brokers/Sellers)
# ==========================================

class AdminUserList(generics.ListAPIView):
    """
    List all users with filters.
    Usage: /api/admin/users/?role=BROKER
    """
    permission_classes = [permissions.IsAdminUser]
    from apps.users.serializers import UserSerializer
    serializer_class = UserSerializer

    def get_queryset(self):
        role = self.request.query_params.get('role', 'ALL')
        
        queryset = User.objects.all().order_by('-date_joined')

        if role == 'BROKER':
            queryset = queryset.filter(is_active_broker=True)
        elif role == 'SELLER':
            queryset = queryset.filter(is_active_seller=True)
        elif role == 'LOGGED_IN':
            # Active users in last 7 days
            seven_days_ago = timezone.now() - timedelta(days=7)
            queryset = queryset.filter(last_login__gte=seven_days_ago)
            
        return queryset

class AdminUserAction(APIView):
    """
    Manage user state: BLOCK, UNBLOCK, UPDATE_ROLE
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        
        action = request.data.get('action') # 'BLOCK', 'UNBLOCK', 'UPDATE_ROLE'
        
        if action == 'BLOCK':
            user.is_active = False
            user.save()
            return Response({"message": "User blocked successfully"})
            
        elif action == 'UNBLOCK':
            user.is_active = True
            user.save()
            return Response({"message": "User unblocked"})
            
        elif action == 'UPDATE_ROLE':
            is_broker = request.data.get('is_active_broker')
            is_seller = request.data.get('is_active_seller')
            
            if is_broker is not None:
                user.is_active_broker = bool(is_broker)
            if is_seller is not None:
                user.is_active_seller = bool(is_seller)
                
            user.save()
            return Response({"message": "User roles updated successfully"})
            
        return Response({"error": "Invalid action"}, status=400)

class AdminUserDetail(generics.RetrieveDestroyAPIView):
    """
    Get or Delete a user.
    """
    permission_classes = [permissions.IsAdminUser]
    from apps.users.serializers import UserSerializer
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def perform_destroy(self, instance):
        # Optional: Soft delete instead?
        # instance.is_active = False
        # instance.save()
        instance.delete()

class AdminUserKYCVerify(APIView):
    """
    Manually verify a user's KYC without DigiLocker.
    POST /api/admin/users/{user_id}/verify-kyc/
    Body: { "action": "APPROVE" }
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        
        action = request.data.get('action')  # 'APPROVE'
        
        if action == 'APPROVE':
            # Get or create KYC record
            from apps.users.models import KYCVerification
            kyc, created = KYCVerification.objects.get_or_create(user=target_user)
            
            # Mark as verified (but NOT via DigiLocker)
            # We keep status as 'INITIATED' to distinguish from DigiLocker verification
            # The is_kyc_verified field is what matters for access control
            if not kyc.full_name:
                kyc.full_name = target_user.full_name
            kyc.save()
            
            # Set cached KYC status
            target_user.is_kyc_verified = True
            target_user.save(update_fields=['is_kyc_verified'])
            
            return Response({
                "message": f"User {target_user.email} manually verified by admin.",
                "is_kyc_verified": True
            })
        
        return Response({"error": "Invalid action"}, status=400)

    
class AdminPropertyDetail(generics.RetrieveAPIView):
    """
    Get FULL details of a single property (including Document URLs) for Admin Review.
    """
    permission_classes = [permissions.IsAdminUser]
    from apps.properties.serializers import AdminPropertySerializer
    serializer_class = AdminPropertySerializer
    queryset = Property.objects.all()