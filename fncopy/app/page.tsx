"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/MainLayout";

// Icons
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

const ShoppingBagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const CogIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l-.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
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

    if (!formData.sector.trim()) {
      newErrors.sector = "Sector is required";
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
      console.log("Form Submitted", formData);
      const params = new URLSearchParams();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      router.push(`/choose-time?${params.toString()}`);
    } else {
      console.log("Validation Failed");
    }
  };

  return (
    <MainLayout currentStep={1} progressPercentage={17}>
      <div className="max-w-7xl px-6 pt-10">
        <div className="mb-8">
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            Scope 2 Assessment
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
            Book your Scope 2 self-assessment
          </h1>
          <p className="text-gray-500">
            Share a few basic details. Takes about 2 minutes.
          </p>
        </div>

        <div className="border border-gray-200 rounded-3xl p-8 bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-0">

            {/* About You Section */}
            <div className="pb-8">
              <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-1/3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                  </div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pt-1.5">About you</h3>
                </div>
                <div className="w-full md:w-2/3 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full h-11 px-4 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm ${errors.name ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      className={`w-full h-11 px-4 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm ${errors.mobile ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                    />
                    {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Used to share your assessment summary"
                      className={`w-full h-11 px-4 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm ${errors.email ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* About Your Business Section */}
            <div className="py-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-1/3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pt-1.5">About your business</h3>
                </div>
                <div className="w-full md:w-2/3 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className={`w-full h-11 px-4 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm ${errors.company ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                    />
                    {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sector <span className="text-red-500">*</span>
                    </label>
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
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2 ${formData.sector === s.name
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                          {s.icon}
                          {s.name}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleSectorClick("Other")}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2 ${isOtherActive
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                      >
                        <DotsHorizontalIcon />
                        Other
                      </button>
                    </div>
                    {isOtherActive && (
                      <div className="mt-2">
                        <input
                          type="text"
                          name="sector"
                          value={formData.sector}
                          onChange={handleChange}
                          placeholder="Enter your sector"
                          autoFocus
                          className={`w-full h-11 px-4 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm ${errors.sector ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                        />
                      </div>
                    )}
                    {errors.sector && <p className="text-red-500 text-xs mt-1">{errors.sector}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nature of business activity
                    </label>
                    <input
                      type="text"
                      name="natureOfBusiness"
                      value={formData.natureOfBusiness}
                      onChange={handleChange}
                      placeholder="e.g., packaged snacks, CNC machining"
                      className="w-full h-11 px-4 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Footprint Section */}
            <div className="py-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-1/3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pt-1.5">Operating Footprint</h3>
                </div>
                <div className="w-full md:w-2/3 space-y-6">

                  {/* Sites */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How many sites do you have?
                    </label>
                    <div className="flex bg-gray-100 p-1.5 rounded-xl w-full max-w-sm">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, siteCount: "Single site" }))}
                        className={`flex-1 py-1.5 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${formData.siteCount === "Single site"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-900"
                          }`}
                      >
                        Single site
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, siteCount: "Multiple sites" }))}
                        className={`flex-1 py-1.5 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${formData.siteCount === "Multiple sites"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-900"
                          }`}
                      >
                        Multiple sites
                      </button>
                    </div>

                    {formData.siteCount === "Multiple sites" && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                          Number of sites <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="siteCountNumber"
                          value={formData.siteCountNumber}
                          onChange={handleChange}
                          placeholder="Enter number of sites"
                          min="2"
                          className={`w-full h-11 px-4 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm ${errors.siteCountNumber ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                        />
                        {errors.siteCountNumber && <p className="text-red-500 text-xs mt-1">{errors.siteCountNumber}</p>}
                      </div>
                    )}
                  </div>

                  {/* Country & LEI Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <div className="flex bg-gray-100 p-1.5 rounded-xl w-full">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, country: "India" }))}
                          className={`flex-1 py-1.5 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${formData.country === "India"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                          India
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, country: "Other" }))}
                          className={`flex-1 py-1.5 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${formData.country === "Other"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                          Other
                        </button>
                      </div>
                      {formData.country === "Other" && (
                        <div className="mt-3">
                          <input
                            type="text"
                            name="otherCountryName"
                            value={formData.otherCountryName}
                            onChange={handleChange}
                            placeholder="Enter country name"
                            className={`w-full h-11 px-4 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm ${errors.otherCountryName ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                          />
                          {errors.otherCountryName && <p className="text-red-500 text-xs mt-1">{errors.otherCountryName}</p>}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Legal Entity ID <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        name="legalEntityId"
                        value={formData.legalEntityId}
                        onChange={handleChange}
                        placeholder="DIN etc."
                        className="w-full h-11 px-4 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-8 flex flex-col items-end gap-3">
              <p className="text-xs text-gray-400">
                You can review and edit these details later.
              </p>
              <div className="flex gap-4">

                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  Next: Choose time
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </MainLayout>
  );
}
