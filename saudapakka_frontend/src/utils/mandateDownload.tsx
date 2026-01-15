import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { MandatePDFDocument } from '@/components/mandates/MandatePDFDocument';
import { PropertyDetail } from '@/types/property';
import { Mandate } from '@/types/mandate';
import { User } from '@/types/user';

export const downloadMandatePDF = async (
    mandate: Partial<Mandate>,
    property: PropertyDetail,
    user?: Partial<User>
) => {
    try {
        const oldCursor = document.body.style.cursor;
        document.body.style.cursor = 'wait';

        // Render the PDF component to a blob stream
        const blob = await pdf(
            <MandatePDFDocument
                property={property}
                mandate={mandate}
                user={user}
                dealType={mandate.deal_type as any}
                signatureUrl={mandate.broker_signature || undefined}
                ownerSignatureUrl={mandate.seller_signature || undefined}
                sellerSelfieUrl={mandate.seller_selfie || undefined}
                brokerSelfieUrl={mandate.broker_selfie || undefined}
                createdAt={mandate.created_at}
                signedAt={mandate.signed_at}
            />
        ).toBlob();

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Mandate_${mandate.mandate_number || mandate.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        document.body.style.cursor = oldCursor;
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Failed to generate PDF. Please try again.');
        document.body.style.cursor = 'default';
    }
};
