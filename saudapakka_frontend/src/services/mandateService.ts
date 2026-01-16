import axios from "@/lib/axios";
import {
    Mandate,
    CreateMandatePayload,
    RejectMandatePayload,
    BrokerProfile
} from "@/types/mandate";

const BASE_URL = "/api/mandates/";

export const mandateService = {
    // 1. Fetch all mandates (optionally filter by status if needed, though backend handles basic list)
    getMandates: async (searchQuery?: string): Promise<Mandate[]> => {
        const params: any = {};
        if (searchQuery) params.search = searchQuery;

        const { data } = await axios.get(BASE_URL, { params });
        return data;
    },

    // 2. Initiate Mandate
    // 2. Initiate Mandate
    initiateMandate: async (payload: CreateMandatePayload, signatureFile?: File | null, selfieFile?: File | null): Promise<Mandate> => {
        if (signatureFile) {
            const formData = new FormData();
            // Append all payload fields to FormData
            Object.entries(payload).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, String(value));
                }
            });
            // Determine the field name for signature (seller_signature or broker_signature)
            // Default to seller_signature if initiated by SELLER (or undefined)
            // If initiated by BROKER, use broker_signature
            const sigField = payload.initiated_by === 'BROKER' ? 'broker_signature' : 'seller_signature';
            formData.append(sigField, signatureFile);

            // Handle Selfie
            if (selfieFile) {
                const selfieField = payload.initiated_by === 'BROKER' ? 'broker_selfie' : 'seller_selfie';
                formData.append(selfieField, selfieFile);
            }

            const { data } = await axios.post(BASE_URL, formData);
            return data;
        } else {
            // JSON fallback if no signature (though UI enforces it now)
            const { data } = await axios.post(BASE_URL, payload);
            return data;
        }
    },

    // 3. Search Broker
    searchBroker: async (mobileNumber: string): Promise<BrokerProfile[]> => {
        // Note: Backend returns a list or single object? Docs say "Returns ID and Name". 
        // Usually search returns a list. Assuming list for safety, or single object.
        // Adjusting based on common patterns.
        const { data } = await axios.get(`${BASE_URL}search_broker/`, {
            params: { mobile_number: mobileNumber },
        });
        // If backend returns a single object not in array, wrap it.
        if (Array.isArray(data)) return data;
        return [data];
    },

    // 4. Accept & Sign
    acceptAndSign: async (id: number | string, signatureFile: File, selfieFile?: File): Promise<Mandate> => {
        const formData = new FormData();
        formData.append("signature", signatureFile);
        if (selfieFile) {
            formData.append("selfie", selfieFile);
        }

        const { data } = await axios.post(
            `${BASE_URL}${id}/accept_and_sign/`,
            formData
        );
        return data;
    },

    // 5. Reject Mandate
    rejectMandate: async (id: number | string, payload: RejectMandatePayload): Promise<Mandate> => {
        const { data } = await axios.post(`${BASE_URL}${id}/reject/`, payload);
        return data;
    },

    // 6. Cancel Mandate
    cancelMandate: async (id: number | string): Promise<void> => {
        await axios.post(`${BASE_URL}${id}/cancel_mandate/`, {});
    },

    // 9. Delete Mandate (Admin)
    deleteMandate: async (id: number | string): Promise<void> => {
        await axios.delete(`${BASE_URL}${id}/`);
    },

    // 7. Renew Mandate
    renewMandate: async (id: number | string): Promise<Mandate> => {
        const { data } = await axios.post(`${BASE_URL}${id}/renew_mandate/`, {});
        return data;
    },

    // 8. Get Single Mandate Details
    getMandateById: async (id: number | string): Promise<Mandate> => {
        const { data } = await axios.get(`${BASE_URL}${id}/`);
        return data;
    },
};
