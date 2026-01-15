"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  MapPin, IndianRupee, FileText, Check, X, Upload, Sparkles,
  ArrowLeft, AlertCircle, Home, ChevronRight, CheckCircle, ArrowRight
} from "lucide-react";
import Link from "next/link";
import KYCVerificationModal from "@/components/KYCVerificationModal";

// --- Dynamic Imports ---
const SmartLocationPicker = dynamic(() => import("@/components/maps/SmartLocationPicker"), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-xl" />
});

// --- Constants ---
const DOCUMENTS_CONFIG = [
  { key: "building_commencement_certificate", label: "Commencement Certificate", required: true },
  { key: "building_completion_certificate", label: "Completion Certificate", required: true },
  { key: "layout_sanction", label: "Layout Sanction", required: true },
  { key: "layout_order", label: "Layout Order", required: true },
  { key: "na_order_or_gunthewari", label: "NA/Gunthewari Order", required: true },
  { key: "mojani_nakasha", label: "Mojani / Nakasha", required: true },
  { key: "doc_7_12_or_pr_card", label: "7/12 / P.R. Card", required: true },
  { key: "title_search_report", label: "Title Search Report", required: true },
  { key: "rera_project_certificate", label: "RERA Certificate", required: false },
  { key: "gst_registration", label: "G.S.T. Registration", required: false },
  { key: "sale_deed_registration_copy", label: "Sale Deed Copy", required: false },
];

const PROPERTY_TYPES = [
  { value: "FLAT", label: "Flat", icon: "🏢" },
  { value: "VILLA_BUNGALOW", label: "Villa/Bungalow", icon: "🏡" },
  { value: "PLOT", label: "Plot", icon: "📐" },
  { value: "LAND", label: "Land", icon: "🌾" },
  { value: "COMMERCIAL_UNIT", label: "Commercial", icon: "🏪" }
];

const SUBTYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  VILLA_BUNGALOW: [
    { value: "BUNGALOW", label: "Bungalow" },
    { value: "TWIN_BUNGALOW", label: "Twin Bungalow" },
    { value: "ROWHOUSE", label: "Rowhouse" },
    { value: "VILLA", label: "Villa" },
  ],
  PLOT: [
    { value: "RES_PLOT", label: "Residential Plot" },
    { value: "COM_PLOT", label: "Commercial Plot" },
  ],
  LAND: [
    { value: "AGRI_LAND", label: "Agricultural Land" },
    { value: "IND_LAND", label: "Industrial Land" },
  ],
  COMMERCIAL_UNIT: [
    { value: "SHOP", label: "Shop" },
    { value: "OFFICE", label: "Office" },
    { value: "SHOWROOM", label: "Showroom" },
  ],
};

const AMENITIES = [
  { key: "has_power_backup", label: "Power Backup" },
  { key: "has_lift", label: "Lift" },
  { key: "has_swimming_pool", label: "Swimming Pool" },
  { key: "has_clubhouse", label: "Club House" },
  { key: "has_gym", label: "Gymnasium" },
  { key: "has_park", label: "Garden/Park" },
  { key: "has_reserved_parking", label: "Parking" },
  { key: "has_security", label: "24/7 Security" },
  { key: "is_vastu_compliant", label: "Vastu" },
  { key: "has_intercom", label: "Intercom" },
  { key: "has_piped_gas", label: "Piped Gas" },
  { key: "has_wifi", label: "WiFi" },
];

