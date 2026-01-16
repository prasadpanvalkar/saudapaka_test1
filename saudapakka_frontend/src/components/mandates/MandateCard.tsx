import React from 'react';
import Link from 'next/link';
import { Mandate, MandateStatus, InitiatedBy } from '@/types/mandate';
import { Calendar, User, FileText, AlertCircle, Clock } from 'lucide-react';

interface MandateCardProps {
    mandate: Mandate;
}

const MandateCard: React.FC<MandateCardProps> = ({ mandate }) => {
    const getStatusColor = (status: MandateStatus) => {
        switch (status) {
            case MandateStatus.ACTIVE:
                return 'bg-green-100 text-green-800 border-green-200';
            case MandateStatus.PENDING:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case MandateStatus.REJECTED:
                return 'bg-red-100 text-red-800 border-red-200';
            case MandateStatus.EXPIRED:
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: MandateStatus) => {
        return status.replace(/_/g, ' ');
    };

    // Determine the counterparty name to show
    // If I am the seller, show Broker Name. If I am the broker, show Seller Name.
    // Ideally backend should provide a 'counterparty_name' or we derive it from user context.
    // For now, let's display both or check 'initiated_by' to guess context if not provided.
    // Assuming the user viewing this is the one logged in.
    // simpler for now: Show "Broker: X" or "Seller: Y" based on data availability.

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-5 flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(mandate.status)}`}>
                        {getStatusLabel(mandate.status)}
                    </div>
                    {mandate.expiry_date && (
                        <div className="flex items-center text-xs text-gray-500 gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Expires: {new Date(mandate.expiry_date).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{mandate.property_title || `Property #${mandate.property_item}`}</h3>
                <p className="text-xs text-gray-500 mb-4">Mandate ID: #{mandate.mandate_number || mandate.id}</p>

                <div className="space-y-2 text-sm text-gray-600 mb-6">
                    {mandate.deal_type === 'WITH_BROKER' && (
                        <>
                            {mandate.broker_name && (
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">Broker: {mandate.broker_name}</span>
                                </div>
                            )}
                            {mandate.seller_name && (
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">Seller: {mandate.seller_name}</span>
                                </div>
                            )}
                        </>
                    )}

                    {mandate.deal_type === 'WITH_PLATFORM' && (
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">SaudaPakka Partner</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Created: {new Date(mandate.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex gap-2">
                <Link
                    href={`/dashboard/mandates/${mandate.id}`}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                >
                    View Details
                </Link>
                {mandate.status === MandateStatus.PENDING && (
                    <Link
                        href={`/dashboard/mandates/${mandate.id}`}
                        className="flex-1 bg-primary-green hover:bg-dark-green text-white py-2 rounded-lg text-sm font-medium transition-colors text-center"
                    >
                        Review Request
                    </Link>
                )}
            </div>
        </div>
    );
};

export default MandateCard;
