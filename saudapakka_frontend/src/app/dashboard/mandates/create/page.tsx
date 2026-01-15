"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "@/lib/axios";
import { mandateService } from "@/services/mandateService";
import { InitiatedBy, DealType, BrokerProfile } from "@/types/mandate";
import { parseMandateTemplate } from "@/utils/mandateTemplateParser";
import { useAuth } from "@/hooks/use-auth";
import BrokerSearch from "@/components/mandates/BrokerSearch";
import MandateLetter from "@/components/mandates/MandateLetter";
import SignaturePad from "@/components/mandates/SignaturePad";
import SelfieCapture from "@/components/ui/SelfieCapture"; // Imported
import { Loader2, ArrowLeft, Building2, Eye, FileText, PenTool, XCircle, Camera } from "lucide-react";
import Link from "next/link";

interface SimpleProperty {
    id: number | string;
    title: string;
    location: string;
    price: string;
}

export default function InitiateMandatePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const preSelectedPropId = searchParams.get('propertyId');

    // State
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Data
    const [myProperties, setMyProperties] = useState<SimpleProperty[]>([]);
    const [fullPropertyDetails, setFullPropertyDetails] = useState<any>(null); // For template

    // Form Values
    const [selectedProperty, setSelectedProperty] = useState<number | string | null>(null);
    const [dealType, setDealType] = useState<DealType>(DealType.WITH_BROKER);
    const [selectedBroker, setSelectedBroker] = useState<BrokerProfile | null>(null);
    const [commissionRate, setCommissionRate] = useState<number>(2.0); // New State
    const [signature, setSignature] = useState<File | null>(null);
    const [selfie, setSelfie] = useState<File | null>(null); // New State
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const [showSignModal, setShowSignModal] = useState(false);
    const [showSelfieModal, setShowSelfieModal] = useState(false); // New modal for selfie

    // Fetch User's Properties (Only if Seller)
    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get('/api/properties/my_listings/');
                setMyProperties(data);
            } catch (err) {
                console.error("Failed to fetch properties", err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.is_active_seller) {
            fetchProperties();
        }

        // Auto-configure for Broker
        if (user?.is_active_broker) {
            setDealType(DealType.WITH_BROKER);
            // We don't set selectedBroker state because we use 'user' directly in payload/template for brokers
        }
    }, [user]);

    // Handle Pre-selection from URL
    useEffect(() => {
        if (preSelectedPropId) {
            setSelectedProperty(preSelectedPropId); // It's a string, likely UUID
            // If it's not in myProperties (e.g. Broker initiating on external property), fetching full details happens in the next effect.
        }
    }, [preSelectedPropId]);

    // Fetch Full Property Details when selected
    useEffect(() => {
        if (!selectedProperty) return;
        const fetchFullDetails = async () => {
            try {
                const { data } = await axios.get(`/api/properties/${selectedProperty}/`);
                setFullPropertyDetails(data);
            } catch (err) {
                console.error("Failed to fetch property details", err);
                // Fallback to simple details if fail
                setFullPropertyDetails(myProperties.find(p => p.id === selectedProperty));
            }
        };
        fetchFullDetails();
    }, [selectedProperty, myProperties]);

    const handleSubmit = async () => {
        if (!selectedProperty) return;
        if (dealType === DealType.WITH_BROKER && !selectedBroker && !user?.is_active_broker) return;
        if (!termsAccepted) return;
        if (!signature || !selfie) {
            alert("Please sign and take a selfie before submitting.");
            return;
        }

        setSubmitting(true);
        try {
            const isBrokerInitiator = user?.is_active_broker;

            const payload = {
                property_item: selectedProperty,
                initiated_by: user?.is_active_broker ? InitiatedBy.BROKER : InitiatedBy.SELLER,
                deal_type: dealType,
                broker: user?.is_active_broker ? user.id : (dealType === DealType.WITH_BROKER ? selectedBroker?.id : undefined),
                is_exclusive: true,
                commission_rate: commissionRate
            };

            await mandateService.initiateMandate(payload, signature, selfie);
            router.push('/dashboard/mandates');
        } catch (err: any) {
            console.error("Failed to initiate mandate", err);
            const resData = err.response?.data;
            let msg = "Failed to create mandate. Please try again.";

            if (resData) {
                if (typeof resData === 'string') msg = resData;
                else if (resData.message) msg = resData.message; // Custom message
                else if (resData.detail) msg = resData.detail;   // DRF detail
                else if (typeof resData === 'object') {
                    // Collect all field errors
                    const errors = Object.values(resData).flat().join('\n');
                    if (errors) msg = errors;
                }
            }
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) return null;

    const isBrokerInitiator = user?.is_active_broker;
    const activeSigner = isBrokerInitiator ? 'BROKER' : 'SELLER';

    // Generate Template Text
    const templateContent = parseMandateTemplate({
        mandate: {
            seller_name: fullPropertyDetails?.owner_details?.full_name || "Property Owner",
            broker_name: user?.is_active_broker ? user.full_name : selectedBroker?.full_name,
            commission_rate: commissionRate,
            is_exclusive: true
        },
        property: fullPropertyDetails,
        ownerName: fullPropertyDetails?.owner_details?.full_name || "Property Owner",
        partnerName: user?.is_active_broker ? user.full_name : (dealType === DealType.WITH_BROKER ? selectedBroker?.full_name : "SaudaPakka Partner")
    });

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard/mandates"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Initiate New Mandate</h1>
                    <p className="text-gray-500">Create a secure agreement for your property</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Col: Setup */}
                <div className="lg:col-span-5 space-y-8">

                    {/* Step 1: Property Selection */}
                    <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="bg-primary-green text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                            Select Property
                        </h2>

                        {loading ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
                        ) : myProperties.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {myProperties.map(prop => (
                                    <div
                                        key={prop.id}
                                        onClick={() => setSelectedProperty(prop.id)}
                                        className={`cursor-pointer border p-3 rounded-xl transition-all ${selectedProperty === prop.id
                                            ? 'border-primary-green bg-green-50 ring-1 ring-primary-green'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                                                <Building2 className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm line-clamp-1">{prop.title}</p>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{prop.location}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-gray-50 rounded-lg">
                                <p className="text-gray-500 text-sm">No properties found.</p>
                            </div>
                        )}
                    </section>

                    {/* Step 2: Deal Type (Hidden for Brokers) */}
                    {!user?.is_active_broker && (
                        <section className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-opacity ${!selectedProperty ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-primary-green text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                Who are you hiring?
                            </h2>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setDealType(DealType.WITH_BROKER)}
                                    className={`w-full p-4 border rounded-xl text-left transition-all ${dealType === DealType.WITH_BROKER
                                        ? 'border-primary-green bg-green-50 ring-1 ring-primary-green'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="font-semibold block text-gray-900 mb-0.5">Individual Broker</span>
                                </button>

                                <button
                                    onClick={() => setDealType(DealType.WITH_PLATFORM)}
                                    className={`w-full p-4 border rounded-xl text-left transition-all ${dealType === DealType.WITH_PLATFORM
                                        ? 'border-primary-green bg-green-50 ring-1 ring-primary-green'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="font-semibold block text-gray-900 mb-0.5">SaudaPakka Site</span>
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Step 3: Broker Search (Hidden for Brokers) */}
                    {dealType === DealType.WITH_BROKER && !user?.is_active_broker && (
                        <section className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-opacity ${!selectedProperty ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-primary-green text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                                Select Broker
                            </h2>
                            <BrokerSearch
                                selectedBroker={selectedBroker}
                                onSelect={setSelectedBroker}
                            />
                        </section>
                    )}

                    {/* Step 3.5: Commission Rate (New) */}
                    <section className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-opacity ${!selectedProperty ? 'opacity-50 pointer-events-none' : ''}`}>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="bg-primary-green text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                {user?.is_active_broker ? '2' : (dealType === DealType.WITH_BROKER ? '4' : '3')}
                            </span>
                            Commission Terms
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={commissionRate}
                                        onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary-green focus:border-primary-green pr-10"
                                    />
                                    <span className="absolute right-3 top-3 text-gray-500 font-medium">%</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Standard rate is 2.0%. You can adjust this as per agreement.</p>
                            </div>
                        </div>
                    </section>

                    {/* Step 4: Sign (Initiator) */}
                    <section className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-opacity ${(!selectedProperty || (dealType === DealType.WITH_BROKER && !selectedBroker && !user?.is_active_broker)) ? 'opacity-50 pointer-events-none' : ''}`}>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="bg-primary-green text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                {user?.is_active_broker ? '3' : (dealType === DealType.WITH_BROKER ? '5' : '4')}
                            </span>
                            Confirm & Submit
                        </h2>

                        <div className="space-y-4">
                            <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="w-5 h-5 mt-0.5 text-primary-green rounded focus:ring-primary-green border-gray-300"
                                />
                                <div>
                                    <span className="text-sm text-gray-900 font-medium block">I agree to the terms.</span>
                                    <p className="text-xs text-gray-500 mt-1">By submitting, you initiate a formal mandate request.</p>
                                </div>
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Sign Button logic */}
                                {!signature ? (
                                    <button
                                        onClick={() => setShowSignModal(true)}
                                        className="py-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-primary-green hover:text-primary-green hover:bg-green-50 transition-all group"
                                    >
                                        <PenTool className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="font-semibold text-sm">Sign Mandate</span>
                                    </button>
                                ) : (
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-200 flex flex-col items-center justify-center gap-1 cursor-pointer" onClick={() => setShowSignModal(true)}>
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-1">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <p className="font-bold text-green-800 text-sm">Signed</p>
                                    </div>
                                )}

                                {/* Selfie Button Logic */}
                                {!selfie ? (
                                    <button
                                        onClick={() => setShowSelfieModal(true)}
                                        className="py-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-primary-green hover:text-primary-green hover:bg-green-50 transition-all group"
                                    >
                                        <Camera className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="font-semibold text-sm">Take Selfie</span>
                                    </button>
                                ) : (
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-200 flex flex-col items-center justify-center gap-1 cursor-pointer relative overflow-hidden group" onClick={() => setShowSelfieModal(true)}>
                                        <img src={URL.createObjectURL(selfie)} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                                        <div className=" z-10 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-1">
                                            <Camera className="w-4 h-4" />
                                        </div>
                                        <p className="z-10 font-bold text-green-800 text-sm drop-shadow-sm">Captured</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !selectedProperty || !termsAccepted || (dealType === DealType.WITH_BROKER && !selectedBroker && !user?.is_active_broker) || !signature || !selfie}
                            className="w-full mt-6 bg-primary-green hover:bg-dark-green text-white px-6 py-3 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-900/10 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : "Initiate Mandate Request"}
                        </button>
                    </section>

                </div>

                {/* Right Col: Letter Preview */}
                <div className="lg:col-span-7">
                    <div className="sticky top-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Draft Mandate Letter
                            </h3>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Preview Mode</span>
                        </div>

                        {selectedProperty && fullPropertyDetails ? (
                            <div className="lg:col-span-2">
                                <div className="sticky top-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Mandate Draft Preview</h3>
                                    <MandateLetter
                                        dealType={dealType}
                                        property={fullPropertyDetails}
                                        mandate={{
                                            is_exclusive: true,
                                            commission_rate: commissionRate,
                                            broker_name: user?.is_active_broker ? user.full_name : selectedBroker?.full_name,
                                            // Show selfie if captured
                                            seller_selfie: !isBrokerInitiator && selfie ? URL.createObjectURL(selfie) : undefined,
                                            broker_selfie: isBrokerInitiator && selfie ? URL.createObjectURL(selfie) : undefined
                                        }}
                                        activeSigner={activeSigner}
                                        isSigned={false}
                                        ownerSignatureUrl={!isBrokerInitiator && signature ? URL.createObjectURL(signature) : undefined}
                                        signatureUrl={isBrokerInitiator && signature ? URL.createObjectURL(signature) : undefined}
                                        onSign={(file) => setSignature(file)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="h-[600px] border border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                                <Eye className="w-8 h-8 mb-2 opacity-50" />
                                <p>Select a property to generate draft</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Sign Modal */}
            {showSignModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 sm:duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Digital Signature</h3>
                            <button onClick={() => setShowSignModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                <XCircle className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-gray-500 text-sm mb-4">Please sign below to authorize this mandate request.</p>

                        <div className="mb-6">
                            <SignaturePad onEnd={(file) => setSignature(file)} />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 pb-4 sm:pb-0 safe-area-bottom">
                            <button
                                onClick={() => setShowSignModal(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowSignModal(false)}
                                disabled={!signature}
                                className="bg-primary-green hover:bg-dark-green text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Confirm Signature
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Selfie Modal */}
            {showSelfieModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Selfie Verification</h3>
                            <button onClick={() => setShowSelfieModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                <XCircle className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-gray-500 text-sm mb-4">Please take a clear selfie for identity verification.</p>

                        <SelfieCapture
                            onCapture={(file) => {
                                setSelfie(file);
                                setShowSelfieModal(false);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
