"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/axios";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notification } from "@/components/ui/notification";
import {
  CheckCircle, MapPin, IndianRupee, Home, FileText, Share2, Heart,
  Phone, Calendar, Bed, Bath, Ruler, Building, Car, Shield, Zap,
  School, ShoppingCart, Hospital, ChevronRight, ArrowLeft, Eye,
  Download, Flag, Clock, X, ChevronLeft, Wifi, Droplet, Wind,
  Package, Sparkles, Trees, Users, Camera, Check, ExternalLink,
  MessageCircle, Loader2, Trash2, UserCircle, FileCheck
} from "lucide-react";

import { PropertyDetail } from "@/types/property";

// Import Map dynamically
const MapViewer = dynamic(() => import("@/components/maps/MapViewer"), {
  ssr: false,
  loading: () => <div className="h-[300px] sm:h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-xl flex items-center justify-center">
    <div className="text-center">
      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-bounce" />
      <p className="text-gray-400 text-sm">Loading map...</p>
    </div>
  </div>
});

// Amenity icons mapping
const amenityIcons: { [key: string]: any } = {
  'parking': Car,
  'security': Shield,
  'power backup': Zap,
  'wifi': Wifi,
  'swimming pool': Droplet,
  'gym': Users,
  'park': Trees,
  'garden': Trees,
  'air conditioning': Wind,
  'lift': Package,
  'elevator': Package,
  'club house': Home,
  'intercom': MessageCircle, // meaningful icon
  'piped gas': Droplet, // meaningful icon
  'vastu compliant': Sparkles,
};

