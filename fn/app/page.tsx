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

// Form Data Type
type FormDataType = {
  // About You
  name: string;
  mobile: string;
  email: string;

  // About Business
  company: string;
  sector: string;
  subSector: string; // e.g. "FMCG"
  natureOfBusiness: string;

  // Operating Footprint
  siteCount: "Single site" | "Multiple sites";
  siteCountNumber?: string;
  country: "India" | "Other";
  otherCountryName?: string;
  legalEntityId: string;
};

export default function HomePage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    mobile: "",
    email: "",
    company: "",
    sector: "Manufacturing", // Default selection
    subSector: "FMCG", // Default selection
    natureOfBusiness: "",
    siteCount: "Single site",
    siteCountNumber: "",
    country: "India",
    otherCountryName: "",
    legalEntityId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCustomSubSector, setIsCustomSubSector] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSectorChange = (sector: string) => {
    setFormData((prev) => ({ ...prev, sector }));
    // Reset sub-sector when sector changes if needed, 
    // but sticking to existing behavior for now, maybe just reset custom toggle?
    setIsCustomSubSector(false);
  };

  const handleSubSectorChange = (subSector: string) => {
    setFormData((prev) => ({ ...prev, subSector }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (/\d/.test(formData.name)) {
      newErrors.name = "Name should not contain numbers";
    }

    // Mobile Validation: 10 digits
    const mobileRegex = /^[0-9]{10}$/;
    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!mobileRegex.test(formData.mobile)) {
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
    <div className="h-screen w-screen overflow-hidden bg-gray-50 text-gray-800 font-sans selection:bg-indigo-100 p-2 md:p-4 flex flex-col">
      <div className="w-full h-full max-w-7xl mx-auto flex flex-col">
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
                <div className="h-full bg-indigo-1500 w-[17%]"></div>
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
            <div className="lg:col-span-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col h-full">
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
                    className={`w-full px-3 py-1.5 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.name ? "border-red-300 bg-red-50" : "border-gray-200"
                      }`}
                  />
                  {errors.name && <p className="text-red-500 text-[10px] mt-0.5">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Mobile number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className={`w-full px-3 py-1.5 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.mobile ? "border-red-300 bg-red-50" : "border-gray-200"
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
                    className={`w-full px-3 py-1.5 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.email ? "border-red-300 bg-red-50" : "border-gray-200"
                      }`}
                  />
                  {errors.email && <p className="text-red-500 text-[10px] mt-0.5">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Column 2: About Your Business (Span 5) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative flex flex-col h-full">
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
                    className={`w-full px-3 py-1.5 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.company ? "border-red-300 bg-red-50" : "border-gray-200"
                      }`}
                  />
                  {errors.company && <p className="text-red-500 text-[10px] mt-0.5">{errors.company}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Sector <span className="text-red-500">*</span>
                  </label>

                  {/* Sector Caps */}
                  <div className="flex gap-2 mb-3">
                    {[
                      { name: "Manufacturing", icon: <FactoryIcon /> },
                      { name: "Services", icon: <BriefcaseIcon /> },
                      { name: "Trading", icon: <TrendingUpIcon /> }
                    ].map(s => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => handleSectorChange(s.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-2 ${formData.sector === s.name
                          ? "bg-white border-indigo-200 text-indigo-700 shadow-sm"
                          : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
                          }`}
                      >
                        {s.icon}
                        {s.name}
                      </button>
                    ))}
                  </div>

                  {/* Sub Sector Pills */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {["FMCG", "Auto / Engineering"].map(sub => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            handleSubSectorChange(sub);
                            setIsCustomSubSector(false);
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${!isCustomSubSector && formData.subSector === sub
                            ? "bg-indigo-500 border-indigo-500 text-white"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                          {/* <span className="mr-1">🏭</span> */}
                          {sub}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomSubSector(true);
                          setFormData(prev => ({ ...prev, subSector: "" }));
                        }}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isCustomSubSector
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    {isCustomSubSector && (
                      <div className="animate-in fade-in slide-in-from-top-1">
                        <input
                          type="text"
                          value={formData.subSector}
                          onChange={(e) => handleSubSectorChange(e.target.value)}
                          placeholder="Enter sub-sector"
                          autoFocus
                          className="w-full px-3 py-1.5 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Nature of business activity
                  </label>
                  <input
                    type="text"
                    name="natureOfBusiness"
                    value={formData.natureOfBusiness}
                    onChange={handleChange}
                    placeholder="e.g., packaged snacks, CNC machining"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  {/* <textarea
                    name="natureOfBusiness"
                    value={formData.natureOfBusiness}
                    onChange={handleChange}
                    rows={2}
                    placeholder="e.g., packaged snacks, CNC machining"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  /> */}
                </div>
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
                <div className="flex bg-gray-100 p-1 rounded-lg w-full max-w-sm">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, siteCount: "Single site" }))}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${formData.siteCount === "Single site"
                      ? "bg-indigo-500 text-white shadow-md"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    <span className="mr-2">•</span> Single site
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, siteCount: "Multiple sites" }))}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${formData.siteCount === "Multiple sites"
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
                      onChange={handleChange}
                      placeholder="Enter number of sites"
                      min="2"
                      className={`w-full px-3 py-1.5 text-xs bg-gray-50 border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none transition-all ${errors.siteCountNumber ? "border-red-300 bg-red-50" : "border-gray-200"
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
                  <div className="flex bg-gray-50 p-1 rounded-lg w-full border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, country: "India" }))}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${formData.country === "India"
                        ? "bg-indigo-500 text-white"
                        : "text-gray-500 hover:text-gray-900"
                        }`}
                    >
                      • India
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, country: "Other" }))}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${formData.country === "Other"
                        ? "bg-indigo-500 text-white"
                        : "text-gray-500 hover:text-gray-900"
                        }`}
                    >
                      • Other
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
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 outline-none transition-all text-xs"
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
