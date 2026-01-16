import React, { useRef, useState } from 'react';
import { PropertyDetail } from '@/types/property';
import { Mandate, DealType } from '@/types/mandate';
import { User } from '@/types/user';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, CheckCircle, Camera } from 'lucide-react';


interface SignatureBlockProps {
    role: 'SELLER' | 'BROKER';
    activeSigner?: 'SELLER' | 'BROKER';
    isSigned: boolean;
    signatureUrl?: string; // Existing signature from DB
    signatureFile?: File | null; // Currently captured signature (preview)
    selfieUrl?: string; // Selfie URL (blob or DB)
    onSign: (file: File) => void;
    onClear: () => void;
    title: string;
    subTitle: string;
    dateStr: string;
    name: string;
    designation?: string;
    isPlatform?: boolean;
}

const SignatureBlock = ({
    role,
    activeSigner,
    isSigned,
    signatureUrl,
    signatureFile,
    selfieUrl,
    onSign,
    onClear,
    title,
    subTitle,
    dateStr,
    name,
    designation
}: SignatureBlockProps) => {
    // Determine if this block is currently interactive
    // It is interactive if:
    // 1. It matches the 'activeSigner' prop (e.g. Seller is viewing and needs to sign Seller block)
    // 2. AND it is NOT yet signed (no URL or file)
    const isInteractive = activeSigner === role && !isSigned && !signatureUrl && !signatureFile;

    // Display Logic:
    // Show signature image if we have a URL (saved) or File (just signed)
    const showSignature = signatureUrl || signatureFile;
    const signatureSrc = signatureFile ? URL.createObjectURL(signatureFile) : signatureUrl;

    const showSelfie = !!selfieUrl;

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="w-64 h-40 border-b-2 border-slate-300 relative bg-slate-50 flex items-center justify-center">
                {/* Signature Layer */}
                {showSignature ? (
                    <div className="relative w-full h-full group">
                        <img
                            src={signatureSrc}
                            alt={`${title} Signature`}
                            className="w-full h-full object-contain"
                        />
                        {/* Allow clearing if it's a fresh file preview (not saved URL) */}
                        {signatureFile && (
                            <button
                                onClick={onClear}
                                className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Clear Signature"
                            >
                                <Eraser className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="text-slate-400 text-sm italic">
                        {isInteractive ? "Waiting for signature..." : "Pending Signature"}
                    </div>
                )}
            </div>

            {/* Selfie Display (Below Signature) */}
            {showSelfie && (
                <div className="w-32 h-32 rounded-lg border border-slate-200 overflow-hidden shadow-sm relative group bg-gray-100">
                    <img
                        src={selfieUrl}
                        alt="Verification Selfie"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] py-1 text-center">
                        Verified
                    </div>
                </div>
            )}

            <div className="text-center">
                <p className="font-bold text-slate-900 text-lg uppercase tracking-wide">{name}</p>
                <p className="text-slate-600 font-medium">{subTitle}</p>
                {designation && <p className="text-slate-500 text-sm mt-1">{designation}</p>}
                <p className="text-slate-400 text-xs mt-2">Date: {dateStr}</p>
            </div>
        </div>
    );
};


interface MandateLetterProps {
    property: PropertyDetail;
    mandate?: Partial<Mandate>;
    user?: Partial<User>;
    dealType?: DealType; // New Prop
    onSign?: (file: File) => void;
    isSigned?: boolean;
    signatureUrl?: string; // Partner Signature
    ownerSignatureUrl?: string; // Owner Signature
    activeSigner?: 'SELLER' | 'BROKER'; // New Prop: Controls which slot is interactive
    createdAt?: string; // New: Creation Timestamp
    signedAt?: string;  // New: Signing Timestamp
    roleTitle?: string; // e.g. "Builder", "Plotting Agency"
}