const formatAmenityName = (key: string): string => {
  return key
    .replace(/^(has_|is_)/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

// Helper to format uppercase_underscore strings to Title Case Spaced
const formatLabel = (text: string | undefined) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDocumentName = (key: string): string => {
  const names: Record<string, string> = {
    doc_7_12_or_pr_card: '7/12 Extract / PR Card',
    mojani_nakasha: 'Mojani / Nakasha',
    building_commencement_certificate: 'Commencement Certificate',
    building_completion_certificate: 'Completion Certificate',
    layout_sanction: 'Layout Sanction',
    layout_order: 'Layout Order',
    na_order_or_gunthewari: 'NA Order / Gunthewari',
    title_search_report: 'Title Search Report',
    rera_project_certificate: 'RERA Certificate',
    gst_registration: 'GST Registration',
    sale_deed_registration_copy: 'Sale Deed Copy',
  };
  return names[key] || formatLabel(key);
};

const getImageUrl = (path: string | undefined): string => {
  if (!path) return "https://placehold.co/1200x800?text=No+Image";
  if (path.startsWith('http')) return path;
  return `${(process as any).env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${path}`;
};

// Amenities helper
const getAmenitiesList = (property: PropertyDetail | null) => {
  if (!property) return [];
  const list: string[] = [];
  if (property.has_power_backup) list.push('Power Backup');
  if (property.has_lift) list.push('Elevator');
  if (property.has_swimming_pool) list.push('Swimming Pool');
  if (property.has_club_house) list.push('Club House');
  if (property.has_gym) list.push('Gym');
  if (property.has_park) list.push('Garden');
  if (property.has_reserved_parking) list.push('Parking');
  if (property.has_security) list.push('Security');
  if (property.is_vastu_compliant) list.push('Vastu Compliant');
  if (property.has_intercom) list.push('Intercom');
  if (property.has_piped_gas) list.push('Piped Gas');
  if (property.has_wifi) list.push('Wi-Fi');
  return list;
};

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactDetails, setContactDetails] = useState<any>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Notification State
  const [notification, setNotification] = useState({ show: false, message: "", type: "info" as "info" | "success" | "error" });

  const showNotify = (message: string, type: "info" | "success" | "error" = "info") => {
    setNotification({ show: true, message, type });
  };

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
      // Only record view if user is logged in to avoid 401 redirect
      if (user) {
        recordView();
      }
    }
  }, [id, user]);

  const fetchPropertyDetails = async () => {
    try {
      const res = await api.get(`/api/properties/${id}/`);
      setProperty(res.data);
      if (res.data.images?.length > 0) {
        setActiveImage(res.data.images[0].image);
      }
      // Sync saved state if available
      if (res.data.is_saved !== undefined) {
        setIsSaved(res.data.is_saved);
      }
    } catch (error) {
      console.error("Error fetching details", error);
    } finally {
      setLoading(false);
    }
  };

  const recordView = async () => {
    try {
      await api.get(`/api/properties/${id}/record_view/`);
    } catch (error) {
      console.warn("Could not record view");
    }
  };

  const toggleSave = async () => {
    if (!user) {
      const currentUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?redirect=${currentUrl}`);
      return;
    }

    try {
      await api.post(`/api/properties/${id}/save_property/`);
      setIsSaved(!isSaved);
    } catch (error) {
      showNotify("Could not save property.", "error");
    }
  };

  const changeImage = (image: string, index: number) => {
    setImageLoading(true);
    setActiveImage(image);
    setActiveImageIndex(index);
  };

  const nextImage = () => {
    if (property && property.images && activeImageIndex < property.images.length - 1) {
      changeImage(property.images[activeImageIndex + 1].image, activeImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (property && property.images && activeImageIndex > 0) {
      changeImage(property.images[activeImageIndex - 1].image, activeImageIndex - 1);
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      const currentUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?redirect=${currentUrl}`);
      return;
    }

    if (property?.whatsapp_number) {
      const cleanNumber = property.whatsapp_number.replace(/\D/g, '');
      const currentUrl = window.location.href;
      const message = `Hello, I'm interested in your property: ${property.title}.\n\nCheck it out here: ${currentUrl}`;
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

      // Track the click if needed, then open
      window.open(whatsappUrl, '_blank');
    } else {
      // Fallback if somehow no number exists
      handleContactOwner();
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(0)} Lac`;
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const handleContactOwner = async () => {
    if (!user) {
      // Redirect to login with return URL
      const currentUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?redirect=${currentUrl}`);
      return;
    }

    if (contactDetails) {
      setShowContactModal(true);
      return;
    }

    setContactLoading(true);
    try {
      const res = await api.get(`/api/properties/${id}/get_contact_details/`);
      setContactDetails(res.data);
      setShowContactModal(true);
    } catch (error) {
      console.error("Failed to fetch contact details", error);
      showNotify("Could not fetch contact details. Please try again.", "error");
    } finally {
      setContactLoading(false);
    }
  };

  const handleShare = () => {
    if (!property) return;
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Check out this property: ${property.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      setShowShareModal(true);
    }
  };



  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showNotify("Link copied to clipboard!", "success");
    setShowShareModal(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this property? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/api/properties/${id}/`);
      router.push('/dashboard/my-listings'); // Redirect after delete
    } catch (error: any) {
      showNotify(error.response?.data?.error || "Failed to delete property", "error");
      setDeleting(false);
    }
  };

  const getAmenityIcon = (amenity: string) => {
    const Icon = Object.entries(amenityIcons).find(([key]) =>
      amenity.toLowerCase().includes(key.toLowerCase())
    )?.[1] || Sparkles;
    return Icon;
  };

  // Handler to open Google Maps directions
  const handleGetDirections = () => {
    if (!property) return;

    // Prefer lat/lng if available
    const hasCoords = typeof property.latitude === "number" && typeof property.longitude === "number";

    const fallbackAddressParts = [
      property.address_line,
      property.locality,
      property.city,
      property.pincode,
    ].filter(Boolean);

    const fallbackAddress = fallbackAddressParts.join(", ");

    if (!hasCoords && !fallbackAddress) {
      showNotify("Directions are not available for this property.", "info");
      return;
    }

    let destination: string;

    if (hasCoords) {
      destination = `${property.latitude},${property.longitude}`;
    } else {
      destination = fallbackAddress;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;

    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center pt-20 bg-gray-50">
        <div className="text-center px-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E8F5E9] border-t-[#4A9B6D] mx-auto mb-4"></div>
            <Home className="w-6 h-6 text-[#4A9B6D] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 font-medium">Loading property details...</p>
        </div>
      </div>
      <Footer />
    </>
  );

  if (!property) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center pt-20 bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property not found</h2>
          <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/search')} className="bg-[#2D5F3F] hover:bg-[#1B3A2C]">
            Browse Properties
          </Button>
        </div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20 pb-28 sm:pb-12">
        <div className="max-w-7xl mx-auto">

          {/* Back Button - Desktop */}
          <div className="hidden sm:block px-4 sm:px-6 lg:px-8 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-3 -ml-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to listings
            </Button>

            <nav className="flex items-center space-x-2 text-sm text-gray-600 overflow-x-auto pb-2">
              <Link href="/" className="hover:text-[#2D5F3F] transition-colors whitespace-nowrap">Home</Link>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
              <Link href="/search" className="hover:text-[#2D5F3F] transition-colors whitespace-nowrap">Properties</Link>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
              <span className="text-[#2D5F3F] font-medium truncate">{property.city}</span>
            </nav>
          </div>

          {/* Mobile Back Button */}
          <div className="sm:hidden px-4 py-3 bg-white border-b border-gray-100 sticky top-[56px] z-30">
            <Button
              variant="ghost"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 2) {
                  router.back();
                } else {
                  router.push('/search');
                }
              }}
              className="-ml-2 text-gray-700 hover:text-[#2D5F3F]"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Listings
            </Button>
          </div>

          {/* Main Grid Layout */}
          <div className="grid lg:grid-cols-3 gap-0 sm:gap-6 lg:gap-8 px-0 sm:px-6 lg:px-8">

            {/* Left Column - Property Details */}
            <div className="lg:col-span-2">

              {/* Image Gallery */}
              <div className="bg-white sm:rounded-2xl overflow-hidden sm:shadow-lg mb-4 sm:mb-6">
                {/* Main Image */}
                <div className="relative h-64 sm:h-96 md:h-[500px] lg:h-[600px] bg-gray-100">
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A9B6D]"></div>
                    </div>
                  )}
                  <img
                    src={activeImage || "https://placehold.co/1200x800?text=No+Image"}
                    alt="Property"
                    className={`w-full h-full object-cover cursor-zoom-in ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                    onClick={() => setShowImageModal(true)}
                    onLoad={() => setImageLoading(false)}
                  />

                  {/* Image Navigation Arrows */}
                  {property.images?.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        disabled={activeImageIndex === 0}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed z-20"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        disabled={property.images && activeImageIndex === property.images.length - 1}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed z-20"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Verified Badge */}
                  {property.verification_status === "VERIFIED" && (
                    <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-white/95 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-lg">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#4A9B6D]" />
                      <span className="text-[#2D5F3F] font-semibold text-[10px] sm:text-xs">Verified</span>
                    </div>
                  )}

                  {/* Image Counter & View All */}
                  <div className="absolute bottom-3 sm:bottom-4 left-3 right-3 sm:left-4 sm:right-4 flex items-center justify-between z-20">
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-white transition-all shadow-lg flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">View All</span>
                    </button>
                    <div className="bg-black/60 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
                      {activeImageIndex + 1} / {property.images?.length || 1}
                    </div>
                  </div>
                </div>

                {/* Thumbnail Gallery - Desktop Only */}
                {property.images?.length > 1 && (
                  <div className="hidden sm:grid grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50">
                    {property.images.slice(0, 4).map((img: any, idx: number) => (
                      <div
                        key={img.id}
                        onClick={() => changeImage(img.image, idx)}
                        className={`h-20 md:h-24 bg-cover bg-center rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${activeImage === img.image ? 'ring-3 ring-[#4A9B6D] ring-offset-2' : ''
                          }`}
                        style={{ backgroundImage: `url(${img.image})` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Property Header - Mobile */}
              <div className="sm:hidden bg-white px-4 py-4 mb-4">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 mb-1.5 leading-tight">{property.title}</h1>
                    <p className="text-sm text-gray-600 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#4A9B6D] flex-shrink-0" />
                      <span>{property.locality}, {property.city}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleShare}
                      className="h-10 w-10 rounded-full bg-white shadow-sm border border-gray-100 text-gray-700 hover:text-[#4A9B6D] hover:bg-gray-50 transition-all"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleSave}
                      className={`h-10 w-10 rounded-full bg-white shadow-sm border border-gray-100 transition-all ${isSaved ? "text-red-500 hover:bg-red-50" : "text-gray-700 hover:text-red-500 hover:bg-gray-50"}`}
                    >
                      <Heart className={`w-5 h-5 ${isSaved ? "fill-red-500" : ""}`} />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <div className="text-2xl font-bold text-[#2D5F3F] mb-0.5">
                      {formatPrice(Number(property.total_price))}
                    </div>
                    {property.carpet_area && (
                      <div className="text-xs text-gray-500">
                        ₹{Math.round(property.total_price / parseInt(property.carpet_area)).toLocaleString('en-IN')}/sq ft
                      </div>
                    )}
                  </div>
                  {property.verification_status === "VERIFIED" && (
                    <Badge className="bg-green-50 text-green-700 border-green-200 text-xs px-2.5 py-1">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              {/* Property Overview - Desktop Only */}
              <div className="hidden sm:block bg-white rounded-2xl p-6 md:p-8 shadow-lg mb-6">
                <div className="mb-6">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{property.title}</h1>
                      <p className="text-lg text-gray-600 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#4A9B6D] flex-shrink-0" />
                        <span>{property.address_line || `${property.locality}, ${property.city}`}</span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={toggleSave}
                        className={`h-12 px-6 rounded-2xl border transition-all duration-300 font-semibold shadow-sm hover:shadow-lg active:scale-95 ${isSaved
                          ? "bg-gradient-to-br from-red-50 to-white border-red-200 text-red-600 hover:from-red-100 hover:to-red-50"
                          : "bg-white border-gray-200 text-gray-700 hover:border-red-200 hover:text-red-600 hover:bg-red-50/50"
                          }`}
                      >
                        <Heart className={`w-5 h-5 mr-2.5 transition-transform duration-300 ${isSaved ? "fill-red-600 scale-110" : "group-hover:scale-110"}`} />
                        {isSaved ? "Saved" : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShare}
                        className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-gray-700 hover:border-[#4A9B6D] hover:text-[#4A9B6D] hover:bg-[#E8F5E9]/30 transition-all duration-300 font-semibold shadow-sm hover:shadow-lg active:scale-95"
                      >
                        <Share2 className="w-5 h-5 mr-2.5" />
                        Share
                      </Button>

                      {/* Broker Actions - Checks for active broker AND no active/pending mandate */}
                      {user?.is_active_broker && !property.has_active_mandate && (
                        <Link href={`/dashboard/mandates/create?propertyId=${id}`}>
                          <Button
                            className="h-12 px-6 rounded-2xl bg-[#4A9B6D] hover:bg-[#2D5F3F] text-white font-semibold shadow-sm hover:shadow-lg transition-all"
                          >
                            <FileText className="w-5 h-5 mr-2" />
                            Initiate Mandate
                          </Button>
                        </Link>
                      )}
                      {/* Show disabled/status button if mandate exists? Optional, for now just hide as requested */}

                      {/* Mandate Active Indicator */}
                      {property.has_active_mandate ? (
                        user?.is_staff && property.active_mandate_id ? (
                          <Link href={`/admin/mandates/${property.active_mandate_id}`}>
                            <Button
                              className="h-12 px-6 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-sm hover:bg-blue-100 hover:border-blue-300 transition-all opacity-100"
                            >
                              <FileText className="w-5 h-5 mr-2" />
                              View Mandate
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            disabled
                            className="h-12 px-6 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-sm opacity-100 cursor-default"
                          >
                            <FileText className="w-5 h-5 mr-2" />
                            Mandate Active
                          </Button>
                        )
                      ) : (
                        /* Delete Button (Owner/Admin only when NO mandate) */
                        (user?.is_staff || (user && property.owner === user.id)) && (
                          <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="h-12 px-6 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 hover:border-red-200 transition-all shadow-sm"
                          >
                            {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5 mr-2" />}
                            Delete Property
                          </Button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {/* Views count not available in current API */}
                      Many views
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Posted {new Date(property.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      ID: #{property.id.slice(0, 8).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Quick Stats - Desktop */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="text-center p-4 bg-gradient-to-br from-[#E8F5E9] to-[#E8F5E9]/50 rounded-xl hover:shadow-md transition-all">
                    <Bed className="w-8 h-8 mx-auto text-[#4A9B6D] mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{property.bhk_config ?? 0}</div>
                    <div className="text-sm text-gray-600">Bedrooms</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-[#E8F5E9] to-[#E8F5E9]/50 rounded-xl hover:shadow-md transition-all">
                    <Bath className="w-8 h-8 mx-auto text-[#4A9B6D] mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{property.bathrooms ?? 0}</div>
                    <div className="text-sm text-gray-600">Bathrooms</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-[#E8F5E9] to-[#E8F5E9]/50 rounded-xl hover:shadow-md transition-all">
                    <Ruler className="w-8 h-8 mx-auto text-[#4A9B6D] mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{property.carpet_area}</div>
                    <div className="text-sm text-gray-600">Sq Ft</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-[#E8F5E9] to-[#E8F5E9]/50 rounded-xl hover:shadow-md transition-all flex flex-col justify-center">
                    <Building className="w-8 h-8 mx-auto text-[#4A9B6D] mb-2" />
                    <div className="text-lg font-bold text-gray-900 break-words leading-tight line-clamp-2">
                      {formatLabel(property.property_type)}
                    </div>
                    <div className="text-sm text-gray-600 truncate mt-1">{formatLabel(property.sub_type_display) || "Standard"}</div>
                  </div>
                </div>

                {/* Description - Desktop */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Description</h2>
                  <div className="text-base text-gray-600 leading-relaxed space-y-3">
                    {property.description ? (
                      property.description.split('\n').map((paragraph: string, idx: number) => (
                        paragraph.trim() && <p key={idx}>{paragraph}</p>
                      ))
                    ) : (
                      <p className="text-gray-400 italic">No description provided by the seller.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats - Mobile Only */}
              <div className="sm:hidden bg-white px-4 py-4 mb-4">
                <h2 className="text-base font-bold text-gray-900 mb-3">Property Details</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {(property.bhk_config || 0) > 0 && (
                    <div className="text-center p-3 bg-gradient-to-br from-[#E8F5E9] to-[#E8F5E9]/50 rounded-xl">
                      <Bed className="w-6 h-6 text-[#4A9B6D] mx-auto mb-1.5" />
                      <div className="text-lg font-bold text-gray-900">{property.bhk_config ?? 0}</div>
                      <div className="text-[10px] text-gray-600 leading-tight">Beds</div>
                    </div>
                  )}
                  {(property.bathrooms || 0) > 0 && (
                    <div className="text-center p-3 bg-gradient-to-br from-[#E8F5E9] to-[#E8F5E9]/50 rounded-xl">
                      <Bath className="w-6 h-6 text-[#4A9B6D] mx-auto mb-1.5" />
                      <div className="text-lg font-bold text-gray-900">{property.bathrooms ?? 0}</div>
                      <div className="text-[10px] text-gray-600 leading-tight">Baths</div>
                    </div>
                  )}
                  <div className="text-center p-3 bg-gradient-to-br from-[#E8F5E9] to-[#E8F5E9]/50 rounded-xl">
                    <Ruler className="w-6 h-6 text-[#4A9B6D] mx-auto mb-1.5" />
                    <div className="text-sm font-bold text-gray-900">{property.carpet_area}</div>
                    <div className="text-[10px] text-gray-600 leading-tight">Sq Ft</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-[#E8F5E9] to-[#E8F5E9]/50 rounded-xl">
                    <Building className="w-6 h-6 text-[#4A9B6D] mx-auto mb-1.5" />
                    <div className="text-sm font-bold text-gray-900 leading-tight break-words">{formatLabel(property.property_type)}</div>
                    <div className="text-[10px] text-gray-600 leading-tight mt-1">{formatLabel(property.sub_type_display) || "Type"}</div>
                  </div>
                </div>
              </div>

              {/* Description - Mobile */}
              <div className="sm:hidden bg-white px-4 py-4 mb-4">
                <h2 className="text-base font-bold text-gray-900 mb-3">About Property</h2>
                <div className="text-sm text-gray-600 leading-relaxed space-y-2">
                  {property.description ? (
                    property.description.split('\n').map((paragraph: string, idx: number) => (
                      paragraph.trim() && <p key={idx}>{paragraph}</p>
                    ))
                  ) : (
                    <p className="text-gray-400 italic">No description provided.</p>
                  )}
                </div>
              </div>

              {/* Owner Info / Listed By (Mobile & Desktop) */}
              <div className="bg-white sm:rounded-2xl p-4 sm:p-6 md:p-8 sm:shadow-lg mb-4 sm:mb-6 border-l-4 border-[#2D5F3F]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-[#2D5F3F]">
                    <UserCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Listed by</h3>
                    <p className="text-lg font-bold text-gray-900">{property.owner_details?.full_name || "SaudaPakka User"}</p>
                    <p className="text-xs text-green-600 font-medium">{property.listed_by_display || "Owner"}</p>
                  </div>
                </div>
              </div>

              {/* Verification Vault (Mobile First) */}
              <div className="bg-gradient-to-br from-green-50 to-white sm:rounded-2xl p-4 sm:p-6 md:p-8 sm:shadow-lg mb-4 sm:mb-6 border border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileCheck className="w-6 h-6 text-green-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Verification Vault</h2>
                    <p className="text-xs text-gray-500">Official documents for transparency</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {[
                    'building_commencement_certificate',
                    'building_completion_certificate',
                    'layout_sanction',
                    'layout_order',
                    'na_order_or_gunthewari',
                    'mojani_nakasha',
                    'doc_7_12_or_pr_card',
                    'title_search_report',
                    'rera_project_certificate',
                    'gst_registration',
                    'sale_deed_registration_copy'
                  ].map(key => {
                    const fileUrl = property[key as keyof PropertyDetail];
                    if (!fileUrl) return null;
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-3 p-3 bg-white border border-green-100 rounded-xl"
                      >
                        <div className="flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {formatDocumentName(key)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Empty state if no docs */}
                {!Object.keys(property).some(k => [
                  'building_commencement_certificate', 'building_completion_certificate', 'layout_sanction', 'layout_order',
                  'na_order_or_gunthewari', 'mojani_nakasha', 'doc_7_12_or_pr_card', 'title_search_report'
                ].includes(k) && property[k as keyof PropertyDetail]) && (
                    <p className="text-sm text-gray-500 italic text-center py-4">No public documents uploaded yet.</p>
                  )}
              </div>



              {/* Spacer for Sticky Footer */}
              <div className="h-24 sm:hidden"></div>

              {/* Mobile Sticky Footer - Action Buttons */}
              <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 sm:hidden z-[100] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-safe">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleContactOwner}
                    className="w-full bg-[#2D5F3F] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 h-12"
                    disabled={contactLoading}
                  >
                    {contactLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Phone className="w-5 h-5" />}
                    Contact
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleWhatsAppClick}
                    className="w-full border-2 border-[#25D366] text-[#25D366] bg-green-50 hover:bg-[#25D366]/10 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 h-12"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </Button>

                  {/* Broker Action Mobile - Conditional */}
                  {property.has_active_mandate ? (
                    user?.is_staff && property.active_mandate_id ? (
                      <div className="col-span-2 mt-2">
                        <Link href={`/admin/mandates/${property.active_mandate_id}`} className="w-full block">
                          <Button className="w-full h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center justify-center">
                            <FileText className="w-5 h-5 mr-2" />
                            View Mandate
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      // Hide button for normal users if mandate exists (or show disabled badge if desired, but mobile space is tight)
                      // User can see it in main body.
                      null
                    )
                  ) : (
                    user?.is_active_broker && (
                      <div className="col-span-2 mt-2">
                        <Link href={`/dashboard/mandates/create?propertyId=${id}`} className="w-full block">
                          <Button className="w-full h-12 rounded-xl bg-[#4A9B6D] hover:bg-[#2D5F3F] text-white font-semibold shadow-sm flex items-center justify-center">
                            <FileText className="w-5 h-5 mr-2" />
                            Initiate Mandate
                          </Button>
                        </Link>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Floor Plans */}
              {((property.floor_plans?.length ?? 0) > 0 || property.floor_plan) && (
                <div className="bg-white sm:rounded-2xl p-4 sm:p-6 md:p-8 sm:shadow-lg mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-6">
                    {(property.floor_plans?.length ?? 0) > 1 ? 'Floor Plans' : 'Floor Plan'}
                  </h2>

                  {(property.floor_plans?.length ?? 0) > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {property.floor_plans?.map((fp: any) => (
                        <div key={fp.id} className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50 group">
                          <img
                            src={fp.image}
                            alt="Floor Plan"
                            className="w-full h-auto object-contain max-h-[400px] group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                            onClick={() => {
                              if (fp.image) {
                                setActiveImage(fp.image);
                                setShowImageModal(true);
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Fallback for single legacy floor plan
                    <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                      <img
                        src={property.floor_plan}
                        alt="Floor Plan"
                        className="w-full h-auto object-contain max-h-[500px] hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                        onClick={() => {
                          if (property.floor_plan) {
                            setActiveImage(property.floor_plan);
                            setShowImageModal(true);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Features & Amenities */}
              {getAmenitiesList(property).length > 0 && (
                <div className="bg-white sm:rounded-2xl p-4 sm:p-6 md:p-8 sm:shadow-lg mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-6">Features & Amenities</h2>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                    {getAmenitiesList(property).map((amenity: string, idx: number) => {
                      const Icon = getAmenityIcon(amenity);
                      return (
                        <div key={idx} className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-[#E8F5E9]/30 transition-all group">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-[#4A9B6D]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all">
                            <Icon className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#4A9B6D]" />
                          </div>
                          <span className="text-xs sm:text-sm text-gray-700 font-medium line-clamp-2">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Legal Documents - Mobile */}


              {/* Location & Map */}
              <div className="bg-white sm:rounded-2xl p-4 sm:p-6 md:p-8 sm:shadow-lg mb-4 sm:mb-6">
                <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-6">Location & Nearby</h2>

                {/* Detailed Address */}
                <div className="mb-6 p-4 sm:p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D5F3F]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">Property Address</h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                        {property.project_name && <span className="font-medium block text-gray-800 mb-1">{property.project_name}</span>}
                        {property.address_line}
                      </p>
                      <p className="text-sm sm:text-base text-gray-600 mt-0.5">
                        {property.locality}, {property.city} {property.pincode && <span>- {property.pincode}</span>}
                      </p>
                      {property.landmarks && (
                        <div className="mt-2.5 pt-2.5 border-t border-gray-200/60">
                          <p className="text-xs sm:text-sm text-gray-500">
                            <span className="font-semibold text-gray-700">Landmark:</span> {property.landmarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Map */}
                <div className="mb-4 sm:mb-6 rounded-xl overflow-hidden">
                  <MapViewer
                    lat={property.latitude}
                    lng={property.longitude}
                    address={`${property.address_line}, ${property.city}`}
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Approximate location shown for privacy
                  </p>

                  {/* Get Directions CTA */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      onClick={handleGetDirections}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-[#2D5F3F] text-white hover:bg-[#1B3A2C] shadow-sm hover:shadow-md transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Get Directions
                    </Button>

                    {/* Optional helper text */}
                    <span className="text-xs sm:text-sm text-gray-500">
                      Opens Google Maps for navigation
                    </span>
                  </div>
                </div>

                {/* Nearby Places
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">What's Nearby</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                    <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-[#E8F5E9]/30 rounded-lg hover:shadow-md transition-all">
                      <div className="w-9 h-9 rounded-lg bg-[#4A9B6D]/10 flex items-center justify-center flex-shrink-0">
                        <School className="w-4 h-4 sm:w-5 sm:h-5 text-[#4A9B6D]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base text-gray-900">Schools</p>
                        <p className="text-xs sm:text-sm text-gray-600">2 km away</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-[#E8F5E9]/30 rounded-lg hover:shadow-md transition-all">
                      <div className="w-9 h-9 rounded-lg bg-[#4A9B6D]/10 flex items-center justify-center flex-shrink-0">
                        <Hospital className="w-4 h-4 sm:w-5 sm:h-5 text-[#4A9B6D]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base text-gray-900">Hospitals</p>
                        <p className="text-xs sm:text-sm text-gray-600">3 km away</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-[#E8F5E9]/30 rounded-lg hover:shadow-md transition-all">
                      <div className="w-9 h-9 rounded-lg bg-[#4A9B6D]/10 flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-[#4A9B6D]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base text-gray-900">Shopping</p>
                        <p className="text-xs sm:text-sm text-gray-600">1.5 km away</p>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>

              {/* Property ID - Mobile */}
              <div className="sm:hidden bg-white px-4 py-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">Property ID</span>
                  <span className="text-gray-900 font-bold font-mono">#{property.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Right Column - Sticky Booking Card - Desktop Only */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24">
                {/* Main Booking Card */}
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {formatPrice(Number(property.total_price))}
                    </div>
                    {property.carpet_area && (
                      <div className="text-sm text-gray-600">
                        ₹{Math.round(property.total_price / parseInt(property.carpet_area)).toLocaleString('en-IN')} per sq ft
                      </div>
                    )}
                  </div>

                  {/* Property Info */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Property Type</span>
                      <span className="font-semibold text-gray-900">{property.property_type}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Property Status</span>
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                        {property.verification_status === 'VERIFIED' ? "Verified" : property.availability_status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Listing Type</span>
                      <Badge variant="outline" className="text-xs">{property.listing_type}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Property ID</span>
                      <span className="font-mono text-xs text-gray-900">#{property.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleContactOwner}
                      className="w-full bg-gradient-to-r from-[#2D5F3F] to-[#4A9B6D] text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      disabled={contactLoading}
                    >
                      {contactLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Phone className="w-5 h-5" />}
                      Contact Owner
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => showNotify("Schedule feature coming soon!", "info")}
                      className="w-full border-2 border-[#4A9B6D] text-[#4A9B6D] py-2 mt-2 rounded-xl font-semibold hover:bg-[#E8F5E9]/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      Schedule Visit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleWhatsAppClick}
                      className="w-full border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 py-2 mt-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Chat on WhatsApp
                    </Button>
                    <Button variant="outline" className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2" onClick={toggleSave}>
                      <Heart className={`w-5 h-5 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
                      {isSaved ? "Saved" : "Save Property"}
                    </Button>
                  </div>

                  {/* Legal Verification Documents */}



                </div>
              </div>
            </div>
          </div>
        </div>
      </div >

      {/* Image Modal - Carousel */}
      {
        showImageModal && (
          <div className="fixed inset-0 bg-black/95 z-[2000] flex items-center justify-center p-4">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-[2010] p-2 bg-black/50 rounded-full"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative w-full h-full flex items-center justify-center">
              {/* Prev Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all z-[2010]"
                disabled={activeImageIndex === 0}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <img
                src={activeImage}
                alt="Property"
                className="max-w-full max-h-[90vh] object-contain select-none"
              />

              {/* Next Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all z-[2010]"
                disabled={property.images && activeImageIndex === property.images.length - 1}
              >
                <ChevronRight className="w-8 h-8" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                {activeImageIndex + 1} / {property.images?.length || 1}
              </div>
            </div>
          </div>
        )
      }

      {/* Share Modal */}
      {
        showShareModal && (
          <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Share Property</h3>
              <Button onClick={copyLink} className="w-full bg-[#2D5F3F] hover:bg-[#1B3A2C]">
                <ExternalLink className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        )
      }

      {/* Contact Owner Modal */}
      {
        showContactModal && contactDetails && (
          <div className="fixed inset-0 bg-black/60 z-[2010] flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowContactModal(false)}>
            <div
              className="bg-white w-full sm:w-auto sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up sm:animate-in sm:fade-in sm:zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Owner Contact Details</h3>
                <button onClick={() => setShowContactModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center text-2xl font-bold text-[#2D5F3F]">
                  {contactDetails.full_name?.charAt(0) || "U"}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{contactDetails.full_name}</h4>
                  <p className="text-sm text-gray-500">Property Owner</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Phone className="w-5 h-5 text-[#2D5F3F]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Mobile Number</p>
                      <p className="text-base font-bold text-gray-900">{contactDetails.phone_number}</p>
                    </div>
                  </div>
                  <a href={`tel:${contactDetails.phone_number}`}>
                    <Button size="sm" className="bg-[#2D5F3F] hover:bg-[#1B3A2C] rounded-lg">Call</Button>
                  </a>
                </div>

                {contactDetails.whatsapp_number && (
                  <div className="p-4 bg-green-50 rounded-xl flex items-center justify-between border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-green-700 font-medium">WhatsApp</p>
                        <p className="text-base font-bold text-gray-900">{contactDetails.whatsapp_number}</p>
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/${contactDetails.whatsapp_number.replace(/\D/g, '')}?text=Hi, I am interested in your property listed on SaudaPakka.`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg border-none">Chat</Button>
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                  By contacting the owner, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        )
      }

      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, show: false })}
      />
      <Footer />
    </>
  );
}
