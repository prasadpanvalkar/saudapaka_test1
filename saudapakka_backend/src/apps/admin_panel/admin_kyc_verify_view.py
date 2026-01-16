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
