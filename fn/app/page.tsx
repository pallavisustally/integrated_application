"use client";

import { useState, useEffect } from "react";
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

type ConsolidationApproach = "Operational Control" | "Equity Share" | "Financial Control";

const CONSOLIDATION_OPTIONS: { id: ConsolidationApproach; label: string; sub: string; default?: boolean }[] = [
  { id: "Operational Control", label: "Operational Control", sub: "Default approach for most organizations", default: true },
  { id: "Equity Share", label: "Equity Share", sub: "Based on ownership percentage" },
  { id: "Financial Control", label: "Financial Control", sub: "Based on financial authority" },
];

// Form Data Type
type FormDataType = {
  // About You
  name: string;
  mobile: string;
  email: string;

  // About Business
  company: string;

  // Consolidation
  conditionalApproach: ConsolidationApproach;

  // Operating Footprint
  siteCount: "Single site" | "Multiple sites";
  siteCountNumber?: string;
  country: "India" | "Other";
  otherCountryName?: string;
  legalEntityId: string;
};

// PREDEFINED_SECTORS removed

export default function HomePage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    mobile: "",
    email: "",
    company: "",
    conditionalApproach: "Operational Control",
    siteCount: "Single site",
    siteCountNumber: "",
    country: "India",
    otherCountryName: "",
    legalEntityId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("step1FormData");
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) { }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem("step1FormData", JSON.stringify(formData));
    }
  }, [formData, isLoaded]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
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

    if (!formData.conditionalApproach) {
      newErrors.conditionalApproach = "Consolidation approach is required";
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
      router.push(`/choose-assessment?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800 font-sans selection:bg-indigo-100 p-2 md:p-4 pb-20 flex flex-col">
      <div className="w-full h-full max-w-7xl mx-auto flex flex-col flex-1">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-2 flex-shrink-0 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full tracking-wide">
                Assessment Booking
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Book Your Self Assessment
            </h1>
            <p className="text-gray-500 mt-1 text-xs">
              Share A Few Basic Details. Takes About 2 Minutes.
            </p>
          </div>

          {/* Centered Preliminary Step */}
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs font-semibold text-gray-400 tracking-widest mb-1">
              Preliminary Step Of 6 - Context Setup
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
                Choose Sustally As Your Sustainability Ally
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 min-h-0">
          {/* 2×2 equal grid — all cards share the same size and shape */}
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[1fr_1fr] gap-4 flex-1 min-h-0 lg:min-h-[520px] items-stretch">

            {/* Card 1: About You */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col h-full min-h-[280px] lg:min-h-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                </div>
                <h2 className="text-[10px] font-bold text-gray-400 tracking-wider pt-1">About You</h2>
              </div>

              <div className="space-y-4 flex-1 flex flex-col justify-start">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Your Name <span className="text-red-500">*</span>
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
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10 Digit Mobile Number"
                    className={`w-full h-10 px-3 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.mobile ? "border-red-300 bg-red-50" : "border-gray-200"
                      }`}
                  />
                  {errors.mobile && <p className="text-red-500 text-[10px] mt-0.5">{errors.mobile}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Email Id <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Used To Share Your Assessment Summary"
                    className={`w-full h-10 px-3 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.email ? "border-red-300 bg-red-50" : "border-gray-200"
                      }`}
                  />
                  {errors.email && <p className="text-red-500 text-[10px] mt-0.5">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Card 2: About Your Business */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col h-full min-h-[280px] lg:min-h-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-[10px] font-bold text-gray-400 tracking-wider pt-1">About Your Business</h2>
              </div>

              <div className="flex-1 flex flex-col justify-start">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Company Name <span className="text-red-500">*</span>
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
              </div>

            </div>

            {/* Card 3: Consolidation Approach */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col h-full min-h-[280px] lg:min-h-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-[10px] font-bold text-gray-400 tracking-wider pt-1">
                  Consolidation Approach <span className="text-red-500">*</span>
                </h2>
              </div>

              <div className="space-y-2 flex-1 flex flex-col justify-start min-h-0">
                {CONSOLIDATION_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setFormData((prev) => ({ ...prev, conditionalApproach: opt.id }));
                        if (errors.conditionalApproach) {
                          setErrors((prev) => ({ ...prev, conditionalApproach: "" }));
                        }
                      }
                    }}
                    className={`relative border rounded-xl p-2.5 cursor-pointer transition-all hover:border-indigo-300 ${formData.conditionalApproach === opt.id
                      ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500"
                      : errors.conditionalApproach ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-200"
                      }`}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, conditionalApproach: opt.id }));
                      if (errors.conditionalApproach) {
                        setErrors((prev) => ({ ...prev, conditionalApproach: "" }));
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${formData.conditionalApproach === opt.id ? "border-indigo-600" : "border-gray-300"
                        }`}>
                        {formData.conditionalApproach === opt.id && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${formData.conditionalApproach === opt.id ? "text-indigo-900" : "text-gray-700"}`}>
                          {opt.label}
                          {opt.default && <span className="text-indigo-500 text-[10px] font-normal ml-1">(default)</span>}
                        </p>
                        <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                          {opt.sub}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-auto pt-2">
                Defines how emissions are attributed across your organization
              </p>
              {errors.conditionalApproach && <p className="text-red-500 text-[10px] mt-1">{errors.conditionalApproach}</p>}
            </div>

            {/* Card 4: Operating Footprint */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col h-full min-h-[280px] lg:min-h-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <LocationIcon />
                </div>
                <h2 className="text-[10px] font-bold text-gray-400 tracking-wider pt-1">Operating Footprint</h2>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-0">
              {/* Sites Toggle */}
              <div className="flex flex-col">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  How Many Sites Do You Have?
                </label>
                <div className="flex flex-col sm:flex-row h-auto sm:h-10 bg-gray-100 p-1 rounded-lg w-full">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, siteCount: "Single site" }))}
                    className={`flex-1 h-full py-2 sm:py-0 flex items-center justify-center rounded-md text-sm font-bold transition-all ${formData.siteCount === "Single site"
                      ? "bg-indigo-500 text-white shadow-md"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    <span className="mr-2">•</span> Single Site
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, siteCount: "Multiple sites" }))}
                    className={`flex-1 h-full py-2 sm:py-0 flex items-center justify-center rounded-md text-sm font-bold transition-all ${formData.siteCount === "Multiple sites"
                      ? "bg-indigo-500 text-white shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    <span className="mr-2 text-gray-400">•••</span> Multiple Sites
                  </button>
                </div>
                {formData.siteCount === "Multiple sites" && (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                      Number Of Sites <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="siteCountNumber"
                      value={formData.siteCountNumber}
                      onChange={(e) => {
                        if (e.target.value.length <= 3) handleChange(e);
                      }}
                      placeholder="Enter Number Of Sites"
                      min="2"
                      className={`w-full h-10 px-3 text-xs bg-gray-50 border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none transition-all ${errors.siteCountNumber ? "border-red-300 bg-red-50" : "border-gray-200"
                        }`}
                    />
                    {errors.siteCountNumber && <p className="text-red-500 text-[10px] mt-0.5">{errors.siteCountNumber}</p>}
                  </div>
                )}
              </div>

              {/* Country and LEI */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">
                    Country
                  </label>
                  <div className="flex flex-col sm:flex-row h-auto sm:h-10 bg-gray-50 p-1 rounded-lg w-full border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, country: "India" }))}
                      className={`flex-1 h-full py-2 sm:py-0 flex items-center justify-center rounded-md text-sm font-bold transition-all ${formData.country === "India"
                        ? "bg-indigo-500 text-white"
                        : "text-gray-500 hover:text-gray-900"
                        }`}
                    >
                      India
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, country: "Other" }))}
                      className={`flex-1 h-full py-2 sm:py-0 flex items-center justify-center rounded-md text-sm font-bold transition-all ${formData.country === "Other"
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
                        placeholder="Enter Country Name"
                        className={`w-full px-3 py-1.5 text-xs bg-gray-50 border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none transition-all ${errors.otherCountryName ? "border-red-300 bg-red-50" : "border-gray-200"
                          }`}
                      />
                      {errors.otherCountryName && <p className="text-red-500 text-[10px] mt-0.5">{errors.otherCountryName}</p>}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                    Legal Entity Id (Din Etc.) <span className="text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="legalEntityId"
                    value={formData.legalEntityId}
                    onChange={handleChange}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 outline-none transition-all text-xs"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    If Available — Can Be Added Later
                  </p>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Action bar — outside grid so all cards stay equal shape */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2 flex-shrink-0 border-t border-gray-200">
            <p className="text-[10px] text-gray-400 sm:mr-auto">
              You Can Review And Edit These Details Later.
            </p>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold transition-all transform hover:scale-105 text-sm"
            >
              Next: Choose Assessment
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form >
      </div >
    </div >
  );
}