export default function CreatePropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const totalSteps = 5;

  // --- State Management ---
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    listing_type: "SALE",
    property_type: "FLAT",
    subtype: "",
    bhk_config: 1,
    bathrooms: 1,
    balconies: 0,
    super_builtup_area: "",
    carpet_area: "",
    plot_area: "",
    furnishing_status: "UNFURNISHED",
    total_price: "",
    maintenance_charges: 0,
    maintenance_interval: "MONTHLY",
    project_name: "",
    locality: "",
    city: "",
    pincode: "",
    latitude: 19.8762,
    longitude: 75.3433,
    landmarks: "",
    specific_floor: "",
    total_floors: "",
    facing: "",
    availability_status: "READY",
    possession_date: "",
    age_of_construction: 0,
    listed_by: "OWNER",
    whatsapp_number: "",
    video_url: "",
    has_power_backup: false,
    has_lift: false,
    has_swimming_pool: false,
    has_clubhouse: false,
    has_gym: false,
    has_park: false,
    has_reserved_parking: false,
    has_security: false,
    is_vastu_compliant: false,
    has_intercom: false,
    has_piped_gas: false,
    has_wifi: false,
  });

  const [addressLines, setAddressLines] = useState({ line1: "", line2: "", line3: "" });
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [floorPlans, setFloorPlans] = useState<File[]>([]); // Multiple floor plans
  const [legalDocuments, setLegalDocuments] = useState<Record<string, File | null>>({});
  const [mounted, setMounted] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Auth Check ---
  useEffect(() => {
    if (!mounted) return;
    const token = Cookies.get("access_token");
    if (!token) {
      router.push("/login");
    }
  }, [router, mounted]);

  if (!mounted) return null;

  const progress = (step / totalSteps) * 100;

  // --- Validation ---
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.title = "Title is required";
      if (!formData.description.trim()) newErrors.description = "Description is required";
    }

    if (currentStep === 2) {
      if (!formData.total_price || parseFloat(formData.total_price) <= 0)
        newErrors.total_price = "Valid price is required";
      if (!formData.super_builtup_area || parseFloat(formData.super_builtup_area) <= 0)
        newErrors.super_builtup_area = "Super built-up area is required";
      if (!formData.carpet_area || parseFloat(formData.carpet_area) <= 0)
        newErrors.carpet_area = "Carpet area is required";
    }

    if (currentStep === 3) {
      if (!addressLines.line1.trim()) newErrors.line1 = "Building/House info required";
      if (!formData.locality.trim()) newErrors.locality = "Locality is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";
    }

    if (currentStep === 4) {
      if (galleryImages.length === 0) newErrors.gallery = "At least one property image is required";
    }

    if (currentStep === 5) {
      const requiredDocs = DOCUMENTS_CONFIG.filter(d => d.required);
      const missingDocs = requiredDocs.filter(d => !legalDocuments[d.key]);
      if (missingDocs.length > 0) {
        newErrors.documents = `Missing: ${missingDocs.map(d => d.label).join(", ")}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddressLinesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressLines(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setStep(s => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(5)) return;

    setLoading(true);
    const fullAddress = [addressLines.line1, addressLines.line2, addressLines.line3]
      .filter(line => line.trim() !== "")
      .join(", ");

    try {
      const data = new FormData();

      Object.entries(formData).forEach(([key, val]) => {
        if (val !== "" && val !== null && val !== undefined) {
          const numericFields = ["bhk_config", "bathrooms", "balconies", "age_of_construction"];
          const decimalFields = ["total_price", "super_builtup_area", "carpet_area", "plot_area", "maintenance_charges"];
          const integerFields = ["specific_floor", "total_floors"];

          if (numericFields.includes(key) || decimalFields.includes(key) || integerFields.includes(key)) {
            data.append(key, val.toString());
          } else if (typeof val === "boolean") {
            data.append(key, val ? "true" : "false");
          } else {
            data.append(key, val.toString());
          }
        }
      });

      data.append("address_line", fullAddress || formData.locality || "Address not provided");

      Object.entries(legalDocuments).forEach(([key, file]) => {
        if (file) data.append(key, file);
      });

      // Append multiple floor plans
      floorPlans.forEach(file => {
        data.append("floor_plans", file);
      });

      const res = await api.post("/api/properties/", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (galleryImages.length > 0) {
        await Promise.all(galleryImages.map((file, i) => {
          const imgData = new FormData();
          imgData.append("image", file);
          imgData.append("is_thumbnail", i === 0 ? "true" : "false");
          return api.post(`/api/properties/${res.data.id}/upload_image/`, imgData);
        }));
      }

      router.push("/dashboard/my-listings");
    } catch (err: any) {
      console.error("Submission error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });

      let errorMsg = "Check all required fields and documents.";

      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data; // HTML response (e.g. 500/413)
        } else {
          // DRF Validation Errors (JSON)
          errorMsg = Object.entries(err.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("\n");
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      // Check if it's a KYC verification error
      if (err.response?.status === 403 &&
        (errorMsg.toLowerCase().includes('kyc') ||
          errorMsg.toLowerCase().includes('verification required'))) {
        setShowKYCModal(true);
        return; // Don't show generic alert
      }

      alert(`Error creating listing (${err.response?.status || 'Unknown'}): \n${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KYCVerificationModal isOpen={showKYCModal} onClose={() => setShowKYCModal(false)} />

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* --- Progress Header --- */}
        <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-3">
              <Link href="/dashboard/my-listings" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base font-medium">Back to Listings</span>
              </Link>
              <span className="text-xs sm:text-sm font-bold text-2D5F3F bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                Step {step} of {totalSteps}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-500 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* --- Main Form Body --- */}
        <main className="flex-1 max-w-5xl lg:max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* STEP 1: CATEGORY & TITLE */}
              {step === 1 && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">What are you listing?</h2>
                    <p className="text-gray-500 text-sm sm:text-base">Select the property type to customize your listing journey.</p>
                  </div>

                  {/* Property Type Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {PROPERTY_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, property_type: type.value, subtype: "" }))}
                        className={`group aspect-square rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-6 flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all duration-300 shadow-sm hover:shadow-md ${formData.property_type === type.value
                          ? "border-[#4A9B6D] bg-[#E8F5E9] scale-[1.02]"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform filter drop-shadow-sm">{type.icon}</span>
                        <span className={`text-xs sm:text-sm font-bold tracking-tight text-center ${formData.property_type === type.value ? "text-green-800" : "text-gray-700"}`}>
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* SUBTYPE */}
                  {SUBTYPE_OPTIONS[formData.property_type] && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200"
                    >
                      <Label className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 block">Specific Category</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {SUBTYPE_OPTIONS[formData.property_type].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, subtype: opt.value }))}
                            className={`py-2.5 sm:py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${formData.subtype === opt.value
                              ? "border-[#4A9B6D] bg-[#E8F5E9] text-green-800"
                              : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                              }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Form Fields Section */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                    <div className="space-y-3">
                      <Label className="block text-sm font-bold text-gray-900">
                        Catchy Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Modern 3BHK with Panoramic City Views"
                        className="w-full h-12 sm:h-14 px-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-400 bg-white"
                      />
                      {errors.title && <p className="text-red-500 text-xs sm:text-sm">{errors.title}</p>}
                    </div>

                    <div className="space-y-3">
                      <Label className="block text-sm font-bold text-gray-900">
                        Detailed Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Tell potential buyers what makes this place special..."
                        rows={8}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-400 min-h-[150px] sm:min-h-[200px] bg-white resize-y"
                      />
                      {errors.description && <p className="text-red-500 text-xs sm:text-sm">{errors.description}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PRICING & CONFIG */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Pricing & Details</h2>
                    <p className="text-gray-500 text-sm sm:text-base">Set a competitive price and share technical details.</p>
                  </div>

                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-8">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Financial Details</h3>

                    <div className="space-y-4">
                      <Label className="text-base sm:text-lg font-bold text-gray-900 mb-2 block">
                        Total Price <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 flex items-center justify-center bg-[#2D5F3F] border-r border-gray-300 rounded-l-xl text-white">
                          <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <Input
                          name="total_price"
                          type="number"
                          value={formData.total_price}
                          onChange={handleChange}
                          className="pl-16 sm:pl-20 h-14 sm:h-16 text-xl sm:text-2xl font-bold rounded-xl border-2 border-gray-200 focus:ring-green-500"
                          placeholder="0"
                        />
                      </div>
                      {errors.total_price && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.total_price}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Super Built-up Area (sq.ft) <span className="text-red-500">*</span></Label>
                        <Input
                          name="super_builtup_area"
                          type="number"
                          value={formData.super_builtup_area}
                          onChange={handleChange}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                        />
                        {errors.super_builtup_area && <p className="text-red-500 text-xs sm:text-sm">{errors.super_builtup_area}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Carpet Area (sq.ft) <span className="text-red-500">*</span></Label>
                        <Input
                          name="carpet_area"
                          type="number"
                          value={formData.carpet_area}
                          onChange={handleChange}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                        />
                        {errors.carpet_area && <p className="text-red-500 text-xs sm:text-sm">{errors.carpet_area}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Configuration Section */}
                  {(["FLAT", "VILLA_BUNGALOW"].includes(formData.property_type) || formData.bhk_config > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-4">
                        <Label className="text-xs font-bold uppercase text-gray-500">BHK Config</Label>
                        <div className="flex items-center gap-6">
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, bhk_config: Math.max(0, p.bhk_config - 1) }))}
                            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors font-bold text-lg"
                          >
                            -
                          </button>
                          <span className="text-3xl font-black text-gray-900 w-16 text-center">
                            {formData.bhk_config === 0 ? "NA" : formData.bhk_config}
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, bhk_config: p.bhk_config + 1 }))}
                            className="w-10 h-10 rounded-full bg-[#2D5F3F] text-white flex items-center justify-center hover:bg-[#1B3A26] transition-colors shadow-sm font-bold text-lg"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs text-gray-400">Set 0 for N/A</span>
                      </div>

                      {["bathrooms", "balconies"].map(field => (
                        <div key={field} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-4">
                          <Label className="text-xs font-bold uppercase text-gray-500">
                            {field.replace("_", " ").replace("config", "")}
                          </Label>
                          <div className="flex items-center gap-6">
                            <button
                              type="button"
                              onClick={() => setFormData(p => ({ ...p, [field]: Math.max(field === "balconies" ? 0 : 1, (p[field as keyof typeof p] as number) - 1) }))}
                              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors font-bold text-lg"
                            >
                              -
                            </button>
                            <span className="text-3xl font-black text-gray-900 w-12 text-center">
                              {formData[field as keyof typeof formData]}
                            </span>
                            <button
                              type="button"
                              onClick={() => setFormData(p => ({ ...p, [field]: (p[field as keyof typeof p] as number) + 1 }))}
                              className="w-10 h-10 rounded-full bg-[#2D5F3F] text-white flex items-center justify-center hover:bg-[#1B3A26] transition-colors shadow-sm font-bold text-lg"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: LOCATION */}
              {step === 3 && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Pin the Location</h2>
                    <p className="text-gray-500 text-sm sm:text-base">Precise location helps buyers find your property faster.</p>
                  </div>

                  <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden relative">
                    <SmartLocationPicker
                      initialLat={formData.latitude}
                      initialLng={formData.longitude}
                      onLocationSelect={(lat, lng, address) => {
                        setFormData(p => ({
                          ...p,
                          latitude: lat,
                          longitude: lng,
                          city: address.city || p.city,
                          locality: address.street || address.city || p.locality,
                          pincode: address.pincode || p.pincode
                        }));
                        setAddressLines(p => ({
                          ...p,
                          line1: p.line1 || (address.formatted_address ? address.formatted_address.split(',')[0] : "")
                        }));
                      }}
                    />
                  </div>

                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Address Details</h3>

                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Building / House / Flat No. <span className="text-red-500">*</span></Label>
                        <Input
                          name="line1"
                          value={addressLines.line1}
                          onChange={handleAddressLinesChange}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                          placeholder="e.g. Flat 402, Sunshine Heights"
                        />
                        {errors.line1 && <p className="text-red-500 text-xs sm:text-sm">{errors.line1}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="font-bold text-sm">Locality / Area <span className="text-red-500">*</span></Label>
                          <Input
                            name="locality"
                            value={formData.locality}
                            onChange={handleChange}
                            className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                          />
                          {errors.locality && <p className="text-red-500 text-xs sm:text-sm">{errors.locality}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label className="font-bold text-sm">City <span className="text-red-500">*</span></Label>
                          <Input
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                          />
                          {errors.city && <p className="text-red-500 text-xs sm:text-sm">{errors.city}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Pincode <span className="text-red-500">*</span></Label>
                        <Input
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500 md:w-1/2"
                        />
                        {errors.pincode && <p className="text-red-500 text-xs sm:text-sm">{errors.pincode}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: AMENITIES & PHOTOS */}
              {step === 4 && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Photos & Features</h2>
                    <p className="text-gray-500 text-sm sm:text-base">Properties with 5+ photos receive 3x more inquiries.</p>
                  </div>

                  {/* Amenities */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      Features & Amenities
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {AMENITIES.map(a => (
                        <div
                          key={a.key}
                          onClick={() => setFormData(p => ({ ...p, [a.key]: !p[a.key as keyof typeof p] }))}
                          className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${formData[a.key as keyof typeof formData]
                            ? "border-green-500 bg-green-50 text-green-800"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                          <span className="font-medium text-xs sm:text-sm">{a.label}</span>
                          {formData[a.key as keyof typeof formData] && <Check className="w-4 h-4 text-green-600" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Property Gallery */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">Property Gallery</h3>
                      <span className="text-xs sm:text-sm text-gray-500">{galleryImages.length} / 15 Photos</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                      {galleryImages.map((file, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group border border-gray-200"
                        >
                          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setGalleryImages(p => p.filter((_, idx) => idx !== i))}
                            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {i === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider">
                              Cover Image
                            </div>
                          )}
                        </motion.div>
                      ))}

                      {galleryImages.length < 15 && (
                        <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-green-600">
                          <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                          <span className="text-xs sm:text-sm font-medium text-center px-2">Add Photo</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              if (e.target.files) {
                                setGalleryImages(p => [...p, ...Array.from(e.target.files!)]);
                                setErrors(prev => {
                                  const n = { ...prev };
                                  delete n.gallery;
                                  return n;
                                });
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                    {errors.gallery && <p className="text-red-500 text-xs sm:text-sm mt-2">{errors.gallery}</p>}
                  </div>

                  {/* FLOOR PLANS SECTION (Multiple) */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                      <span>FLOOR PLANS (MULTIPLE)</span>
                      <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">Optional</span>
                    </h3>

                    <div className="space-y-4">
                      {/* List of added floor plans */}
                      {floorPlans.length > 0 && (
                        <div className="grid gap-3">
                          {floorPlans.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-12 h-12 bg-white rounded border flex-shrink-0 overflow-hidden">
                                  <img src={URL.createObjectURL(file)} alt="fp" className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFloorPlans(prev => prev.filter((_, i) => i !== idx))}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Button */}
                      <div>
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200">
                          <Upload className="w-4 h-4" />
                          Add Floor Plan
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            multiple
                            className="hidden"
                            onChange={e => {
                              if (e.target.files) {
                                setFloorPlans(prev => [...prev, ...Array.from(e.target.files!)]);
                              }
                            }}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-2 ml-1">
                          Upload multiple floor plans. Preferred formats: JPG, PNG.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: LEGAL DOCS */}
              {step === 5 && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Verify Your Property</h2>
                    <p className="text-gray-500 text-sm sm:text-base">
                      Upload official documents to earn the Verified badge and build trust.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-8 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative overflow-hidden">
                    <div className="absolute top-[-20] right-[-10] w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="bg-white/20 p-3 sm:p-4 rounded-xl backdrop-blur-md">
                      <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black mb-1">Boost Your Listing</h3>
                      <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                        Properties with complete documentation are 70% more likely to be featured on our homepage.
                      </p>
                    </div>
                  </div>

                  {errors.documents && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm font-medium">{errors.documents}</p>
                    </div>
                  )}

                  <div className="grid gap-3 sm:gap-4">
                    {DOCUMENTS_CONFIG.map(doc => (
                      <label
                        key={doc.key}
                        className={`group flex items-center justify-between p-4 sm:p-6 bg-white border-2 rounded-2xl cursor-pointer transition-all duration-300 ${legalDocuments[doc.key]
                          ? "border-[#4A9B6D] bg-[#F1F8F4]"
                          : "border-gray-100 hover:border-gray-200 hover:shadow-lg"
                          }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                          <div
                            className={`w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-xl flex items-center justify-center transition-all ${legalDocuments[doc.key]
                              ? "bg-[#2D5F3F] text-white shadow-lg shadow-green-100"
                              : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                              }`}
                          >
                            <FileText className="w-5 h-5 sm:w-7 sm:h-7" />
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className={`font-black text-xs sm:text-sm tracking-tight truncate ${legalDocuments[doc.key] ? "text-[#2D5F3F]" : "text-gray-800"}`}>
                              {doc.label} {doc.required && <span className="text-red-500">*</span>}
                            </p>
                            <p className="text-[11px] font-bold text-gray-400 truncate">
                              {legalDocuments[doc.key]?.name || "Format: PDF, JPG, PNG"}
                            </p>
                          </div>
                        </div>

                        <input
                          type="file"
                          className="hidden"
                          onChange={e => {
                            if (e.target.files?.[0]) {
                              setLegalDocuments(p => ({ ...p, [doc.key]: e.target.files![0] }));
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.documents;
                                return newErrors;
                              });
                            }
                          }}
                        />

                        {legalDocuments[doc.key] ? (
                          <div className="flex items-center gap-2 bg-[#2D5F3F] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-in zoom-in-50 duration-300">
                            <Check className="w-3 h-3" />
                            Ready
                          </div>
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-white group-hover:text-gray-500 transition-all border border-transparent group-hover:border-gray-100">
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* --- Sticky Action Bar --- */}
        <footer className="fixed bottom-0 left-0 lg:left-72 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 p-4 sm:p-6 z-60">
          <div className="max-w-5xl lg:max-w-6xl mx-auto flex items-center gap-3 sm:gap-4">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={loading}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-gray-700 border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Back
              </button>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={loading}
                className="flex-1 py-3 sm:py-4 rounded-xl bg-[#2D5F3F] text-white font-bold text-sm sm:text-base shadow-lg shadow-green-100 hover:bg-[#1B3A26] hover:shadow-xl hover:shadow-green-200 transition-all active:scale-0.98 flex items-center justify-center gap-3 disabled:opacity-70"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-[#2D5F3F] to-[#4A9B6D] text-white font-bold text-sm sm:text-base shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-green-200 active:scale-0.98 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Publishing Listing...</span>
                    <span className="sm:hidden">Publishing...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Publish Property</span>
                    <span className="sm:hidden">Publish</span>
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </footer>

        {/* Spacer for fixed footer */}
        <div className="h-24"></div>
      </div>
    </>
  );
}
