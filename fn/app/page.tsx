"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Icons as components to avoid external dependencies
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-12 h-12 text-indigo-100"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M12 14c-5 0-8 3-8 6v1h16v-1c0-3-3-6-8-6z" />
  </svg>
);

const BuildingIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-12 h-12 text-blue-100"
  >
    <path d="M3 21h18v-8H3v8zm6-6h2v4H9v-4zm4 0h2v4h-2v-4zM3 3v10h18V3H3zm6 6H7V5h2v4zm4 0h-2V5h2v4zm4 0h-2V5h2v4z" />
  </svg>
);

const LocationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6 text-indigo-500"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const FactoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.67.38m-4.5-8.006c-1.572-.43-3.271-.629-4.97-.629H9c-1.7 0-3.398.198-4.97.629m0 0c-1.069.16-1.837 1.094-1.837 2.175v4.784c0 .593.237 1.144.629 1.558a2.158 2.158 0 0 0 .67-.38m0 0h14.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
  </svg>
);

// New Icons for FMCG, Auto/Engineering, Other
const ShoppingBagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const CogIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const DotsHorizontalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
  </svg>
);

// Form Data Type
type FormDataType = {
  // About You
  name: string;
  mobile: string;
  email: string;

  // About Business
  company: string;
  sector: string;
  // subSector removed
  natureOfBusiness: string;

  // Operating Footprint
  siteCount: "Single site" | "Multiple sites";
  siteCountNumber?: string;
  country: "India" | "Other";
  otherCountryName?: string;
  legalEntityId: string;
};

const PREDEFINED_SECTORS = [
  "Manufacturing",
  "Services",
  "Trading",
  "FMCG",
  "Auto / Engineering",
];

