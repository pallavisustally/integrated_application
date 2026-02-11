"use client";

import { useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import MainLayout from "@/components/MainLayout";

// ------------- ICONS -------------

const BoundaryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const EnergyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

const RenewableIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.5a9.5 9.5 0 0 0-9.5 9.5c0 5.25 4.25 9.5 9.5 9.5s9.5-4.25 9.5-9.5A9.5 9.5 0 0 0 12 2.5z" />
    <path d="M12 7.5v9" />
    <path d="M7.5 12h9" />
  </svg>
);

const EvidenceIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const CrossIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9 12l2 2 4-4"></path>
  </svg>
);

// ------------- COMPONENTS -------------

const ReviewCard = ({
  title,
  icon,
  children,
  accentColor,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accentColor: string;
}) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
    <div
      className="absolute left-0 top-0 bottom-0 w-1"
      style={{ backgroundColor: accentColor }}
    ></div>
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-2 rounded-lg bg-opacity-10`} style={{ backgroundColor: `${accentColor}20` }}>
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 text-sm tracking-wide uppercase">{title}</h3>
    </div>
    <div className="flex-1">
      {children}
    </div>
  </div>
);

const DetailRow = ({ label, value, subLabel }: { label: string; value: string; subLabel?: string }) => (
  <div className="mb-4 last:mb-0">
    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</p>
    <p className={`font-semibold text-gray-900 text-sm ${value === "Not specified" || value === "-" ? "text-gray-400 italic" : ""}`}>
      {value}
    </p>
    {subLabel && <p className="text-xs text-gray-500 mt-1">{subLabel}</p>}
  </div>
);

const DetailGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
    {children}
  </div>
);


function ScopeReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitAssessment = async () => {
    // The assessment is already submitted in the previous step (Scope Page)
    // We just simulate the completion here to show the Thank You message
    setIsSubmitting(true);

    // Simulate a small delay for better UX
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1000);
  };

  const data = useMemo(() => {
    return {
      // Page 1 - Box 1
      state: searchParams.get("state") || "Not specified",
      siteCount: searchParams.get("siteCount") || "Not specified",
      facilityName: searchParams.get("facilityName") || "Not specified",

      // Page 1 - Box 2
      renewableProcurement: searchParams.get("renewableProcurement") || "Not specified",
      onsiteExportedKwh: searchParams.get("onsiteExportedKwh") || "0",
      netMeteringApplicable: searchParams.get("netMeteringApplicable") || "No",

      // Page 1 - Box 3
      reportingYear: searchParams.get("reportingYear") || "2024",
      reportingPeriod: searchParams.get("reportingPeriod") || "Annual",
      conditionalApproach: searchParams.get("conditionalApproach") || "Not specified",

      // Page 1 - Box 4
      scopeBoundaryNotes: searchParams.get("scopeBoundaryNotes") || "Not specified",

      // Page 2 - Box 1
      energyActivityInput: searchParams.get("energyActivityInput") || "Yearly",
      energyCategory: searchParams.get("energyCategory") || "-",
      trackingType: searchParams.get("trackingType") || "-",
      electricityPurchased: searchParams.get("electricityPurchased") || "-",
      energyConsumption: searchParams.get("energyConsumption") || "-",
      energySupportingEvidenceFile:
        searchParams.get("energySupportingEvidenceFile") || "No supporting evidence uploaded",
      energySourceDescription: searchParams.get("energySourceDescription") || "Bill",

      // Page 2 - Box 2
      hasRenewableElectricity:
        searchParams.get("hasRenewableElectricity") || "No",
      renewableElectricity: searchParams.get("renewableElectricity") || "1212 kWh",
      renewableEnergyConsumption:
        searchParams.get("renewableEnergyConsumption") || "12 GJ",
      renewableSupportingEvidenceFile:
        searchParams.get("renewableSupportingEvidenceFile") || "No supporting evidence uploaded",
      renewableEnergySourceDescription:
        searchParams.get("renewableEnergySourceDescription") || "-",
    };
  }, [searchParams]);

  if (isSubmitted) {
    return (
      <main className="h-screen overflow-hidden bg-[#f8f9fa] p-4 font-sans text-gray-900 flex flex-col items-center justify-center">
        <div className="w-full max-w-6xl flex flex-col h-full bg-white rounded-3xl shadow-sm p-8 relative">

          {/* Header with Logo */}
          <div className="absolute top-8 right-8 flex items-center gap-6 opacity-90">
            <img src="/sustally-logo.png" alt="Sustally" className="h-8 object-contain" />
            <div className="h-8 w-[1px] bg-gray-300 mx-1"></div>
            <div className="flex flex-col justify-center">
              <span className="hidden md:block font-medium text-gray-500 text-xs max-w-[150px] leading-tight text-left">
                Choose Sustally as your sustainability ally
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
            {/* Big Green Checkmark */}
            <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-8 shadow-sm">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Thank you! Your assessment has been successfully completed.
            </h1>

            <p className="text-gray-500 text-lg">
              You will get certificate directly to your email once admin approves your assignment.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <MainLayout currentStep={4} progressPercentage={68}>
      <div className="w-full max-w-7xl mx-auto flex flex-col h-full p-6">

        <h1 className="text-xl font-bold text-gray-900 mb-8">Review your assessment</h1>

        <div className="space-y-0 pb-12">
          {/* Section 1: Boundary & Site Details */}
          <div className="pb-8">
            <div className="flex flex-col md:flex-row gap-10">
              <div className="w-full md:w-1/3 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <BoundaryIcon />
                </div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pt-1.5">Boundary & Site Details</h3>
              </div>
              <div className="w-full md:w-2/3">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <DetailGrid>
                    <DetailRow label="Grid Regions" value={data.state} />
                    <DetailRow label="Facility Name" value={data.facilityName} />
                    <DetailRow label="Site ID" value={data.siteCount} />
                    <DetailRow label="Reporting Year" value={data.reportingYear} />
                    <DetailRow label="Period" value={data.reportingPeriod} />
                  </DetailGrid>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Energy Data */}
          <div className="py-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row gap-10">
              <div className="w-full md:w-1/3 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-500">
                  <EnergyIcon />
                </div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pt-1.5">Energy Data</h3>
              </div>
              <div className="w-full md:w-2/3">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <DetailGrid>
                    <DetailRow label="Energy Activity" value={data.energyActivityInput} />
                    <DetailRow label="Value Type" value="Gross" />
                    <DetailRow label="Electricity Purchased" value={`${data.electricityPurchased} kWh`} />
                    <DetailRow label="Energy Consumption" value={`${data.energyConsumption} GJ`} />
                    <DetailRow label="Data Source" value={data.energySourceDescription} />
                  </DetailGrid>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Renewable Data */}
          <div className="py-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row gap-10">
              <div className="w-full md:w-1/3 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-50 text-green-500">
                  <RenewableIcon />
                </div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pt-1.5">Renewable Data</h3>
              </div>
              <div className="w-full md:w-2/3">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <DetailGrid>
                    <DetailRow label="Renewable Electricity" value={data.renewableElectricity} />
                    <DetailRow label="Energy Consumption" value={data.renewableEnergyConsumption} />
                    {data.hasRenewableElectricity === 'Yes' && (
                      <DetailRow label="Source Description" value={data.renewableEnergySourceDescription} />
                    )}
                  </DetailGrid>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Uploaded Evidence */}
          <div className="py-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row gap-10">
              <div className="w-full md:w-1/3 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <EvidenceIcon />
                </div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pt-1.5">Uploaded Evidence</h3>
              </div>
              <div className="w-full md:w-2/3">
                <div className="bg-gray-50 rounded-xl p-8 border border-dashed border-gray-300 flex items-center justify-center">
                  {data.energySupportingEvidenceFile !== "No supporting evidence uploaded" ? (
                    <div className="text-center">
                      <div className="bg-white p-3 rounded-lg shadow-sm inline-block mb-3">
                        <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{data.energySupportingEvidenceFile}</p>
                      <p className="text-xs text-gray-500 mt-1">Energy Evidence</p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <p className="text-sm italic">No supporting evidence uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={submitAssessment}
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 ${isSubmitting ? "opacity-70 cursor-wait" : ""}`}
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <CheckIcon />
            )}
            {isSubmitting ? "Submitting..." : "Submit Assessment"}
          </button>
        </div>

      </div>

      {/* NOTIFICATION */}
      {notification && (
        <div
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 p-6 rounded-2xl border-2 shadow-2xl min-w-[320px] backdrop-blur-md animate-[slideIn_0.3s_ease-out]
                        ${notification.type === 'success'
              ? 'bg-[#1a1a1a] border-green-500 shadow-green-500/20'
              : 'bg-[#2a1a1a] border-[#FF6B35] shadow-[#FF6B35]/20'
            }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                             ${notification.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-[#FF6B35]/20 text-[#FF6B35]'}`}>
              {notification.type === "success" ? <CheckIcon /> : <CrossIcon />}
            </div>
            <p className="text-white font-medium text-base leading-relaxed">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto p-1 text-gray-400 hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
      {notification && (
        <div
          onClick={() => setNotification(null)}
          className="fixed inset-0 bg-black/60 z-[49] animate-[fadeIn_0.3s_ease-out]"
        />
      )}
    </MainLayout>
  );
}

export default function ScopeReviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScopeReviewContent />
    </Suspense>
  );
}
