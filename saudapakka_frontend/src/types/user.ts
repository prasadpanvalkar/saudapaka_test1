export interface User {
    id: string | number;
    full_name: string;
    email: string;
    phone_number?: string;
    role?: 'SELLER' | 'BROKER' | 'ADMIN';
    role_category?: string;
    is_active_seller?: boolean;
    is_active_broker?: boolean;
    is_staff?: boolean;
    is_superuser?: boolean;
}