export const MandateLetter = ({
    property,
    mandate,
    dealType = DealType.WITH_BROKER, // Default
    onSign,
    isSigned = false,
    signatureUrl,
    ownerSignatureUrl,
    activeSigner = 'SELLER', // Default to Seller for backwards compat if needed, but Page should pass explicitly
    createdAt,
    signedAt,
    roleTitle
}: MandateLetterProps) => {
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const sigPad = useRef<any>(null);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);

    // --- Helpers ---
    const formatCurrency = (amount: number | string | undefined) => {
        if (!amount) return "₹ 0";
        return Number(amount).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        });
    };

    const formatDate = (dateStr: string | Date | undefined) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        }).format(date);
    };

    const calculateEndDate = (startDate: Date = new Date()) => {
        const end = new Date(startDate);
        end.setDate(end.getDate() + 90);
        return end;
    };

    // --- Data Mapping ---
    const ownerName = property.owner_details?.full_name || "Property Owner";

    // Logic for Partner Name & Designation
    const isPlatform = dealType === DealType.WITH_PLATFORM;

    const partnerName = isPlatform
        ? "SaudaPakka (A Brand of SaudaPakka)"
        : (mandate?.broker_name || "Exclusive Marketing and Sales Partner");

    const designation = isPlatform
        ? "Official Exclusive Platform Marketing Partner"
        : "Exclusive Marketing and Sales Partner";

    // Address Logic
    const fullAddress = [
        property.address_line,
        property.city,
        property.pincode
    ].filter(Boolean).join(', ') || "Property Address";

    // Specs
    const area = property.carpet_area ? `${property.carpet_area} Sq.Ft` : "As per records";
    const floor = property.specific_floor ? `Floor ${property.specific_floor}` : "Standard Unit";

    const today = new Date();
    // Use createdAt if available, else today
    const initiationDateStr = createdAt ? formatDate(createdAt) : formatDate(today);

    // For end date, we ideally want creation date + 90 days, or today + 90
    const baseDate = createdAt ? new Date(createdAt) : today;
    const endDateStr = new Intl.DateTimeFormat('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    }).format(calculateEndDate(baseDate));


    const project = property.project_name || property.title || "Project Name";

    // --- Scroll Detection ---
    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                setScrolledToBottom(true);
            }
        }
    };

    // --- Render ---
    return (
        <div className="w-full max-w-5xl mx-auto bg-slate-50 border border-slate-200 shadow-sm rounded-xl overflow-hidden my-8 font-sans text-slate-800">
            {/* Header / Brand Strip */}
            <div className="h-2 bg-slate-800 w-full" />

            <div
                id="mandate-letter-content"
                ref={containerRef}
                onScroll={handleScroll}
                className="p-12 md:p-16 max-h-[80vh] overflow-y-auto custom-scrollbar relative"
            >
                {/* Title */}
                <header className="text-center mb-12">
                    <h1 className="text-3xl font-serif font-bold text-slate-900 border-b-2 border-slate-200 pb-4 inline-block">
                        MANDATE LETTER
                    </h1>
                    <p className="mt-4 text-slate-500 text-sm uppercase tracking-widest font-medium">Marketing Authority Agreement</p>
                    <div className="mt-2 text-xs text-slate-400 font-mono">
                        Ref: {mandate?.mandate_number || "PENDING"} | Initiated: {initiationDateStr}
                    </div>
                </header>

                <div className="space-y-8 text-base leading-relaxed whitespace-pre-wrap">
                    {/* Date and Parties */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p><strong>Date:</strong> <span className="bg-yellow-50/50 px-1 rounded font-medium">{initiationDateStr}</span></p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="mb-2"><strong>To,</strong></p>
                        <p className="text-lg font-semibold">{ownerName}</p>
                        <p>{project}</p>
                        <p>{fullAddress}</p>
                    </div>

                    <p className="mb-6">Dear <strong>Sir/Madam</strong>,</p>

                    <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 mb-8">
                        <p className="font-serif italic text-center text-slate-700">
                            Re: Appointment as <strong>{designation}</strong> for Sale/Lease of Property
                        </p>
                    </div>

                    {/* Section 1 */}
                    <section className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">1. Appointment</h3>
                        <p className="leading-relaxed">
                            We, <strong>{ownerName}</strong>, hereby appoint <span className="font-bold bg-yellow-50/50 px-1 rounded">{partnerName}</span> (hereinafter referred to as “the Marketing Partner”),
                            for 90 days with effect from <strong>{initiationDateStr}</strong> until <strong>{endDateStr}</strong>,
                            as <strong>{designation}</strong> for the property detailed below.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">2. Property Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-white p-6 rounded-lg border border-slate-200/60">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Project</span>
                                <span className="font-medium text-right">{project}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Unit Type</span>
                                <span className="font-medium text-right">{property.bhk_config ? `${property.bhk_config} BHK` : property.property_type_display}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Carpet Area</span>
                                <span className="font-medium text-right">{area}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">Floor</span>
                                <span className="font-medium text-right">{floor}</span>
                            </div>
                            <div className="col-span-1 md:col-span-2 flex justify-between pt-2">
                                <span className="text-slate-500">Full Address</span>
                                <span className="font-medium text-right max-w-[60%] text-right">{fullAddress}</span>
                            </div>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">3. Authority Granted</h3>
                        <ul className="list-disc pl-5 space-y-2 text-slate-700 leading-relaxed">
                            <li><strong>Marketing & Promotion:</strong> Design, develop and execute all marketing campaigns (digital, print, hoarding, events).</li>
                            <li><strong>Lead Generation:</strong> Arrange site visits, manage inquiries, and follow‑up with prospective buyers.</li>
                            <li><strong>Negotiation:</strong> Negotiate sale/lease terms within the price band approved by Owner.</li>
                            <li><strong>Documentation:</strong> Assist in preparation of sale agreements and related paperwork.</li>
                        </ul>
                    </section>

                    {/* Section 4 */}
                    <section className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">4. Commission & Payment Terms</h3>
                        <ul className="list-disc pl-5 space-y-2 text-slate-700 leading-relaxed">
                            <li>
                                <strong>Commission Rate:</strong> <strong>{mandate?.commission_rate || '2.0'}%</strong> of the total sale/lease consideration
                                or a fixed amount of <strong>{formatCurrency(property.total_price)}</strong> (approximate based on ask).
                            </li>
                            <li><strong>Payment Schedule:</strong> Within <strong>7 days</strong> of receipt of full payment from buyer/tenant.</li>
                            <li><strong>GST:</strong> As applicable per law.</li>
                        </ul>
                    </section>

                    {/* Section 5 */}
                    <section className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">5. Governing Law</h3>
                        <p className="leading-relaxed">
                            This mandate shall be governed by the laws of <strong>India</strong>.
                            Disputes shall be resolved amicably; failing which, jurisdiction will lie with the courts of <strong>Mumbai, Maharashtra</strong>.
                        </p>
                    </section>

                    <hr className="my-12 border-slate-200" />

                    {/* Section 6 - Signature */}
                    <div className="bg-slate-100/50 p-8 rounded-xl border border-slate-200">
                        <h3 className="text-xl font-serif font-bold text-center mb-8">Accepted and Agreed</h3>
                        {signedAt && (
                            <p className="text-center text-xs text-green-600 font-medium mb-4 flex items-center justify-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Confirmed on {formatDate(signedAt)}
                            </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <SignatureBlock
                                role="SELLER"
                                activeSigner={activeSigner}
                                isSigned={isSigned}
                                signatureUrl={ownerSignatureUrl}
                                signatureFile={signatureFile}
                                selfieUrl={mandate?.seller_selfie || undefined}
                                onSign={(file) => { setSignatureFile(file); if (onSign) onSign(file); }}
                                onClear={() => setSignatureFile(null)}
                                title={roleTitle || "Property Owner"}
                                subTitle={roleTitle || "Owner"}
                                dateStr={initiationDateStr}
                                name={ownerName}
                            />
                            <SignatureBlock
                                role="BROKER"
                                activeSigner={activeSigner}
                                isSigned={isSigned}
                                signatureUrl={signatureUrl}
                                signatureFile={signatureFile}
                                selfieUrl={mandate?.broker_selfie || undefined}
                                onSign={(file) => { setSignatureFile(file); if (onSign) onSign(file); }}
                                onClear={() => setSignatureFile(null)}
                                title="Partner"
                                subTitle={isPlatform ? "For SaudaPakka" : "For Marketing Partner"}
                                dateStr={signedAt ? formatDate(signedAt) : (isSigned ? initiationDateStr : "Pending")}
                                name={isPlatform ? "SaudaPakka Authorized Signatory" : partnerName}
                                designation={designation}
                                isPlatform={isPlatform}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Message */}
                {!scrolledToBottom && !isSigned && !signatureUrl && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-6 py-3 rounded-full shadow-lg text-sm backdrop-blur-sm animate-pulse pointer-events-none z-50">
                        Please scroll to the bottom to sign
                    </div>
                )}
            </div>
        </div>
    );
};

export default MandateLetter;
