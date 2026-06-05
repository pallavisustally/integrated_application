"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookingWizardShell, useWizardTheme } from "@/components/booking-shell";

type AssessmentType = "SCOPE_1" | "SCOPE_2";

type Step1FormData = {
  name?: string;
  mobile?: string;
  email?: string;
  company?: string;
  conditionalApproach?: string;
  siteCount?: string;
  siteCountNumber?: string;
  country?: string;
  otherCountryName?: string;
  legalEntityId?: string;
  assessmentType?: AssessmentType;
};

const ASSESSMENT_OPTIONS: {
  id: AssessmentType;
  label: string;
  title: string;
  description: string;
}[] = [
  {
    id: "SCOPE_2",
    label: "Scope 2",
    title: "Purchased electricity",
    description: "Estimate emissions from grid electricity and renewable procurement for your operations.",
  },
  {
    id: "SCOPE_1",
    label: "Scope 1",
    title: "Direct emissions inventory",
    description: "Calculate direct greenhouse gas emissions from fuel combustion and industrial processes.",
  },
];

function ChooseAssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useWizardTheme();
  const [formData, setFormData] = useState<Step1FormData>({});
  const [assessmentType, setAssessmentType] = useState<AssessmentType | "">("");
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fromParams: Step1FormData = {};
    searchParams.forEach((value, key) => {
      fromParams[key as keyof Step1FormData] = value as never;
    });

    let merged = { ...fromParams };
    const saved = sessionStorage.getItem("step1FormData");
    if (saved) {
      try {
        merged = { ...JSON.parse(saved), ...fromParams };
      } catch {
        /* ignore */
      }
    }

    if (!merged.email?.trim()) {
      router.replace("/");
      return;
    }

    setFormData(merged);
    if (merged.assessmentType === "SCOPE_1" || merged.assessmentType === "SCOPE_2") {
      setAssessmentType(merged.assessmentType);
    }
    setIsLoaded(true);
  }, [router, searchParams]);

  const handleContinue = () => {
    if (!assessmentType) {
      setError("Please select an assessment type");
      return;
    }

    const next = { ...formData, assessmentType };
    sessionStorage.setItem("step1FormData", JSON.stringify(next));

    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
    router.push(`/choose-time?${params.toString()}`);
  };

  const handleBack = () => {
    sessionStorage.setItem("step1FormData", JSON.stringify({ ...formData, assessmentType: assessmentType || undefined }));
    const params = new URLSearchParams();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "assessmentType" && value) params.append(key, String(value));
    });
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  };

  if (!isLoaded) {
    return (
      <BookingWizardShell step={2} theme={theme} onThemeToggle={toggleTheme}>
        <section className="step-page active booking-page">
          <p className="step-sub">Loading…</p>
        </section>
      </BookingWizardShell>
    );
  }

  return (
    <BookingWizardShell step={2} theme={theme} onThemeToggle={toggleTheme}>
      <section className="step-page active booking-page">
        <h1 className="step-title">
          Assessment <em>type</em>
        </h1>
        <p className="step-sub">
          Select Scope 1 or Scope 2 before booking your assessment slot.
        </p>

        <div className="form-card booking-panel">
          <h2 className="booking-field-label" style={{ fontSize: 14, textTransform: 'none', letterSpacing: 0 }}>
            Which assessment do you need? <span className="required-mark">*</span>
          </h2>
          <p className="booking-field-hint" style={{ marginBottom: 20 }}>
            Booking for <strong>{formData.company || 'your company'}</strong>
          </p>

          <div className="booking-grid-2">
            {ASSESSMENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setAssessmentType(opt.id);
                  setError('');
                }}
                className={`booking-option-card ${assessmentType === opt.id ? 'selected' : ''} ${error ? 'is-error' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="booking-radio">
                    {assessmentType === opt.id ? <div className="booking-radio-dot" /> : null}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: assessmentType === opt.id ? 'var(--purple-deep)' : 'var(--ink)' }}>
                      {opt.label}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--ink-soft)', marginTop: 2 }}>
                      {opt.title}
                    </p>
                    <p className="booking-field-hint" style={{ marginTop: 8 }}>
                      {opt.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {error ? <p className="field-error" style={{ marginTop: 16 }}>{error}</p> : null}

          <div className="booking-footer">
            <button type="button" className="btn ghost" onClick={handleBack}>
              Back to details
            </button>
            <button type="button" className="btn primary" onClick={handleContinue}>
              Continue to choose slot
            </button>
          </div>
        </div>
      </section>
    </BookingWizardShell>
  );
}

export default function ChooseAssessmentPage() {
  return (
    <Suspense
      fallback={
        <BookingWizardShell step={2} theme="light" onThemeToggle={() => {}}>
          <section className="step-page active booking-page">
            <p className="step-sub">Loading…</p>
          </section>
        </BookingWizardShell>
      }
    >
      <ChooseAssessmentContent />
    </Suspense>
  );
}
