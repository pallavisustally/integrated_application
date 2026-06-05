"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookingWizardShell, useWizardTheme } from "@/components/booking-shell";

const LocationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6 text-[var(--purple)]"
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
  const { theme, toggleTheme } = useWizardTheme();

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
    <BookingWizardShell step={1} theme={theme} onThemeToggle={toggleTheme}>
      <section className="step-page active booking-page">
        <h1 className="step-title">
          Your <em>details</em>
        </h1>
        <p className="step-sub">
          Share a few basics to book your assessment slot. Takes about two minutes.
        </p>

        <form onSubmit={handleSubmit} className="booking-page">
          <div className="booking-grid-2 lg:min-h-[520px] items-stretch">

            {/* Card 1: About You */}
            <div className="form-card booking-panel flex flex-col h-full min-h-[280px] lg:min-h-0">
              <div className="booking-panel-head">
                <div className="booking-panel-icon">
                  <div className="booking-radio-dot" />
                </div>
                <h2>About you</h2>
              </div>

              <div className="space-y-4 flex-1 flex flex-col justify-start">
                <div>
                  <label className="booking-field-label">
                    Your name <span className="required-mark">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`booking-input ${errors.name ? "is-error" : ""}`}
                  />
                  {errors.name && <p className="field-error mt-0.5">{errors.name}</p>}
                </div>

                <div>
                  <label className="booking-field-label">Mobile number</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10 digit mobile number"
                    className={`booking-input ${errors.mobile ? "is-error" : ""}`}
                  />
                  {errors.mobile && <p className="field-error mt-0.5">{errors.mobile}</p>}
                </div>

                <div>
                  <label className="booking-field-label">
                    Email <span className="required-mark">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Used to share your assessment summary"
                    className={`booking-input ${errors.email ? "is-error" : ""}`}
                  />
                  {errors.email && <p className="field-error mt-0.5">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Card 2: About Your Business */}
            <div className="form-card booking-panel flex flex-col h-full min-h-[280px] lg:min-h-0">
              <div className="booking-panel-head">
                <div className="booking-panel-icon">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2>About your business</h2>
              </div>

              <div className="flex-1 flex flex-col justify-start">
                <div>
                  <label className="booking-field-label">
                    Company name <span className="required-mark">*</span>
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className={`booking-input ${errors.company ? "is-error" : ""}`}
                  />
                  {errors.company && <p className="field-error mt-0.5">{errors.company}</p>}
                </div>
              </div>

            </div>

            {/* Card 3: Consolidation Approach */}
            <div className="form-card booking-panel flex flex-col h-full min-h-[280px] lg:min-h-0">
              <div className="booking-panel-head">
                <div className="booking-panel-icon">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <h2>
                  Consolidation approach <span className="required-mark">*</span>
                </h2>
              </div>

              <div className="space-y-2 flex-1 flex flex-col justify-start min-h-0">
                {CONSOLIDATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`booking-option-card ${formData.conditionalApproach === opt.id ? "selected" : ""} ${errors.conditionalApproach ? "is-error" : ""}`}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, conditionalApproach: opt.id }));
                      if (errors.conditionalApproach) {
                        setErrors((prev) => ({ ...prev, conditionalApproach: "" }));
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="booking-radio">
                        {formData.conditionalApproach === opt.id ? <div className="booking-radio-dot" /> : null}
                      </div>
                      <div>
                        <p className="text-xs font-bold" style={{ color: formData.conditionalApproach === opt.id ? "var(--purple-deep)" : "var(--ink-soft)" }}>
                          {opt.label}
                          {opt.default ? <span style={{ color: "var(--purple)", fontWeight: 400, marginLeft: 4 }}>(default)</span> : null}
                        </p>
                        <p className="booking-field-hint" style={{ marginTop: 2 }}>
                          {opt.sub}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="booking-field-hint mt-auto pt-2">
                Defines how emissions are attributed across your organization
              </p>
              {errors.conditionalApproach && <p className="field-error mt-1">{errors.conditionalApproach}</p>}
            </div>

            {/* Card 4: Operating Footprint */}
            <div className="form-card booking-panel flex flex-col h-full min-h-[280px] lg:min-h-0">
              <div className="booking-panel-head">
                <div className="booking-panel-icon">
                  <LocationIcon />
                </div>
                <h2>Operating footprint</h2>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-0">
              <div className="flex flex-col">
                <label className="booking-field-label">How many sites do you have?</label>
                <div className="booking-segmented">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, siteCount: "Single site" }))}
                    className={formData.siteCount === "Single site" ? "active" : ""}
                  >
                    Single site
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, siteCount: "Multiple sites" }))}
                    className={formData.siteCount === "Multiple sites" ? "active" : ""}
                  >
                    Multiple sites
                  </button>
                </div>
                {formData.siteCount === "Multiple sites" && (
                  <div className="mt-2">
                    <label className="booking-field-label">
                      Number of sites <span className="required-mark">*</span>
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
                      className={`booking-input ${errors.siteCountNumber ? "is-error" : ""}`}
                    />
                    {errors.siteCountNumber && <p className="field-error mt-0.5">{errors.siteCountNumber}</p>}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="booking-field-label">Country</label>
                  <div className="booking-segmented">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, country: "India" }))}
                      className={formData.country === "India" ? "active" : ""}
                    >
                      India
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, country: "Other" }))}
                      className={formData.country === "Other" ? "active" : ""}
                    >
                      Other
                    </button>
                  </div>
                  {formData.country === "Other" && (
                    <div className="mt-2">
                      <label className="booking-field-label">
                        Country name <span className="required-mark">*</span>
                      </label>
                      <input
                        type="text"
                        name="otherCountryName"
                        value={formData.otherCountryName}
                        onChange={handleChange}
                        placeholder="Enter country name"
                        className={`booking-input ${errors.otherCountryName ? "is-error" : ""}`}
                      />
                      {errors.otherCountryName && <p className="field-error mt-0.5">{errors.otherCountryName}</p>}
                    </div>
                  )}
                </div>

                <div>
                  <label className="booking-field-label">
                    Legal entity ID <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="legalEntityId"
                    value={formData.legalEntityId}
                    onChange={handleChange}
                    className="booking-input"
                  />
                  <p className="booking-field-hint">If available — can be added later</p>
                </div>
              </div>
            </div>
            </div>
          </div>

          <div className="booking-footer">
            <p className="booking-footer-note">You can review and edit these details later.</p>
            <button type="submit" className="btn primary">
              Continue to assessment type
            </button>
          </div>
        </form>
      </section>
    </BookingWizardShell>
  );
}
