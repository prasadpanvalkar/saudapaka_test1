from django.urls import path
from .views import SendOtpView, VerifyKycStatusView, VerifyOtpView, InitiateKycView, UpgradeRoleView, SearchProfileView, AdminDashboardStats, UserProfileView

urlpatterns = [
    path('auth/login/', SendOtpView.as_view(), name='login-otp'),
    path('auth/verify/', VerifyOtpView.as_view(), name='verify-otp'),
    
    # New Endpoints for KYC and Role Upgrade
    path('kyc/initiate/', InitiateKycView.as_view(), name='kyc-initiate'),
    path('user/upgrade/', UpgradeRoleView.as_view(), name='upgrade-role'),
    path('search-profiles/', SearchProfileView.as_view(), name='search-profiles'),
    path('admin/stats/', AdminDashboardStats.as_view(), name='admin-stats'),
    path('user/me/', UserProfileView.as_view(), name='user-profile'),

    # KYC Endpoints
    path('kyc/initiate/', InitiateKycView.as_view(), name='kyc-initiate'),
    path('kyc/verify-status/', VerifyKycStatusView.as_view(), name='kyc-verify-status'),
]