export default function HomePage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    mobile: "",
    email: "",
    company: "",
    sector: "Manufacturing", // Default selection
    natureOfBusiness: "",
    siteCount: "Single site",
    siteCountNumber: "",
    country: "India",
    otherCountryName: "",
    legalEntityId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper to check if current sector is custom (not in predefined list)
  const isCustomSector = !PREDEFINED_SECTORS.includes(formData.sector) && formData.sector !== "";
  // If sector is empty string, we treat it as custom mode active but no value yet, 
  // or we need a specific state for "Other selected but empty"? 
  // actually if sector is "", it's not in predefined, so isCustomSector is true (if we remove '&& formData.sector !== ""').
  // Let's use a derived state or just check inclusion.

  // We need to know if "Other" button is active. 
  // If sector is NOT in predefined list, "Other" is active.
  const isOtherActive = !PREDEFINED_SECTORS.includes(formData.sector);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSectorClick = (sectorName: string) => {
    if (sectorName === "Other") {
      setFormData((prev) => ({ ...prev, sector: "" })); // Clear sector to show input
    } else {
      setFormData((prev) => ({ ...prev, sector: sectorName }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (/\d/.test(formData.name)) {
      newErrors.name = "Name should not contain numbers";
    }

    // Mobile Validation: 10 digits (Optional)
    const mobileRegex = /^[0-9]{10}$/;
    if (formData.mobile.trim() && !mobileRegex.test(formData.mobile)) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number";
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email ID is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.company.trim()) newErrors.company = "Company name is required";

    if (!formData.sector.trim()) {
      newErrors.sector = "Sector is required";
    }

    if (!formData.natureOfBusiness.trim()) {
      newErrors.natureOfBusiness = "Nature of business is required";
    }

    if (formData.siteCount === "Multiple sites") {
      if (!formData.siteCountNumber?.trim()) {
        newErrors.siteCountNumber = "Site count is required";
      } else {
        const count = parseInt(formData.siteCountNumber);
        if (isNaN(count) || count < 2) {
          newErrors.siteCountNumber = "Please enter a valid number of sites (minimum 2)";
        }
      }
    }

    if (formData.country === "Other" && !formData.otherCountryName?.trim()) {
      newErrors.otherCountryName = "Country name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Proceed to next step
      console.log("Form Submitted", formData);
      const params = new URLSearchParams();
      // Add existing form data to search params
      Object.entries(formData).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      router.push(`/choose-time?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800 font-sans selection:bg-indigo-100 p-2 md:p-4 pb-20 flex flex-col">
      <div className="w-full h-full max-w-7xl mx-auto flex flex-col flex-1">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-2 flex-shrink-0 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Scope 2 Assessment
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Book your Scope 2 self-assessment
            </h1>
            <p className="text-gray-500 mt-1 text-xs">
              Share a few basic details. Takes about 2 minutes.
            </p>
          </div>

          {/* Centered Preliminary Step */}
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Preliminary Step of 6 - Context Setup
            </p>
            <div className="flex items-center gap-3">
              <div className="h-1 w-32 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[17%]"></div>
              </div>
              <span className="text-sm font-bold text-gray-400">17%</span>
            </div>
          </div>

          <div className="mt-1 md:mt-0 flex flex-col items-end">
            {/* Logo placeholder */}
            <div className="flex items-center gap-3 opacity-90">
              <img
                src="/sustally-logo.png"
                alt="sustally"
                className="h-10 w-auto object-contain"
              />
              <div className="flex gap-1 h-12">
                <div className="w-[1px] bg-gray-300 h-full"></div>

              </div>
              <span className="font-medium text-gray-400 text-sm max-w-[200px] leading-tight text-left">
                choose sustally as your sustainability ally
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Main Grid: About You, Business, Info */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 min-h-0">

            {/* Column 1: About You (Span 4) */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative lg:overflow-hidden flex flex-col lg:h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                </div>
                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">About you</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Your name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full h-10 px-3 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.name ? "border-red-300 bg-red-50" : "border-gray-200"
                      }`}
                  />
                  {errors.name && <p className="text-red-500 text-[10px] mt-0.5">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Mobile number
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className={`w-full h-10 px-3 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.mobile ? "border-red-300 bg-red-50" : "border-gray-200"
                      }`}
                  />
                  {errors.mobile && <p className="text-red-500 text-[10px] mt-0.5">{errors.mobile}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Email ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Used to share your assessment summary"
                    className={`w-full h-10 px-3 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.email ? "border-red-300 bg-red-50" : "border-gray-200"
                      }`}
                  />
                  {errors.email && <p className="text-red-500 text-[10px] mt-0.5">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Column 2: About Your Business (Span 5) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative flex flex-col lg:h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">About your business</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Company name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className={`w-full h-10 px-3 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.company ? "border-red-300 bg-red-50" : "border-gray-200"
                      }`}
                  />
                  {errors.company && <p className="text-red-500 text-[10px] mt-0.5">{errors.company}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Sector <span className="text-red-500">*</span>
                  </label>

                  {/* Sector Selection */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { name: "Manufacturing", icon: <FactoryIcon /> },
                      { name: "Services", icon: <BriefcaseIcon /> },
                      { name: "Trading", icon: <TrendingUpIcon /> },
                      { name: "FMCG", icon: <ShoppingBagIcon /> },
                      { name: "Auto / Engineering", icon: <CogIcon /> },
                    ].map(s => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => handleSectorClick(s.name)}
                        className={`px-3 h-10 rounded-lg text-xs font-medium transition-colors border flex items-center gap-2 ${formData.sector === s.name
                          ? "bg-white border-indigo-200 text-indigo-700 shadow-sm"
                          : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
                          }`}
                      >
                        {s.icon}
                        {s.name}
                      </button>
                    ))}

                    {/* Other Button */}
                    <button
                      type="button"
                      onClick={() => handleSectorClick("Other")}
                      className={`px-3 h-10 rounded-lg text-xs font-medium transition-colors border flex items-center gap-2 ${isOtherActive
                        ? "bg-white border-indigo-200 text-indigo-700 shadow-sm"
                        : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                      <DotsHorizontalIcon />
                      Other
                    </button>
                  </div>

                  {/* Conditional Input for Other */}
                  {isOtherActive && (
                    <div className="animate-in fade-in slide-in-from-top-1 mb-2">
                      <input
                        type="text"
                        name="sector"
                        value={formData.sector}
                        onChange={handleChange}
                        placeholder="Enter your sector"
                        autoFocus
                        className={`w-full px-3 py-1.5 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.sector ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                      />
                    </div>
                  )}
                  {errors.sector && <p className="text-red-500 text-[10px] mt-0.5">{errors.sector}</p>}

                </div>

                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Nature of business activity <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="natureOfBusiness"
                  value={formData.natureOfBusiness}
                  onChange={handleChange}
                  placeholder="e.g., packaged snacks, CNC machining"
                  className={`w-full h-10 px-3 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.natureOfBusiness ? "border-red-300 bg-red-50" : "border-gray-200"
                    }`}
                />
                {errors.natureOfBusiness && <p className="text-red-500 text-[10px] mt-0.5">{errors.natureOfBusiness}</p>}
              </div>

            </div>

            {/* Column 3: What you'll get (Span 3) */}
            <div className="lg:col-span-3 flex flex-col justify-center">
              <h3 className="text-base font-bold text-gray-400 mb-2 bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent opacity-80">
                What you'll get
              </h3>

              <div className="space-y-4">
                <div className="bg-white p-3 rounded-xl border border-indigo-50 shadow-sm flex gap-3">
                  <div className="mt-1 bg-indigo-50 p-2 rounded-lg h-fit text-indigo-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 text-sm">Scope 2 estimate</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Initial <span className="text-blue-500 underline decoration-dotted cursor-help">carbon footprint</span> calculation for your operations
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-indigo-50 shadow-sm flex gap-3">
                  <div className="mt-1 bg-indigo-50 p-2 rounded-lg h-fit text-indigo-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Key insights</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Actionable <span className="text-indigo-500 underline decoration-dotted cursor-help">recommendations</span> for your business
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-50 shadow-sm flex gap-3">
                  <div className="mt-1 bg-gray-50 p-2 rounded-lg h-fit text-gray-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Next steps</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Clear roadmap for emission reduction
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Footprint Section */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative flex-shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <LocationIcon />
              </div>
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">Operating Footprint</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              {/* Sites Toggle */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  How many sites do you have?
                </label>
                <div className="flex flex-col sm:flex-row h-auto sm:h-10 bg-gray-100 p-1 rounded-lg w-full max-w-sm">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, siteCount: "Single site" }))}
                    className={`flex-1 h-full flex items-center justify-center rounded-md text-sm font-bold transition-all ${formData.siteCount === "Single site"
                      ? "bg-indigo-500 text-white shadow-md"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    <span className="mr-2">•</span> Single site
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, siteCount: "Multiple sites" }))}
                    className={`flex-1 h-full flex items-center justify-center rounded-md text-sm font-bold transition-all ${formData.siteCount === "Multiple sites"
                      ? "bg-indigo-500 text-white shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    <span className="mr-2 text-gray-400">•••</span> Multiple sites
                  </button>
                </div>
                {formData.siteCount === "Multiple sites" && (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                      Number of sites <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="siteCountNumber"
                      value={formData.siteCountNumber}
                      onChange={(e) => {
                        if (e.target.value.length <= 3) handleChange(e);
                      }}
                      placeholder="Enter number of sites"
                      min="2"
                      className={`w-full h-10 px-3 text-xs bg-gray-50 border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none transition-all ${errors.siteCountNumber ? "border-red-300 bg-red-50" : "border-gray-200"
                        }`}
                    />
                    {errors.siteCountNumber && <p className="text-red-500 text-[10px] mt-0.5">{errors.siteCountNumber}</p>}
                  </div>
                )}
              </div>

              {/* Country and LEI */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">
                    Country
                  </label>
                  <div className="flex flex-col sm:flex-row h-auto sm:h-10 bg-gray-50 p-1 rounded-lg w-full border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, country: "India" }))}
                      className={`flex-1 h-full flex items-center justify-center rounded-md text-sm font-bold transition-all ${formData.country === "India"
                        ? "bg-indigo-500 text-white"
                        : "text-gray-500 hover:text-gray-900"
                        }`}
                    >
                      India
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, country: "Other" }))}
                      className={`flex-1 h-full flex items-center justify-center rounded-md text-sm font-bold transition-all ${formData.country === "Other"
                        ? "bg-indigo-500 text-white"
                        : "text-gray-500 hover:text-gray-900"
                        }`}
                    >
                      Other
                    </button>
                  </div>
                  {formData.country === "Other" && (
                    <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                        Country Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="otherCountryName"
                        value={formData.otherCountryName}
                        onChange={handleChange}
                        placeholder="Enter country name"
                        className={`w-full px-3 py-1.5 text-xs bg-gray-50 border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none transition-all ${errors.otherCountryName ? "border-red-300 bg-red-50" : "border-gray-200"
                          }`}
                      />
                      {errors.otherCountryName && <p className="text-red-500 text-[10px] mt-0.5">{errors.otherCountryName}</p>}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                    Legal Entity ID (DIN etc.) <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="legalEntityId"
                    value={formData.legalEntityId}
                    onChange={handleChange}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 outline-none transition-all text-xs"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    If available — can be added later
                  </p>
                </div>
              </div>
            </div>

            {/* Action Bar inside the card bottom right */}
            <div className="flex justify-end items-center gap-4 mt-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] text-gray-400">
                You can review and edit these details later.
              </p>
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold transition-all transform hover:scale-105 text-sm"
              >
                Next: Choose time
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div >
        </form >
      </div >
    </div >
  );
}
