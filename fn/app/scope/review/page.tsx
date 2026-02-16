"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

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
  colSpan = 1,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accentColor: string;
  colSpan?: number;
}) => (
  <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow duration-300 md:col-span-${colSpan}`}>
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

const DetailRow = ({ label, value, subLabel, fullWidth = false }: { label: string; value: string | React.ReactNode; subLabel?: string; fullWidth?: boolean }) => (
  <div className={`mb-4 last:mb-0 ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</p>
    <div className={`font-semibold text-gray-900 text-sm ${value === "Not specified" || value === "-" ? "text-gray-400 italic" : ""}`}>
      {value}
    </div>
    {subLabel && <p className="text-xs text-gray-500 mt-1">{subLabel}</p>}
  </div>
);

const DetailGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
    {children}
  </div>
);

// Helper for Monthly Table
const MonthlyTable = ({ data, type }: { data: any[]; type: "Grid" | "Renewable" }) => {
  if (!data || data.length === 0) return <p className="text-xs text-gray-400 italic">No monthly data entered.</p>;

  return (
    <div className="overflow-x-auto mt-2 border rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 table-auto text-xs">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Month</th>
            <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Electricity (kWh)</th>
            <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Consumption (GJ)</th>
            {type === "Grid" && <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Spend / Source</th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                {row.month ? new Date(row.month + "-01").toLocaleDateString('default', { month: 'short', year: '2-digit' }) : "-"}
              </td>
              <td className="px-3 py-2 text-gray-700">{row.electricityPurchased || "-"}</td>
              <td className="px-3 py-2 text-gray-700">{row.energyConsumption || "-"}</td>
              {type === "Grid" && (
                <td className="px-3 py-2 text-gray-700">
                  {row.dataSourceType || row.spend || "-"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


function ScopeReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Try to load from LocalStorage first (richer data)
    const stored = localStorage.getItem("scope2ReviewData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFormData(parsed);
      } catch (e) {
        console.error("Failed to parse stored data", e);
      }
    } else {
      // Fallback to URL params if localStorage is empty (legacy support)
      const paramsObj: any = {};
      searchParams.forEach((value, key) => {
        paramsObj[key] = value;
      });
      setFormData(paramsObj);
    }
  }, [searchParams]);

  const submitAssessment = async () => {
    setIsSubmitting(true);
    // Simulate final submission
    try {
      // If we want to clean up or do anything else
      // Maybe make another API call if needed, but the user said "Review & Submit"
      // And the previous page already did a "Submit".
      // Use a timeout to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      setIsSubmitted(true);
      localStorage.removeItem("scope2ReviewData"); // Clean up
    } catch (e) {
      setNotification({ message: "Something went wrong.", type: "error" });
      setIsSubmitting(false);
    }
  };

  const getFinancialYear = (dateStr: string | null) => {
    if (!dateStr) return "2024-25"; // Default fallback
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // If it's already a string like "2023-24"

    // Logic from scope page
    const year = date.getFullYear();
    if (formData?.reportingPeriod === "Monthly") return date.toLocaleDateString("default", { month: "short", year: "numeric" });
    return `${year}-${String(year + 1).slice(-2)}`;
  };

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-[#f8f9fa] p-4 font-sans text-gray-900 flex flex-col items-center justify-center">
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
              You will get the certificate directly to your email once admin approves your assignment.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!formData) return <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">Loading assessment data...</div>;

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 font-sans text-gray-900 flex flex-col items-center">
      <div className="w-full max-w-6xl flex flex-col h-full">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-1 gap-2 flex-shrink-0">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase">Scope 2 Assessment</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Review & Submit</h1>
            <p className="text-gray-500 text-xs mt-0.5">Please review all details before final submission.</p>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-indigo-900 tracking-widest uppercase">4 of 6 - Review & Submit</span>
              <span className="text-sm font-bold text-gray-400">100%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full" style={{ width: "100%" }}></div>
            </div>
          </div>

          <div className="flex items-center gap-4 opacity-90">
            <img src="/sustally-logo.png" alt="Sustally" className="h-8 md:h-10 w-auto object-contain" />
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 pb-6">

          {/* Left Column */}
          <div className="flex flex-col gap-4">

            {/* Identity & Business */}
            {(formData.userCompany || formData.userName) && (
              <ReviewCard title="Company Details" icon={<BoundaryIcon />} accentColor="#4b5563">
                <DetailGrid>
                  <DetailRow label="Name" value={formData.userName} />
                  <DetailRow label="Company" value={formData.userCompany} />
                  <DetailRow label="Email" value={formData.userEmail} />
                  <DetailRow label="Mobile" value={formData.userMobile || "-"} />
                </DetailGrid>
              </ReviewCard>
            )}

            {/* Boundary & Site Details */}
            <ReviewCard title="Boundary & Site Details" icon={<BoundaryIcon />} accentColor="#6366f1">
              <DetailGrid>
                <DetailRow label="State / Grid Region" value={formData.state || "Not specified"} />
                <DetailRow label="Facility Name" value={formData.facilityName || "Not specified"} />
                <DetailRow label="Site Count" value={formData.siteCount || "1"}
                  subLabel={formData.siteCount === "Multiple sites" ? `(${formData.siteCountNumber} sites)` : undefined} />
                <DetailRow label="Reporting Year" value={getFinancialYear(formData.reportingYear)} />
                <DetailRow label="Period" value={formData.reportingPeriod} />
                <DetailRow label="Consolidation Approach" value={formData.conditionalApproach} />
                {formData.utilityProvider && <DetailRow label="Utility Provider" value={formData.utilityProvider} />}
                <DetailRow label="Scope Boundary Notes" value={formData.scopeBoundaryNotes || "-"} fullWidth />
              </DetailGrid>
            </ReviewCard>

            {/* Electricity Characteristics */}
            <ReviewCard title="Electricity Characteristics" icon={<EnergyIcon />} accentColor="#f59e0b">
              <DetailGrid>
                <DetailRow label="Renewable Procurement" value={formData.renewableProcurement} />
                <DetailRow label="Net Metering" value={formData.netMeteringApplicable} />
                {formData.onsiteExportedKwh && <DetailRow label="On-site Generated Exported" value={`${formData.onsiteExportedKwh} kWh`} />}
              </DetailGrid>
            </ReviewCard>

          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4">

            {/* Energy Data */}
            <ReviewCard title="Grid Energy Consumption" icon={<EnergyIcon />} accentColor="#f59e0b" colSpan={2}>
              <DetailGrid>
                <DetailRow label="Input Type" value={formData.energyActivityInput} />
                <DetailRow label="Category" value={formData.energyCategory} />
                <DetailRow label="Tracking Type" value={formData.trackingType} />

                {formData.energyActivityInput === "Yearly" ? (
                  <>
                    <DetailRow label="Electricity Purchased" value={`${formData.electricityPurchased} kWh`} />
                    <DetailRow label="Energy Consumption" value={`${formData.energyConsumption} GJ`} />
                    <DetailRow label="Data Source" value={formData.dataSourceType} />
                    {formData.trackingType && formData.trackingType.includes("Spend") && <DetailRow label="Spend Amount" value={formData.spendAmount} />}
                  </>
                ) : (
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Monthly Breakdown (Grid)</p>
                    <MonthlyTable data={formData.monthlyData} type="Grid" />
                  </div>
                )}
                <DetailRow label="Evidence File" value={formData.energySupportingEvidenceFile || "No file uploaded"}
                  subLabel={formData.energySourceDescription} fullWidth />

              </DetailGrid>
            </ReviewCard>

            {/* Renewable Data */}
            <ReviewCard title="Renewable Energy" icon={<RenewableIcon />} accentColor="#10b981" colSpan={2}>
              <DetailGrid>
                <DetailRow label="Has Renewable Electricity?" value={formData.hasRenewableElectricity} />

                {formData.hasRenewableElectricity === "Yes" && (
                  <>
                    <DetailRow label="Input Type" value={formData.renewableEnergyActivityInput || "Yearly"} />

                    {formData.renewableEnergyActivityInput === "Monthly" ? (
                      <div className="col-span-1 md:col-span-2">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Monthly Breakdown (Renewable)</p>
                        <MonthlyTable data={formData.renewableMonthlyData} type="Renewable" />
                      </div>
                    ) : (
                      <>
                        <DetailRow label="Renewable Electricity" value={`${formData.renewableElectricity} kWh`} />
                        <DetailRow label="Energy Consumption" value={`${formData.renewableEnergyConsumption} GJ`} />
                      </>
                    )}
                    <DetailRow label="Evidence File" value={formData.renewableSupportingEvidenceFile || "No file uploaded"}
                      subLabel={formData.renewableEnergySourceDescription} fullWidth />

                    {/* Emissions Impact */}
                    <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-dashed border-gray-200">
                      <h4 className="text-xs font-bold text-gray-700 mb-2">Estimated Impact</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Location Based</p>
                          <p className="text-sm font-bold text-gray-900">{formData.locationBasedEmissions ? Number(formData.locationBasedEmissions).toFixed(4) : "-"} tonnes CO2e</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Market Based</p>
                          <p className="text-sm font-bold text-gray-900">{formData.marketBasedEmissions ? Number(formData.marketBasedEmissions).toFixed(4) : "-"} tonnes CO2e</p>
                        </div>
                      </div>
                    </div>

                  </>
                )}
              </DetailGrid>
            </ReviewCard>

          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex justify-center gap-4 mt-6 flex-shrink-0 mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-full bg-white text-gray-700 text-xs font-bold border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Back to Edit
          </button>
          <button
            type="button"
            onClick={submitAssessment}
            disabled={isSubmitting}
            className={`px-6 py-2.5 rounded-full bg-[#4F46E5] text-white text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-[#4F46E5] transition-colors shadow-indigo-200 ${isSubmitting ? "opacity-70 cursor-wait" : ""}`}
          >
            {isSubmitting ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <CheckIcon />
            )}
            {isSubmitting ? "Submitting..." : "Confirm & Submit"}
          </button>
        </div>

      </div>

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
    </main>
  );
}

export default function ScopeReviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScopeReviewContent />
    </Suspense>
  );
}
