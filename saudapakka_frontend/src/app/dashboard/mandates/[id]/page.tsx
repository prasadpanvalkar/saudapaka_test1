"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import { mandateService } from "@/services/mandateService";
import { Mandate, MandateStatus } from "@/types/mandate";
import { parseMandateTemplate } from "@/utils/mandateTemplateParser";
import MandateLetter from "@/components/mandates/MandateLetter";
import SignaturePad from "@/components/mandates/SignaturePad";
import SelfieCapture from "@/components/ui/SelfieCapture";
import { Loader2, AlertTriangle, CheckCircle, XCircle, Clock, ArrowLeft, RefreshCw, FileText, Camera, Download } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { downloadMandatePDF } from "@/utils/mandateDownload";

export default function MandateDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const id = params.id as string; // Treat as string (could be UUID)

    const [mandate, setMandate] = useState<Mandate | null>(null);
    const [propertyDetails, setPropertyDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Action States
    const [showSignModal, setShowSignModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showSelfieModal, setShowSelfieModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [signature, setSignature] = useState<File | null>(null);
    const [selfie, setSelfie] = useState<File | null>(null);
    const [isSigning, setIsSigning] = useState(false); // New state for manual toggle
    const [isAgreed, setIsAgreed] = useState(false);
    const [scrolledToBottom, setScrolledToBottom] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (id) {
            fetchMandate();
        } else {
            console.error("No ID provided");
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setScrolledToBottom(true);
                }
            },
            { threshold: 1.0 }
        );

        if (scrollRef.current) {
            observer.observe(scrollRef.current);
        }

        return () => observer.disconnect();
    }, [loading, mandate]); // Re-attach when content loads

    const fetchMandate = async () => {
        try {
            const data = await mandateService.getMandateById(id);
            setMandate(data);
            // Fetch property details for the template
            if (data.property_item) {
                try {
                    const propRes = await axios.get(`/api/properties/${data.property_item}/`);
                    setPropertyDetails(propRes.data);
                } catch (e) { console.error("Could not fetch property details", e); }
            }
        } catch (err) {
            console.error("Failed to load mandate", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!signature || !mandate || !selfie) return;
        setActionLoading(true);
        try {
            await mandateService.acceptAndSign(mandate.id, signature, selfie);
            setShowSignModal(false);
            fetchMandate(); // Refresh to see Active status
            alert("Mandate Activated Successfully!");
        } catch (err: any) {
            console.error("Failed to accept", err);
            const msg = err.response?.data?.message || "Failed to accept mandate. Please try again.";
            alert(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason || !mandate) return;
        setActionLoading(true);
        try {
            await mandateService.rejectMandate(mandate.id, { reason: rejectReason });
            setShowRejectModal(false);
            fetchMandate();
        } catch (err) {
            console.error("Failed to reject", err);
            alert("Failed to reject mandate.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRenew = async () => {
        if (!mandate) return;
        setActionLoading(true);
        try {
            await mandateService.renewMandate(mandate.id);
            alert("Mandate renewal initiated! A new request has been created.");
            router.push('/dashboard/mandates');
        } catch (err) {
            console.error("Failed to renew", err);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-green w-8 h-8" /></div>;
    if (!mandate) return <div className="p-8 text-center text-gray-500">Mandate not found or invalid ID.</div>;

    const isPending = mandate.status === MandateStatus.PENDING;
    const isExpired = mandate.status === MandateStatus.EXPIRED;
    const isRejected = mandate.status === MandateStatus.REJECTED;
    const isActive = mandate.status === MandateStatus.ACTIVE;

    // Check Expiry Warning (15 days)
    const isExpiringSoon = isActive && mandate.expiry_date && (() => {
        const today = new Date();
        const expiry = new Date(mandate.expiry_date);
        const diffTime = Math.abs(expiry.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 15 && expiry > today;
    })();

    const isTerminatedByUser = mandate.status === 'TERMINATED_BY_USER';



    const templateContent = parseMandateTemplate({
        mandate,
        property: propertyDetails,
    });

    // --- Helper Logic for UI ---
    const myId = user?.id;
    const amIInitiator = mandate.initiated_by === 'SELLER'
        ? (String(mandate.seller) === String(myId))
        : (String(mandate.broker) === String(myId));

    let activeSigner: 'SELLER' | 'BROKER' | undefined = undefined;
    if (user) {
        if (String(user.id) === String(mandate.seller)) activeSigner = 'SELLER';
        else if (String(user.id) === String(mandate.broker)) activeSigner = 'BROKER';
        else if (user.is_superuser && mandate.deal_type === 'WITH_PLATFORM') activeSigner = 'BROKER';
    }

    // Can action if Pending AND I am involved AND I am NOT the one who started it
    const canAction = isPending && !amIInitiator && !!activeSigner;

    // Am I involved in this mandate? (either as seller or broker)
    const amIInvolved = activeSigner !== undefined;


    return (
        <div className="max-w-7xl mx-auto pb-20 relative">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div className="flex items-start gap-4">
                    <Link
                        href="/dashboard/mandates"
                        className="p-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-colors shadow-sm flex-shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                                Mandate #{mandate.mandate_number || mandate.id.toString().slice(0, 8)}
                            </h1>
                            {isExpiringSoon && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-semibold border border-yellow-100">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Expiring Soon
                                </span>
                            )}
                            {isExpired && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-semibold border border-red-100">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Expired
                                </span>
                            )}
                            {isActive && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold border border-green-100">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Active
                                </span>
                            )}
                            {isRejected && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold border border-gray-200">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Rejected
                                </span>
                            )}
                            {isTerminatedByUser && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-100">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Cancelled
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500" suppressHydrationWarning>
                            Created on {new Date(mandate.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Actions Container */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    {/* Download Button for ACTIVE mandates (anyone involved or admin) */}
                    {isActive && (amIInvolved || (user?.is_staff ?? false)) && (
                        <button
                            onClick={() => downloadMandatePDF(mandate, propertyDetails || mandate.property_details, user || undefined)}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm hover:shadow"
                        >
                            <Download className="w-4 h-4" />
                            Download PDF
                        </button>
                    )}
                    {isExpired && (
                        <button
                            onClick={handleRenew}
                            disabled={actionLoading}
                            className="flex items-center justify-center gap-2 bg-primary-green hover:bg-dark-green text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm hover:shadow"
                        >
                            {actionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                            Renew Mandate
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    {/* Document Viewer */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Official Mandate Document
                            </h3>
                            {isPending && !scrolledToBottom && (
                                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                    Please scroll to the bottom to sign
                                </span>
                            )}
                        </div>
                        <div className="p-6 bg-gray-100/50">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    Mandate #{mandate.mandate_number || mandate.id}
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${mandate.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                        mandate.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {mandate.status}
                                    </span>
                                </h1>
                                <p className="text-gray-500 text-sm">Created on {new Date(mandate.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>


                        {canAction && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 font-medium transition-colors"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => setShowSignModal(true)}
                                    className="px-6 py-2 bg-primary-green text-white rounded-lg hover:bg-dark-green font-bold shadow-lg shadow-green-900/10 transition-colors flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    Accept & Sign
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mandate Letter Display */}
                    <MandateLetter
                        dealType={mandate.deal_type}
                        property={propertyDetails || mandate.property_details}
                        mandate={mandate}
                        activeSigner={activeSigner} // Who is currently needed to sign?
                        isSigned={mandate.status === 'ACTIVE'}
                        signatureUrl={mandate.broker_signature || undefined} // Display existing
                        ownerSignatureUrl={mandate.seller_signature || undefined} // Display existing
                        createdAt={mandate.created_at}
                        signedAt={mandate.signed_at || undefined}
                        roleTitle={mandate.seller_role || undefined}
                    />

                    {/* Accept/Sign Modal */}
                    {/* Accept/Sign Modal */}
                    {showSignModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm transition-all">
                            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 sm:duration-300">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold">Accept & Sign Mandate</h3>
                                    <button onClick={() => { setShowSignModal(false); setIsSigning(false); }} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                        <XCircle className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {/* Content Logic */}
                                {isSigning ? (
                                    <div className="animate-in fade-in slide-in-from-right duration-200">
                                        <div className="mb-2 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-lg">Digital Signature</h4>
                                                <p className="text-sm text-gray-500">Please sign in the box below</p>
                                            </div>
                                            <button
                                                onClick={() => setIsSigning(false)}
                                                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 transition-colors font-medium"
                                            >
                                                Back
                                            </button>
                                        </div>
                                        <div className="mb-6">
                                            <SignaturePad onEnd={(file: File | null) => {
                                                setSignature(file);
                                                setIsSigning(false);
                                            }} />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-gray-600 text-sm mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                                            <span className="text-blue-500 font-bold">ℹ️</span>
                                            Please complete the following verification steps to accept the mandate.
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            {/* 1. Signature Step */}
                                            {!signature ? (
                                                <button
                                                    onClick={() => setIsSigning(true)}
                                                    className="relative py-8 border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:border-primary-green hover:bg-green-50/50 hover:text-primary-green transition-all group overflow-hidden"
                                                >
                                                    <div className="absolute top-3 right-3">
                                                        <span className="bg-gray-200 text-gray-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Required</span>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-full mb-3 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-200">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-bold text-sm">Sign Mandate</span>
                                                </button>
                                            ) : (
                                                <div onClick={() => setIsSigning(true)} className="relative py-8 bg-green-50 border-2 border-green-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer group hover:shadow-md transition-all">
                                                    <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-0.5">
                                                        <CheckCircle className="w-3 h-3" />
                                                    </div>
                                                    <div className="bg-white p-3 rounded-full mb-2 text-green-600 shadow-sm border border-green-100">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <p className="font-bold text-green-800 text-sm">Signature Added</p>
                                                    <span className="text-xs text-green-600 font-medium group-hover:underline mt-1">Edit / Resign</span>
                                                </div>
                                            )}

                                            {/* 2. Selfie Step */}
                                            {!selfie ? (
                                                <button
                                                    onClick={() => setShowSelfieModal(true)}
                                                    className="relative py-8 border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:border-primary-green hover:bg-green-50/50 hover:text-primary-green transition-all group overflow-hidden"
                                                >
                                                    <div className="absolute top-3 right-3">
                                                        <span className="bg-gray-200 text-gray-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Required</span>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-full mb-3 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-200">
                                                        <Camera className="w-6 h-6" />
                                                    </div>
                                                    <span className="font-bold text-sm">Take Selfie</span>
                                                </button>
                                            ) : (
                                                <div onClick={() => setShowSelfieModal(true)} className="relative py-8 bg-green-50 border-2 border-green-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer group hover:shadow-md transition-all overflow-hidden">
                                                    <div className="absolute inset-0 z-0">
                                                        <img src={URL.createObjectURL(selfie)} className="w-full h-full object-cover opacity-10" alt="preview" />
                                                    </div>
                                                    <div className="relative z-10 bg-white p-3 rounded-full mb-2 text-green-600 shadow-sm border border-green-100">
                                                        <Camera className="w-5 h-5" />
                                                    </div>
                                                    <p className="relative z-10 font-bold text-green-800 text-sm">Selfie Captured</p>
                                                    <span className="relative z-10 text-xs text-green-600 font-medium group-hover:underline mt-1">Retake</span>
                                                    <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-0.5 z-10">
                                                        <CheckCircle className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 pb-4 sm:pb-0 safe-area-bottom">
                                            <button
                                                onClick={() => { setShowSignModal(false); setIsSigning(false); }}
                                                className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleAccept}
                                                disabled={actionLoading || !signature || !selfie}
                                                className="bg-primary-green hover:bg-dark-green text-white px-8 py-2.5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-900/10 hover:shadow-green-900/20 flex items-center gap-2 transform active:scale-95"
                                            >
                                                {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Confirm Approval"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}


                    {/* Selfie Modal (Nested or separate) */}
                    {showSelfieModal && (
                        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm transition-all">
                            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold">Selfie Verification</h3>
                                    <button onClick={() => setShowSelfieModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                        <XCircle className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                                <SelfieCapture
                                    onCapture={(file: File) => {
                                        setSelfie(file);
                                        setShowSelfieModal(false);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Reject Modal */}
                    {showRejectModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Mandate</h3>
                                <p className="text-gray-500 text-sm mb-4">Please provide a reason for rejecting this mandate.</p>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-h-[100px]"
                                    placeholder="Reason for rejection..."
                                />
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setShowRejectModal(false)}
                                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={actionLoading || !rejectReason}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 transition-colors"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Reject Mandate"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
