"use client";

import { useState, useEffect } from "react";
import { mandateService } from "@/services/mandateService";
import { Mandate, MandateStatus } from "@/types/mandate";
import MandateCard from "@/components/mandates/MandateCard";
import Link from "next/link";
import { Plus, Filter, FileText, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function MandatesDashboard() {
    const [mandates, setMandates] = useState<Mandate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"ALL" | "INITIATED" | "PENDING">("ALL");
    const { user } = useAuth();

    useEffect(() => {
        fetchMandates();
    }, []);

    const fetchMandates = async () => {
        try {
            const data = await mandateService.getMandates();
            setMandates(data);
        } catch (error) {
            console.error("Failed to fetch mandates:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMandates = mandates.filter((m) => {
        if (filter === "ALL") return true;
        if (filter === "PENDING") return m.status === MandateStatus.PENDING;
        // For "INITIATED", we might check if 'initiated_by' matches the user's role. 
        // Since user object has is_active_seller/broker, we can compare.
        // However, simplest logic for now: Just showing all or pending action.
        // If "INITIATED" specifically means "Mandates I started", we need to know who "I" am exactly in the context of the mandate.
        // Let's assume 'ALL' covers everything, 'PENDING' is actionable items.
        // If the user wants "My Initiated", we'd check `initiated_by` against user role.

        // Let's stick to the prompt: "All Properties, Mandate Initiated, and Pending Action"
        // "Mandate Initiated" likely means "Active/Ongoing" or "Created by me". 
        // Let's interpret:
        // ALL: Everything
        // INITIATED: Status is PENDING (created but not signed) ? Or Initiated by me? 
        // PROMPT SAYS: "All Properties, Mandate Initiated, and Pending Action."
        // Let's map: 
        // 1. All Properties (Everything)
        // 2. Mandate Initiated (Maybe just "Active"?) -> Let's treat as "Active" for now or "Created by me".
        // 3. Pending Action (Status PENDING where I am the recipient)

        // Refined Interpretation:
        // Filter 1: ALL
        // Filter 2: INITIATED (Created by me)
        // Filter 3: PENDING (Waiting for my action OR waiting for their action - usually specifically "Pending Action" means "Action Required by Me")

        if (filter === "INITIATED") {
            // "Created by Me" - Mandates where I am the initiator
            const isSeller = user?.is_active_seller;
            const isBroker = user?.is_active_broker;

            if (isSeller && m.initiated_by === 'SELLER') return true;
            if (isBroker && m.initiated_by === 'BROKER') return true;
            return false;
        }

        if (filter === "PENDING") {
            // "Pending Action" - Mandates that are PENDING AND I did NOT initiate
            // (meaning I am the one who needs to sign)
            if (m.status !== MandateStatus.PENDING) return false;

            const isSeller = user?.is_active_seller;
            const isBroker = user?.is_active_broker;

            // If I am seller and I initiated it, I am waiting for broker -> NOT "Pending Action" for me
            if (isSeller && m.initiated_by === 'SELLER') return false;

            // If I am broker and I initiated it, I am waiting for seller -> NOT "Pending Action" for me
            if (isBroker && m.initiated_by === 'BROKER') return false;

            return true;
        }

        return true;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mandate Management</h1>
                    <p className="text-gray-500">Manage your property agreements and contracts</p>
                </div>
                <Link
                    href="/dashboard/mandates/create"
                    className="flex items-center justify-center gap-2 bg-primary-green hover:bg-dark-green text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>Initiate Mandate</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 w-fit">
                {(["ALL", "INITIATED", "PENDING"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                            ? "bg-gray-100 text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        {f === "ALL" && "All Mandates"}
                        {f === "INITIATED" && "Created by Me"}
                        {f === "PENDING" && "Pending Action"}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : filteredMandates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMandates.map((mandate) => (
                        <MandateCard key={mandate.id} mandate={mandate} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-primary-green" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Mandates Found</h3>
                    <p className="text-gray-500 max-w-sm text-center mb-6">
                        You don't have any mandates with the selected filter. Start a new agreement to get secured.
                    </p>
                    <Link
                        href="/dashboard/mandates/create"
                        className="flex items-center gap-2 text-primary-green font-semibold hover:underline"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Mandate</span>
                    </Link>
                </div>
            )}
        </div>
    );
}
