export enum MandateStatus {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    REJECTED = "REJECTED",
    TERMINATED_BY_USER = "TERMINATED_BY_USER",
    EXPIRED = "EXPIRED",
}

export enum DealType {
    WITH_BROKER = "WITH_BROKER",
    WITH_PLATFORM = "WITH_PLATFORM",
}

export enum InitiatedBy {
    SELLER = "SELLER",
    BROKER = "BROKER",
}

export interface Mandate {
    id: number | string; // Updated to support UUIDs from backend
    property_item: number | string; // ID of the property
    property_title?: string; // Optional expanded field if backend provides it
    initiated_by: InitiatedBy;
    deal_type: DealType;
    broker?: number | string | null;
    broker_name?: string | null;
    seller?: number | string | null; // ID of the seller (owner)
    seller_name?: string | null;
    seller_role?: string | null;
    seller_signature?: string | null; // URL or path
    broker_signature?: string | null; // URL or path
    seller_selfie?: string | null; // URL or path
    broker_selfie?: string | null; // URL or path
    is_exclusive: boolean;
    commission_rate?: number;
    status: MandateStatus;
    expiry_date?: string;
    created_at: string;
    signed_at?: string;
    my_role?: 'INITIATOR' | 'RECIPIENT'; // Helper for frontend logic
    property_details?: any; // The full property object from serializer
    mandate_number?: string; // Mandate Ref No
}

export interface CreateMandatePayload {
    property_item: number | string;
    initiated_by: InitiatedBy;
    deal_type: DealType;
    broker?: number | string;
    is_exclusive?: boolean;
    commission_rate?: number;
}

export interface RejectMandatePayload {
    reason: string;
}

export interface BrokerSearchParams {
    mobile_number: string;
}

export interface BrokerProfile {
    id: number;
    full_name: string;
    mobile_number: string;
    profile_picture?: string;
}
