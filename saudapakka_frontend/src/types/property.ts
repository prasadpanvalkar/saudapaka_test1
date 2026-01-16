export interface PropertyOwner {
    id: string;
    full_name: string;
    is_active_seller?: boolean;
    is_active_broker?: boolean;
    // Contact details are fetched separately or only available if authorized
    email?: string;
    phone_number?: string;
    whatsapp_number?: string;
}

export interface PropertyImage {
    id: string;
    image: string;
    is_thumbnail: boolean;
    order?: number;
}

export interface FloorPlan {
    id: string;
    image: string;
    order: number;
    floor_number?: number;
    floor_name?: string;
}

export interface PropertyDocuments {
    building_commencement_certificate?: string | null;
    building_completion_certificate?: string | null;
    layout_sanction?: string | null;
    layout_order?: string | null;
    na_order_or_gunthewari?: string | null;
    mojani_nakasha?: string | null;
    doc_7_12_or_pr_card?: string | null;
    title_search_report?: string | null;
    rera_project_certificate?: string | null;
    gst_registration?: string | null;
    sale_deed_registration_copy?: string | null;
}

export interface PropertyDetail {
    id: string;
    // Basic & System
    title: string;
    description: string;
    listing_type: 'SALE' | 'RENT' | 'LEASE';
    project_name?: string;
    property_type: string;
    property_type_display: string;
    sub_type?: string;
    sub_type_display?: string;
    verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    created_at: string;

    // Configuration
    bhk_config?: number;
    bathrooms?: number;
    balconies?: number;
    furnishing_status?: string;
    furnishing_status_display?: string;

    // Pricing & Area
    total_price: number;
    price_per_sqft?: number;
    maintenance_charges?: string; // Decimal string in backend? Or number. Serializer has it. CHECK.
    maintenance_interval?: string;
    super_builtup_area: string; // Decimal string
    carpet_area: string; // Decimal string
    plot_area?: string; // Decimal string

    // Location
    address_line: string;
    locality: string;
    city: string;
    pincode: string;
    latitude: number;
    longitude: number;
    landmarks?: string;

    // Building details
    specific_floor?: number;
    total_floors?: number;
    facing?: string;
    facing_display?: string;
    availability_status: string;
    availability_status_display?: string;
    possession_date?: string;
    age_of_construction?: number;

    // Amenities (Booleans)
    has_power_backup?: boolean;
    has_lift?: boolean;
    has_swimming_pool?: boolean;
    has_club_house?: boolean;
    has_gym?: boolean;
    has_park?: boolean;
    has_reserved_parking?: boolean;
    has_security?: boolean;
    is_vastu_compliant?: boolean;
    has_intercom?: boolean;
    has_piped_gas?: boolean;
    has_wifi?: boolean;

    // Media & Contact
    images: PropertyImage[];
    video_url?: string;
    floor_plan?: string; // Legacy field
    floor_plans?: FloorPlan[];
    whatsapp_number?: string;
    listed_by?: string;
    listed_by_display?: string;

    // Owner
    owner: string; // UUID
    owner_details: PropertyOwner;

    // Document Existence Checks
    has_7_12?: boolean;
    has_mojani?: boolean;
    has_active_mandate?: boolean;
    active_mandate_id?: string | null;

    // Actual Documents (URLs)
    building_commencement_certificate?: string | null;
    building_completion_certificate?: string | null;
    layout_sanction?: string | null;
    layout_order?: string | null;
    na_order_or_gunthewari?: string | null;
    mojani_nakasha?: string | null;
    doc_7_12_or_pr_card?: string | null;
    title_search_report?: string | null;
}
