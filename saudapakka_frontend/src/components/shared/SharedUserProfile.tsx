"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Mail, Phone, Shield, Briefcase, Star, CheckCircle } from "lucide-react";

export default function SharedUserProfile() {
    const { user } = useAuth();

    // If loading or not user (layout handles redirect, but safe check)
    if (!user) return <div className="p-8 text-center text-gray-500">Loading user profile...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Profile</h1>
                <p className="text-gray-500 mt-1">View and manage your account details and professional identity.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Details Card */}
                <Card className="shadow-sm border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <UserCircle className="w-5 h-5 text-accent-green" />
                            </div>
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Name */}
                        <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Full Name</span>
                            <span className="text-lg font-medium text-gray-900">{user.full_name}</span>
                        </div>

                        {/* Email */}
                        <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Email Amount</span>
                            <div className="flex items-center gap-2 text-gray-700">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-base">{user.email}</span>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Phone Number</span>
                            <div className="flex items-center gap-2 text-gray-700">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-base">{user.phone_number || "Not provided"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Status Card */}
                <Card className="shadow-sm border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Shield className="w-5 h-5 text-blue-600" />
                            </div>
                            Account Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Role */}
                        <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Current Role</span>
                            <div className="mt-1">
                                {user.is_staff || user.is_superuser ? (
                                    <Badge className="px-3 py-1 text-sm font-medium bg-red-600 hover:bg-red-700">
                                        Administrator
                                    </Badge>
                                ) : (
                                    <Badge variant={user.role_category === 'BROKER' ? 'default' : 'secondary'} className="px-3 py-1 text-sm font-medium">
                                        {user.role_category?.replace('_', ' ') || "USER"}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* KYC Status - Hide for Admins */}
                        {!user.is_staff && !user.is_superuser && (
                            <div className="flex flex-col space-y-1">
                                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">KYC Verification</span>
                                <div className="mt-1">
                                    {user.kyc_verified ? (
                                        <div className="inline-flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-full text-sm font-medium border border-green-100">
                                            <CheckCircle className="w-4 h-4" />
                                            Verified Identity
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full text-sm font-medium border border-amber-100">
                                            <Shield className="w-4 h-4" />
                                            Pending Verification
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Broker Specific Details (Conditional) */}
                {user.role_category === 'BROKER' && user.broker_profile && (
                    <Card className="md:col-span-2 shadow-sm border-gray-200 overflow-hidden">
                        <CardHeader className="bg-blue-50/50 border-b border-blue-100">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-blue-900">
                                        <Briefcase className="w-5 h-5 text-blue-600" />
                                        Broker Professional Details
                                    </CardTitle>
                                    <CardDescription className="text-blue-700/80">
                                        These details are visible to potential clients and partners.
                                    </CardDescription>
                                </div>
                                {user.broker_profile.is_verified && (
                                    <Badge className="bg-blue-600 hover:bg-blue-700">Verified Broker</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6 p-6">
                            {/* Experience */}
                            <div className="flex flex-col space-y-2">
                                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Years of Experience</span>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-yellow-50 rounded-full">
                                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                    </div>
                                    <span className="text-2xl font-bold text-gray-900">{user.broker_profile.experience_years} <span className="text-base font-normal text-gray-500">Years</span></span>
                                </div>
                            </div>

                            {/* Services */}
                            <div className="flex flex-col space-y-2">
                                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Services Offered</span>
                                <div className="flex flex-wrap gap-2">
                                    {user.broker_profile.services_offered && user.broker_profile.services_offered.length > 0 ? (
                                        user.broker_profile.services_offered.map((service, idx) => (
                                            <Badge key={idx} variant="outline" className="bg-white text-gray-700 border-gray-200">
                                                {service}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-500 italic">No specific services listed yet.</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
