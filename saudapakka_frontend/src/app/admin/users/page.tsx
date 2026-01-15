"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";
import UserVerificationModal from "@/components/admin/UserVerificationModal";
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    CheckBadgeIcon,
    ShieldCheckIcon,
    UserIcon,
    TrashIcon,
    ClockIcon
} from "@heroicons/react/24/outline";

type User = {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    is_active_seller: boolean;
    is_active_broker: boolean;
    role_category?: string;
    is_staff?: boolean;
    kyc_status: string;
    is_kyc_verified: boolean;
    verified_at?: string;
};

export default function AdminUsersPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [search, setSearch] = useState("");

    // Calculate role counts - must match filtering logic exactly
    const roleCounts = {
        all: users.length,
        admin: users.filter(u => u.is_staff).length,
        buyer: users.filter(u => !u.is_staff && u.role_category === 'BUYER').length,
        seller: users.filter(u => !u.is_staff && u.role_category === 'SELLER').length,
        builder: users.filter(u => !u.is_staff && u.role_category === 'BUILDER').length,
        broker: users.filter(u => !u.is_staff && (u.role_category === 'BROKER' || u.is_active_broker)).length,
        plotting: users.filter(u => !u.is_staff && u.role_category === 'PLOTTING_AGENCY').length,
    };

    // Modal State
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

    useEffect(() => {
        if (user?.is_staff) {
            fetchUsers();
        }
    }, [user]); // Removed 'filter' dependency - we filter on frontend only

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/admin/users/?role=ALL`); // Always fetch ALL users
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyClick = (userId: string) => {
        setSelectedUserId(userId);
        setIsVerifyModalOpen(true);
    };

    const handleVerificationComplete = () => {
        fetchUsers(); // Refresh list to show new status
    };

    const handleManualKYCVerify = async (userId: string, userName: string) => {
        if (!confirm(`Manually verify KYC for ${userName}? This will mark them as verified without DigiLocker.`)) return;

        try {
            await api.post(`/api/admin/users/${userId}/verify-kyc/`, { action: 'APPROVE' });
            fetchUsers(); // Refresh to show updated status
            alert(`${userName} has been manually verified!`);
        } catch (error) {
            console.error("Failed to verify KYC", error);
            alert("Failed to verify KYC. Please try again.");
        }
    };

    const handleDeleteClick = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete ${userName}? This action cannot be undone.`)) return;

        try {
            setLoading(true); // Optimistic or block interaction
            await api.delete(`/api/admin/users/${userId}/`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            console.error("Failed to delete user", error);
            alert("Failed to delete user. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        // First apply search filter
        const matchesSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        // Then apply role filter
        if (filter === 'ALL') return true;
        if (filter === 'ADMIN') return u.is_staff;
        if (filter === 'BUYER') return !u.is_staff && u.role_category === 'BUYER';
        if (filter === 'SELLER') return !u.is_staff && u.role_category === 'SELLER';
        if (filter === 'BUILDER') return !u.is_staff && u.role_category === 'BUILDER';
        if (filter === 'BROKER') return !u.is_staff && (u.role_category === 'BROKER' || u.is_active_broker);
        if (filter === 'PLOTTING_AGENCY') return !u.is_staff && u.role_category === 'PLOTTING_AGENCY';

        return true;
    });

    if (!user?.is_staff) {
        return <div className="p-10 text-center text-red-500 font-bold">⛔ Admin Access Required</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
                    <p className="text-gray-500 mt-1">Monitor users, verified badges, and KYC requests.</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 flex-wrap">
                    <button
                        onClick={() => setFilter("ALL")}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'ALL' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        All <span className="ml-1 opacity-70">({roleCounts.all})</span>
                    </button>
                    <button
                        onClick={() => setFilter("ADMIN")}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'ADMIN' ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Admins <span className="ml-1 opacity-70">({roleCounts.admin})</span>
                    </button>
                    <button
                        onClick={() => setFilter("BUYER")}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'BUYER' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Buyers <span className="ml-1 opacity-70">({roleCounts.buyer})</span>
                    </button>
                    <button
                        onClick={() => setFilter("SELLER")}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'SELLER' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Sellers <span className="ml-1 opacity-70">({roleCounts.seller})</span>
                    </button>
                    <button
                        onClick={() => setFilter("BUILDER")}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'BUILDER' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Builders <span className="ml-1 opacity-70">({roleCounts.builder})</span>
                    </button>
                    <button
                        onClick={() => setFilter("BROKER")}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'BROKER' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Brokers <span className="ml-1 opacity-70">({roleCounts.broker})</span>
                    </button>
                    <button
                        onClick={() => setFilter("PLOTTING_AGENCY")}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filter === 'PLOTTING_AGENCY' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Agencies <span className="ml-1 opacity-70">({roleCounts.plotting})</span>
                    </button>
                </div>
            </div>

            {/* Search & Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-4 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/80">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User Details</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={4} className="p-10 text-center text-gray-400">Loading directory...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="p-10 text-center text-gray-400">No users found matching your criteria.</td></tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                                                    {u.full_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900">{u.full_name || "Unnamed User"}</div>
                                                    <div className="text-sm text-gray-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1 items-start">
                                                {u.is_staff ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                        <ShieldCheckIcon className="w-3 h-3" /> Admin
                                                    </span>
                                                ) : u.role_category === 'BUILDER' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                                        <UserIcon className="w-3 h-3" /> Builder
                                                    </span>
                                                ) : u.role_category === 'PLOTTING_AGENCY' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                        <UserIcon className="w-3 h-3" /> Plotting Agency
                                                    </span>
                                                ) : u.role_category === 'BROKER' || u.is_active_broker ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                        <ShieldCheckIcon className="w-3 h-3" /> Broker
                                                    </span>
                                                ) : u.role_category === 'SELLER' || u.is_active_seller ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                        <UserIcon className="w-3 h-3" /> Seller
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600 border border-green-200">
                                                        Buyer
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {u.is_kyc_verified ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                        <CheckBadgeIcon className="w-3.5 h-3.5 mr-1" />
                                                        Verified
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">
                                                        {u.kyc_status === 'VERIFIED' ? '✓ DigiLocker' : '✓ Admin Verified'}
                                                    </span>
                                                </div>
                                            ) : u.kyc_status === 'REJECTED' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                    <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-red-500"></span>
                                                    Rejected
                                                </span>
                                            ) : u.kyc_status === 'INITIATED' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                                                    <ClockIcon className="w-3.5 h-3.5 mr-1" />
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                                                    <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-gray-400"></span>
                                                    Not Started
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex items-center justify-end gap-3">
                                                {!u.is_kyc_verified && !u.is_staff && (
                                                    <button
                                                        onClick={() => handleManualKYCVerify(u.id, u.full_name)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all"
                                                        title="Manually Verify KYC"
                                                    >
                                                        <CheckBadgeIcon className="w-4 h-4" />
                                                        Verify KYC
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteClick(u.id, u.full_name)}
                                                    className="p-1 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete User"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Verification Modal */}
            {isVerifyModalOpen && selectedUserId && (
                <UserVerificationModal
                    userId={selectedUserId}
                    isOpen={isVerifyModalOpen}
                    onClose={() => setIsVerifyModalOpen(false)}
                    onStatusChange={handleVerificationComplete}
                />
            )}
        </div>
    );
}
