import { useAuth } from "./use-auth";

/**
 * Optimized hook to check if current user requires KYC verification
 * Returns true if user needs KYC but hasn't completed it
 */
export function useKYCRequired() {
    const { user } = useAuth();

    if (!user) return false;

    // Admin bypass
    if (user.is_staff) return false;

    // Only these roles need KYC
    const kycRequiredRoles = ['SELLER', 'BROKER', 'BUILDER', 'PLOTTING_AGENCY'];
    if (!user.role_category || !kycRequiredRoles.includes(user.role_category)) {
        return false;
    }

    // Check KYC status
    return user.kyc_status !== 'VERIFIED';
}
