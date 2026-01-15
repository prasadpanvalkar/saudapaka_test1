"use client";

import { useRouter } from "next/navigation";
import { XMarkIcon, ShieldCheckIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

interface KYCVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function KYCVerificationModal({ isOpen, onClose }: KYCVerificationModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const handleStartKYC = () => {
        router.push("/dashboard/kyc");
    };

    const handleContactSupport = () => {
        // Open email client or support modal
        window.location.href = "mailto:support@saudapakka.com?subject=KYC Verification Support";
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>

                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                            <ShieldCheckIcon className="w-10 h-10 text-blue-600" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                            KYC Verification Required
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            You need to complete KYC verification to list properties or manage mandates.
                            Please verify your identity or contact our support team for assistance.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleStartKYC}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                        >
                            Start KYC Verification
                        </button>

                        <button
                            onClick={handleContactSupport}
                            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            <EnvelopeIcon className="w-5 h-5" />
                            Contact Support
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full text-gray-500 py-2 px-6 rounded-xl font-medium hover:text-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
