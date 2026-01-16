"use client";

import { useState, useEffect } from "react";
import { mandateService } from "@/services/mandateService";
import { Mandate, MandateStatus } from "@/types/mandate";
import Link from "next/link";
import {
    Trash2,
    Eye,
    Search,
    Filter,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Download
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { downloadMandatePDF } from "@/utils/mandateDownload";

export default function AdminMandatesPage() {
    const [mandates, setMandates] = useState<Mandate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<MandateStatus | "ALL">("ALL");
    const [deleteId, setDeleteId] = useState<string | number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMandates(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchMandates = async (query = "") => {
        try {
            setLoading(true);
            const data = await mandateService.getMandates(query);
            setMandates(data);
        } catch (error) {
            console.error("Failed to fetch mandates:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await mandateService.deleteMandate(deleteId);
            setMandates(mandates.filter(m => m.id !== deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error("Failed to delete mandate:", error);
            alert("Failed to delete mandate");
        }
    };

    const filteredMandates = mandates.filter(m => {
        if (filter === "ALL") return true;
        return m.status === filter;
    });

    const getStatusColor = (status: MandateStatus) => {
        switch (status) {
            case MandateStatus.ACTIVE: return "bg-green-100 text-green-800";
            case MandateStatus.PENDING: return "bg-yellow-100 text-yellow-800";
            case MandateStatus.REJECTED: return "bg-red-100 text-red-800";
            case MandateStatus.EXPIRED: return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mandate Management</h1>
                    <p className="text-gray-500">Monitor and manage all platform agreements</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                {/* Search Input */}
                <div className="relative w-full md:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-green focus:border-primary-green sm:text-sm"
                        placeholder="Search by ID, Property, or Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                    {(["ALL", MandateStatus.PENDING, MandateStatus.ACTIVE, MandateStatus.REJECTED] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === s
                                ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                }`}
                        >
                            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-green" />
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Mandate ID</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Property</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Owner</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredMandates.map((mandate) => (
                                <tr key={mandate.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">#{mandate.mandate_number || mandate.id}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {mandate.property_title || `Property #${mandate.property_item}`}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {mandate.seller_name || "Unknown"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                            {mandate.deal_type === 'WITH_PLATFORM' ? 'Platform' : 'Broker'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(mandate.status)}`}>
                                            {mandate.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(mandate.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/mandates/${mandate.id}`}
                                                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-primary-green transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => setDeleteId(mandate.id)}
                                                className="p-2 hover:bg-red-50 rounded-full text-gray-500 hover:text-red-600 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredMandates.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            No mandates found matching filter.
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Mandate?</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Are you sure you want to delete this mandate? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
