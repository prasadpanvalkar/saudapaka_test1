
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { PropertyDetail } from '@/types/property';
import { Mandate, DealType } from '@/types/mandate';
import { User } from '@/types/user';

// Register a standard font (optional, using built-in Helvetica for robustness first)
// Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf' });

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#1e293b', // slate-800
        lineHeight: 1.5,
    },
    headerStrip: {
        height: 8,
        backgroundColor: '#1e293b', // slate-800
        marginBottom: 30,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#e2e8f0', // slate-200
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#0f172a', // slate-900
    },
    subtitle: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 2,
        color: '#64748b', // slate-500
        marginTop: 5,
    },
    refText: {
        fontSize: 8,
        color: '#94a3b8', // slate-400
        marginTop: 5,
    },
    section: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    label: {
        fontWeight: 'bold',
        width: '40%',
    },
    value: {
        width: '60%',
        textAlign: 'right',
        fontWeight: 'bold',
    },
    bold: {
        fontWeight: 'bold',
    },
    highlight: {
        backgroundColor: '#fef9c3', // yellow-50
        padding: 2,
    },
    appointmentBox: {
        backgroundColor: '#f1f5f9', // slate-100
        padding: 10,
        borderRadius: 4,
        marginTop: 10,
        marginBottom: 20,
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#334155', // slate-700
    },
    heading: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#0f172a', // slate-900
    },
    gridBox: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
        padding: 10,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 4,
        marginBottom: 4,
    },
    gridLabel: {
        color: '#64748b', // slate-500
    },
    gridValue: {
        fontWeight: 'bold',
        textAlign: 'right',
    },
    listItem: {
        marginBottom: 5,
        flexDirection: 'row',
    },
    bullet: {
        width: 10,
    },
    itemContent: {
        flex: 1,
    },
    signatureSection: {
        backgroundColor: '#f8fafc', // slate-50
        padding: 20,
        borderRadius: 8,
        marginTop: 20,
    },
    signatureGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 20,
    },
    signatureBlock: {
        width: '45%',
        alignItems: 'center',
    },
    signatureBox: {
        height: 60,
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signatureImage: {
        height: 50,
        objectFit: 'contain',
    },
    signerName: {
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: 10,
    },
    signerRole: {
        fontSize: 8,
        color: '#475569',
    },
    verifiedBadge: {
        color: '#16a34a', // green-600
        fontSize: 8,
        textAlign: 'center',
        marginBottom: 10,
    },
    selfieContainer: {
        width: 80,
        height: 80,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden',
        alignSelf: 'center',
        position: 'relative',
    },
    selfieImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    verifiedOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        color: 'white',
        fontSize: 6,
        textAlign: 'center',
        padding: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 8,
        color: '#cbd5e1',
    }
});

interface MandatePDFProps {
    property: PropertyDetail;
    mandate?: Partial<Mandate>;
    user?: Partial<User>;
    dealType?: DealType;
    signatureUrl?: string;     // URL or base64
    ownerSignatureUrl?: string; // URL or base64
    sellerSelfieUrl?: string;
    brokerSelfieUrl?: string;
    createdAt?: string;
    signedAt?: string;
}

