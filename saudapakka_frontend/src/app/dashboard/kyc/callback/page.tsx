"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth"; // Ensure useAuth is imported
import { Button } from "@/components/ui/button";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    Store,
    Briefcase
} from "lucide-react";

export default function KYCCallbackPage() {
    const router = useRouter();
    const { refreshUser } = useAuth(); // Destructure refreshUser from your zustand store
    const [status, setStatus] = useState<"PROCESSING" | "SUCCESS" | "FAILED">("PROCESSING");
    const [message, setMessage] = useState("Verifying your identity with DigiLocker...");
    const [userName, setUserName] = useState("");
    const [loadingRole, setLoadingRole] = useState(false);

    useEffect(() => {
        const verifyStatus = async () => {
            const entityId = localStorage.getItem('kyc_entity_id');
            if (!entityId) {
                setStatus("FAILED");
                setMessage("Session not found. Please restart verification.");
                return;
            }

            try {
                // Step 1: Call backend to confirm KYC with Sandbox
                const res = await api.post("/api/kyc/verify-status/", { entity_id: entityId });

                if (res.data.status === "SUCCESS") {
                    setStatus("SUCCESS");
                    setUserName(res.data.data?.name || "User");
                    localStorage.removeItem('kyc_entity_id');
                } else if (res.status === 202) {
                    // Sandbox/Aadhaar data still processing, retry in 5 seconds
                    setTimeout(verifyStatus, 5000);
                } else {
                    setStatus("FAILED");
                    setMessage(res.data.error || "Verification failed.");
                }
            } catch (error: any) {
                console.error("KYC Verification Error:", error);
                // Handle the 202 processing state if it comes via catch block
                if (error.response?.status === 202) {
                    setTimeout(verifyStatus, 5000);
                } else {
                    setStatus("FAILED");
                    setMessage(error.response?.data?.error || "Connection error.");
                }
            }
        };

        verifyStatus();
    }, []);

    const handleRoleSelection = async (role: "SELLER" | "BROKER" | "BUILDER" | "PLOTTING_AGENCY") => {
        setLoadingRole(true);
        try {
            // Step 2: Request role upgrade from Django
            const res = await api.post("/api/user/upgrade/", { role });

            if (res.status === 200) {
                // Step 3: CRITICAL - Fetch fresh user data to update the Sidebar
                // This updates 'is_active_seller' or 'is_active_broker' in zustand
                await refreshUser();

                // Step 4: Final Redirect
                router.push('/dashboard/overview');
            }
        } catch (error: any) {
            console.error("Role Upgrade Error:", error);
            // If user already has the role, just refresh and proceed
            if (error.response?.data?.error?.includes("already")) {
                await refreshUser();
                router.push('/dashboard/overview');
            } else {
                alert(error.response?.data?.error || "Failed to update role. Try again.");
                setLoadingRole(false);
            }
        }
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 lg:p-12 text-center">

                {status === "PROCESSING" && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                            <Loader2 className="w-10 h-10 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying...</h2>
                        <p className="text-gray-500 animate-pulse">{message}</p>
                    </div>
                )}

                {status === "FAILED" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                        <p className="text-gray-500 mb-8">{message}</p>
                        <Button
                            onClick={() => router.push('/dashboard/kyc')}
                            variant="outline"
                            className="rounded-xl px-8"
                        >
                            Try Again
                        </Button>
                    </div>
                )}

                {status === "SUCCESS" && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {userName}!</h2>
                        <p className="text-gray-500 mb-8">
                            Your identity is verified. Choose how you want to use SaudaPakka:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <button
                                onClick={() => handleRoleSelection("SELLER")}
                                disabled={loadingRole}
                                className="p-6 border rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group relative overflow-hidden disabled:opacity-50"
                            >
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <Store className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">I am an Owner</h3>
                                <p className="text-xs text-gray-500">Directly list and manage my own properties.</p>
                                {loadingRole && <Loader2 className="absolute top-4 right-4 w-4 h-4 animate-spin text-emerald-600" />}
                            </button>

                            <button
                                onClick={() => handleRoleSelection("BUILDER")}
                                disabled={loadingRole}
                                className="p-6 border rounded-2xl hover:border-orange-500 hover:bg-orange-50/50 transition-all group relative overflow-hidden disabled:opacity-50"
                            >
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    <Store className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">I am a Builder</h3>
                                <p className="text-xs text-gray-500">List and manage construction projects.</p>
                            </button>

                            <button
                                onClick={() => handleRoleSelection("PLOTTING_AGENCY")}
                                disabled={loadingRole}
                                className="p-6 border rounded-2xl hover:border-purple-500 hover:bg-purple-50/50 transition-all group relative overflow-hidden disabled:opacity-50"
                            >
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <Store className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">Plotting Agency</h3>
                                <p className="text-xs text-gray-500">Manage land and plotting developments.</p>
                            </button>

                            <button
                                onClick={() => handleRoleSelection("BROKER")}
                                disabled={loadingRole}
                                className="p-6 border rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group relative overflow-hidden disabled:opacity-50"
                            >
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">I am a Broker</h3>
                                <p className="text-xs text-gray-500">I manage multiple properties for clients.</p>
                                {loadingRole && <Loader2 className="absolute top-4 right-4 w-4 h-4 animate-spin text-blue-600" />}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}