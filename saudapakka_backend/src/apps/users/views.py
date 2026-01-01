import random
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q

from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

# Internal App Imports
from .models import KycVerification, BrokerProfile
from .serializers import UserSerializer
from apps.properties.models import Property

# Email Imports
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

User = get_user_model()

# --- AUTHENTICATION VIEWS ---

class SendOtpView(APIView):
    """
    Step 1: User enters email, receives a branded 6-digit OTP email.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        email_address = request.data.get('email')
        if not email_address:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        
        # 2. Get or Create User
        user, created = User.objects.get_or_create(email=email_address, defaults={'username': email_address})
        
        # 3. Save OTP to DB with timestamp
        user.otp = otp
        user.otp_created_at = timezone.now()
        user.save()

        # 4. Prepare Professional HTML Content
        subject = f"{otp} is your SaudaPakka verification code"
        
        # You can eventually move this HTML to a separate template file
        html_content = f"""
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px; color: #333;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #2D3FE2; margin: 0;">SaudaPakka</h1>
                <p style="font-size: 14px; color: #666;">Secure Property Transactions</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px; line-height: 1.5;">Use the following One-Time Password (OTP) to access your account. This code is valid for <b>5 minutes</b>.</p>
            
            <div style="background: #F8F9FF; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1A1A1A;">{otp}</span>
            </div>
            
            <p style="font-size: 14px; color: #888; text-align: center;">
                If you did not request this, please ignore this email or contact support.
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #AAA; text-align: center;">
                © 2026 SaudaPakka Tech. All rights reserved.
            </p>
        </div>
        """
        text_content = strip_tags(html_content) # Fallback for email clients that don't support HTML

        # 5. Send Multi-part Email
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email_address]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            
            return Response({'message': 'OTP sent successfully! Please check your inbox.'})
            
        except Exception as e:
            # Log the error for debugging
            print(f"SMTP Error: {e}")
            return Response({'error': 'Failed to send email. Please try again later.'}, status=500)

class VerifyOtpView(APIView):
    """
    Step 2: User enters OTP, receives JWT Token.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # 1. Check if OTP matches
        if user.otp != otp:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check Expiry (5 mins validity)
        if (timezone.now() - user.otp_created_at).total_seconds() > 300:
             return Response({'error': 'OTP Expired'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Clear OTP
        user.otp = None
        user.save()

        # 4. Generate JWT Token
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'is_active_seller': user.is_active_seller,
                'is_active_broker': user.is_active_broker
            }
        })


# --- PROFILE & ROLES VIEWS ---

class UserProfileView(APIView):
    """
    Get or Update personal details (Name, Phone, etc.)
    Used by Frontend to set Name immediately after OTP login.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        data = serializer.data
        try:
            data['kyc_status'] = request.user.kycverification.status
        except:
            data['kyc_status'] = 'NOT_SUBMITTED'
        return Response(data)

    def patch(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

# --- KYC VIEWS --- from kycsubmissionviwe to initiatekycview
class InitiateKycView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .services import SandboxKYCService
        
        # 1. Call Sandbox to initiate
        result = SandboxKYCService.initiate_digilocker()
        
        if result.get('code') == 200:
            request_id = result['data']['request_id']
            digilocker_url = result['data']['digilocker_url']
            
            # 2. Save Request ID to user's KYC record
            kyc, created = KycVerification.objects.get_or_create(user=request.user)
            kyc.sandbox_request_id = request_id
            kyc.status = 'INITIATED'
            kyc.save()
            
            return Response({
                "request_id": request_id,
                "digilocker_url": digilocker_url,
                "message": "Please redirect the user to the digilocker_url"
            })
        
        return Response({"error": "Could not initiate KYC with Sandbox"}, status=400)


class UpgradeRoleView(APIView):
    """
    Turn a normal user into a Seller or Broker after KYC.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role_to_add = request.data.get('role')

        try:
            kyc = request.user.kycverification
            if kyc.status != 'VERIFIED':
                return Response({"error": "KYC not verified."}, status=400)
        except KycVerification.DoesNotExist:
            return Response({"error": "No KYC record found."}, status=400)

        if role_to_add == 'SELLER':
            request.user.is_active_seller = True
            request.user.save()
            return Response({"message": "Congratulations! You are now a Seller."})

        elif role_to_add == 'BROKER':
            request.user.is_active_broker = True
            request.user.save()
            BrokerProfile.objects.get_or_create(user=request.user)
            return Response({"message": "Congratulations! You are now a Broker."})

        return Response({"error": "Invalid role. Choose 'SELLER' or 'BROKER'"}, status=400)


# --- DISCOVERY & ADMIN VIEWS ---

class SearchProfileView(generics.ListAPIView):
    """
    Public Directory to find Brokers or Sellers for Mandates.
    """
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    def get_queryset(self):
        query = self.request.query_params.get('query', '')
        role = self.request.query_params.get('role', 'BROKER')

        queryset = User.objects.all()

        if role == 'BROKER':
            queryset = queryset.filter(is_active_broker=True)
        elif role == 'SELLER':
            queryset = queryset.filter(is_active_seller=True)

        if query:
            if len(query) > 20: # Search by UUID
                queryset = queryset.filter(id=query)
            else: # Search by Name
                queryset = queryset.filter(full_name__icontains=query)
        
        return queryset


class AdminDashboardStats(APIView):
    """
    Provides business analytics for the Admin Panel.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        # Find the first superuser to act as the 'Platform User' for mandates
        platform_user = User.objects.filter(is_superuser=True).first()
        
        return Response({
            "platform_id": platform_user.id if platform_user else None,
            "total_users": User.objects.count(),
            "active_sellers": User.objects.filter(is_active_seller=True).count(),
            "active_brokers": User.objects.filter(is_active_broker=True).count(),
            "total_properties": Property.objects.count(),
            "pending_properties": Property.objects.filter(verification_status='PENDING').count(),
            "verified_properties": Property.objects.filter(verification_status='VERIFIED').count(),
        })


class VerifyKycStatusView(APIView):
    """
    Called after user returns from DigiLocker. 
    Frontend sends the request_id received in the URL.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .services import SandboxKYCService
        request_id = request.data.get('request_id')
        
        if not request_id:
            return Response({"error": "Request ID is required"}, status=400)

        # 1. Fetch data from Sandbox
        result = SandboxKYCService.fetch_digilocker_data(request_id)

        # 2. Check if verification was successful
        if result.get('code') == 200 and result['data']['status'] == 'VALID':
            aadhaar_data = result['data']['details']
            
            # 3. Update the KYC Record with Real Data
            kyc = request.user.kycverification
            kyc.full_name = aadhaar_data.get('name')
            kyc.aadhaar_number = aadhaar_data.get('aadhaar_number') # Masked usually
            kyc.dob = aadhaar_data.get('dob')
            kyc.gender = aadhaar_data.get('gender')
            kyc.address_json = aadhaar_data.get('address', {})
            kyc.status = 'VERIFIED'
            kyc.save()

            # 4. Sync User Profile Name with Verified Name
            request.user.full_name = kyc.full_name
            request.user.save()

            return Response({
                "message": "KYC Verified Successfully via DigiLocker!",
                "verified_name": kyc.full_name,
                "status": "VERIFIED"
            })
        
        return Response({
            "error": "Verification failed or still pending.",
            "sandbox_response": result
        }, status=400)