"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800 font-sans selection:bg-indigo-100 p-2 md:p-4 pb-20 flex flex-col">
      <div className="w-full h-full max-w-4xl mx-auto flex flex-col flex-1">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 flex-shrink-0 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full tracking-wide">
                Assessment Booking
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Choose Your Assessment</h1>
            <p className="text-gray-500 mt-1 text-xs">
              Select Scope 1 or Scope 2 before booking your assessment slot.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <p className="text-xs font-semibold text-gray-400 tracking-widest mb-1">
              Step 2 Of 6 — Choose Assessment
            </p>
            <div className="flex items-center gap-3">
              <div className="h-1 w-32 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[33%]" />
              </div>
              <span className="text-sm font-bold text-gray-400">33%</span>
            </div>
          </div>

          <div className="mt-1 md:mt-0 flex flex-col items-end opacity-90">
            <img src="/sustally-logo.png" alt="sustally" className="h-10 w-auto object-contain" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex-1 flex flex-col">
          <h2 className="text-sm font-bold text-gray-900 mb-1">
            Which assessment do you need? <span className="text-red-500">*</span>
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            Booking for <span className="font-semibold text-gray-700">{formData.company || "your company"}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            {ASSESSMENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setAssessmentType(opt.id);
                  setError("");
                }}
                className={`text-left relative border rounded-2xl p-5 cursor-pointer transition-all hover:border-indigo-300 hover:shadow-md ${assessmentType === opt.id
                  ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500"
                  : error
                    ? "bg-red-50 border-red-300"
                    : "bg-gray-50 border-gray-200"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${assessmentType === opt.id ? "border-indigo-600" : "border-gray-300"
                      }`}
                  >
                    {assessmentType === opt.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${assessmentType === opt.id ? "text-indigo-900" : "text-gray-800"}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs font-semibold text-gray-600 mt-0.5">{opt.title}</p>
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">{opt.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {error && <p className="text-red-500 text-xs mt-4">{error}</p>}

          <div className="flex justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              ← Back to details
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold transition-all transform hover:scale-105 text-sm"
            >
              Next: Choose Time
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChooseAssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
          Loading…
        </div>
      }
    >
      <ChooseAssessmentContent />
    </Suspense>
  );
}