export const MandatePDFDocument = ({
    property,
    mandate,
    dealType = DealType.WITH_BROKER,
    signatureUrl,
    ownerSignatureUrl,
    sellerSelfieUrl,
    brokerSelfieUrl,
    createdAt,
    signedAt
}: MandatePDFProps) => {
    // --- Helpers (Duplicated from MandateLetter.tsx) ---
    const formatCurrency = (amount: number | string | undefined) => {
        if (!amount) return "₹ 0";
        return Number(amount).toLocaleString('en-IN', {
            style: 'currency', currency: 'INR', maximumFractionDigits: 0
        });
    };

    const formatDate = (dateStr: string | Date | undefined) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        }).format(date);
    };

    const calculateEndDate = (startDate: Date = new Date()) => {
        const end = new Date(startDate);
        end.setDate(end.getDate() + 90);
        return end;
    };

    // --- Data Prep ---
    const ownerName = property.owner_details?.full_name || "Property Owner";
    const isPlatform = dealType === DealType.WITH_PLATFORM;
    const partnerName = isPlatform
        ? "SaudaPakka (A Brand of SaudaPakka)"
        : (mandate?.broker_name || "Exclusive Marketing and Sales Partner");
    const designation = isPlatform
        ? "Official Exclusive Platform Marketing Partner"
        : "Exclusive Marketing and Sales Partner";

    // Address
    const fullAddress = [
        property.address_line,
        property.city,
        property.pincode
    ].filter(Boolean).join(', ') || "Property Address";

    // Specs
    const area = property.carpet_area ? `${property.carpet_area} Sq.Ft` : "As per records";
    const floor = property.specific_floor ? `Floor ${property.specific_floor}` : "Standard Unit";

    const today = new Date();
    const initiationDateStr = createdAt ? formatDate(createdAt) : formatDate(today);
    const baseDate = createdAt ? new Date(createdAt) : today;
    const endDateStr = new Intl.DateTimeFormat('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    }).format(calculateEndDate(baseDate));

    const project = property.project_name || property.title || "Project Name";

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Strip */}
                <View style={styles.headerStrip} />

                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>MANDATE LETTER</Text>
                    <Text style={styles.subtitle}>Marketing Authority Agreement</Text>
                    <Text style={styles.refText}>
                        Ref: {mandate?.mandate_number || "PENDING"} | Initiated: {initiationDateStr}
                    </Text>
                </View>

                {/* Body Content */}

                {/* Date */}
                <View style={styles.section}>
                    <Text>Date: <Text style={styles.bold}>{initiationDateStr}</Text></Text>
                </View>

                {/* Recipient */}
                <View style={styles.section}>
                    <Text style={styles.bold}>To,</Text>
                    <Text style={[styles.bold, { fontSize: 12, marginTop: 4 }]}>{ownerName}</Text>
                    <Text>{project}</Text>
                    <Text>{fullAddress}</Text>
                </View>

                <Text style={{ marginBottom: 10 }}>Dear <Text style={styles.bold}>Sir/Madam</Text>,</Text>

                {/* Re Block */}
                <View style={styles.appointmentBox}>
                    <Text>Re: Appointment as <Text style={styles.bold}>{designation}</Text> for Sale/Lease of Property</Text>
                </View>

                {/* 1. Appointment */}
                <View style={styles.section}>
                    <Text style={styles.heading}>1. Appointment</Text>
                    <Text style={{ textAlign: 'justify' }}>
                        We, <Text style={styles.bold}>{ownerName}</Text>, hereby appoint <Text style={styles.bold}>{partnerName}</Text> (hereinafter referred to as “the Marketing Partner”),
                        for 90 days with effect from <Text style={styles.bold}>{initiationDateStr}</Text> until <Text style={styles.bold}>{endDateStr}</Text>,
                        as <Text style={styles.bold}>{designation}</Text> for the property detailed below.
                    </Text>
                </View>

                {/* 2. Property Details */}
                <View style={styles.section}>
                    <Text style={styles.heading}>2. Property Details</Text>
                    <View style={styles.gridBox}>
                        <View style={styles.gridRow}>
                            <Text style={styles.gridLabel}>Project</Text>
                            <Text style={styles.gridValue}>{project}</Text>
                        </View>
                        <View style={styles.gridRow}>
                            <Text style={styles.gridLabel}>Unit Type</Text>
                            <Text style={styles.gridValue}>{property.bhk_config ? `${property.bhk_config} BHK` : property.property_type_display}</Text>
                        </View>
                        <View style={styles.gridRow}>
                            <Text style={styles.gridLabel}>Carpet Area</Text>
                            <Text style={styles.gridValue}>{area}</Text>
                        </View>
                        <View style={styles.gridRow}>
                            <Text style={styles.gridLabel}>Floor</Text>
                            <Text style={styles.gridValue}>{floor}</Text>
                        </View>
                        <View style={[styles.gridRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.gridLabel}>Full Address</Text>
                            <Text style={[styles.gridValue, { maxWidth: 250 }]}>{fullAddress}</Text>
                        </View>
                    </View>
                </View>

                {/* 3. Authority Granted */}
                <View style={styles.section}>
                    <Text style={styles.heading}>3. Authority Granted</Text>
                    <View style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.itemContent}><Text style={styles.bold}>Marketing & Promotion:</Text> Design, develop and execute all marketing campaigns.</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.itemContent}><Text style={styles.bold}>Lead Generation:</Text> Arrange site visits, manage inquiries, and follow-up.</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.itemContent}><Text style={styles.bold}>Negotiation:</Text> Negotiate sale/lease terms within approved price band.</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.itemContent}><Text style={styles.bold}>Documentation:</Text> Assist in preparation of agreements.</Text>
                    </View>
                </View>

                {/* 4. Commission */}
                <View style={styles.section}>
                    <Text style={styles.heading}>4. Commission & Payment Terms</Text>
                    <View style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.itemContent}>
                            <Text style={styles.bold}>Commission Rate: {mandate?.commission_rate || '2.0'}%</Text> of consideration or fixed <Text style={styles.bold}>{formatCurrency(property.total_price)}</Text>.
                        </Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.itemContent}>
                            <Text style={styles.bold}>Payment Schedule:</Text> Within <Text style={styles.bold}>7 days</Text> of receipt of full payment.
                        </Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.itemContent}><Text style={styles.bold}>GST:</Text> As applicable per law.</Text>
                    </View>
                </View>

                {/* 5. Governing Law */}
                <View style={styles.section}>
                    <Text style={styles.heading}>5. Governing Law</Text>
                    <Text style={{ textAlign: 'justify' }}>
                        This mandate shall be governed by the laws of <Text style={styles.bold}>India</Text>.
                        Disputes shall be resolved amicably; failing which, jurisdiction will lie with the courts of <Text style={styles.bold}>Mumbai, Maharashtra</Text>.
                    </Text>
                </View>

                <View style={styles.signatureSection}>
                    <Text style={[styles.heading, { textAlign: 'center', fontSize: 14, textTransform: 'uppercase' }]}>Accepted and Agreed</Text>
                    {signedAt && (
                        <Text style={styles.verifiedBadge}>Verified & Confirmed on {formatDate(signedAt)}</Text>
                    )}

                    <View style={styles.signatureGrid}>
                        {/* Seller */}
                        <View style={styles.signatureBlock}>
                            <View style={styles.signatureBox}>
                                {ownerSignatureUrl ? (
                                    <Image src={ownerSignatureUrl} style={styles.signatureImage} />
                                ) : (
                                    <Text style={{ fontSize: 8, fontStyle: 'italic', color: '#94a3b8' }}>Pending Signature</Text>
                                )}
                            </View>

                            {/* Seller Selfie */}
                            {sellerSelfieUrl && (
                                <View style={styles.selfieContainer}>
                                    <Image src={sellerSelfieUrl} style={styles.selfieImage} />
                                    <Text style={styles.verifiedOverlay}>Verified</Text>
                                </View>
                            )}

                            <Text style={[styles.signerName, { marginTop: 5 }]}>{ownerName}</Text>
                            <Text style={styles.signerRole}>Property Owner</Text>
                            <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 2 }}>Date: {initiationDateStr}</Text>
                        </View>

                        {/* Broker */}
                        <View style={styles.signatureBlock}>
                            <View style={styles.signatureBox}>
                                {signatureUrl ? (
                                    <Image src={signatureUrl} style={styles.signatureImage} />
                                ) : (
                                    <Text style={{ fontSize: 8, fontStyle: 'italic', color: '#94a3b8' }}>Pending Signature</Text>
                                )}
                            </View>

                            {/* Broker Selfie */}
                            {brokerSelfieUrl && (
                                <View style={styles.selfieContainer}>
                                    <Image src={brokerSelfieUrl} style={styles.selfieImage} />
                                    <Text style={styles.verifiedOverlay}>Verified</Text>
                                </View>
                            )}

                            <Text style={[styles.signerName, { marginTop: 5 }]}>{isPlatform ? "SaudaPakka Authorized Signatory" : partnerName}</Text>
                            <Text style={styles.signerRole}>{isPlatform ? "For SaudaPakka" : "For Marketing Partner"}</Text>
                            <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 2 }}>
                                Date: {signedAt ? formatDate(signedAt) : "Pending"}
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.footer}>
                    Generated via SaudaPakka Platform | Ref: {mandate?.mandate_number || "PENDING"}
                </Text>

            </Page>
        </Document>
    );
};
