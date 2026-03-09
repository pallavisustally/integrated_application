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
  <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col relative group hover:shadow-md transition-shadow duration-300 md:col-span-${colSpan} h-[420px]`}>
    <div
      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
      style={{ backgroundColor: accentColor }}
    ></div>
    <div className="flex items-center gap-3 mb-6 flex-shrink-0">
      <div className={`p-2 rounded-lg bg-opacity-10`} style={{ backgroundColor: `${accentColor}20` }}>
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 text-sm tracking-wide">{title}</h3>
    </div>
    <div className="flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
      {children}
    </div>
  </div>
);

const DetailRow = ({ label, value, subLabel, fullWidth = false }: { label: string; value: string | React.ReactNode; subLabel?: string; fullWidth?: boolean }) => (
  <div className={`mb-4 last:mb-0 ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
    <p className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">{label}</p>
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
            <th className="px-3 py-2 text-left font-bold text-gray-500 tracking-wider">Month</th>
            <th className="px-3 py-2 text-left font-bold text-gray-500 tracking-wider">Electricity (kWh)</th>
            <th className="px-3 py-2 text-left font-bold text-gray-500 tracking-wider">Consumption (GJ)</th>
            <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">
              {type === "Grid" ? "Spend / Source" : "Source"}
            </th>
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
              <td className="px-3 py-2 text-gray-700">
                {type === "Grid" ? (row.dataSourceType || row.spend || "-") : (row.dataSourceType || "-")}
              </td>
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
    // Check if user has already submitted based on email in URL params
    const emailFromUrl = searchParams.get("email");
    if (emailFromUrl && localStorage.getItem(`scope2_completed_${emailFromUrl}`)) {
      setIsSubmitted(true);
      return;
    }

    // Try to load from LocalStorage first (richer data)
    const stored = localStorage.getItem("scope2ReviewData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // Also check if this stored email was already completed
        if (parsed.userEmail && localStorage.getItem(`scope2_completed_${parsed.userEmail}`)) {
          setIsSubmitted(true);
          return;
        }

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
      if (!formData) throw new Error("No data found to submit.");

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "monthlyData" || key === "renewableMonthlyData") {
          formDataToSend.append(key, typeof value === "string" ? value : JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          if (key === "energySupportingEvidenceFile") {
            formDataToSend.append("energySupportingEvidenceFileName", String(value));
          } else if (key === "renewableSupportingEvidenceFile") {
            formDataToSend.append("renewableSupportingEvidenceFileName", String(value));
          } else {
            formDataToSend.append(key, String(value));
          }
        }
      });

      const apiUrl = process.env.NEXT_PUBLIC_SUSTALLY_API_URL || "https://render-beryl.vercel.app";
      const saveResponse = await fetch(`${apiUrl}/api/save-scope2`, {
        method: "POST",
        body: formDataToSend,
      });

      const saveResult = await saveResponse.json();

      if (!saveResponse.ok || !saveResult.success) {
        throw new Error(saveResult.error || "Failed to save application");
      }

      setIsSubmitted(true);
      if (formData.userEmail) {
        localStorage.setItem(`scope2_completed_${formData.userEmail}`, "true");
      }
      localStorage.removeItem("scope2ReviewData"); // Clean up
      sessionStorage.removeItem("scopeFormData");
      sessionStorage.removeItem("scopeFormPage");
    } catch (e: any) {
      setNotification({ message: e.message || "Something went wrong.", type: "error" });
    } finally {
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
      <main className="min-h-screen bg-[#f8f9fa] px-4 py-8 sm:px-6 sm:py-10 font-sans text-gray-900 flex flex-col items-center justify-center">
        <div className="w-full max-w-[95%] md:max-w-4xl lg:max-w-5xl bg-white rounded-3xl shadow-md px-6 py-12 sm:px-10 sm:py-16 md:py-20 lg:py-24 mx-auto flex flex-col items-center justify-center">
          {/* Header (logo then tick on mobile) */}
          <div className="flex flex-col items-center text-center w-full">
            <div className="flex items-center justify-center gap-2 sm:gap-3 opacity-90 flex-wrap w-full">
              <img src="/sustally-logo.png" alt="Sustally" className="h-10 sm:h-12 w-auto object-contain" />
              <div className="flex h-8 sm:h-10">
                <div className="w-px bg-gray-200 h-full" />
              </div>
              <span className="font-medium text-gray-500 sm:text-gray-600 text-xs sm:text-sm max-w-[180px] sm:max-w-[240px] leading-tight text-left">
                Choose Sustally As Your Sustainability Ally
              </span>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center text-center">
            {/* Big Green Checkmark */}
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6 shadow-sm">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
              Thank You! Your Assessment Has Been Successfully Completed.
            </h1>

            <p className="text-gray-500 text-sm sm:text-lg max-w-xl">
              You Will Get The Certificate Directly To Your Email Once Admin Approves Your Assignment.
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
              <span className="text-[10px] font-bold text-indigo-500 tracking-widest">Scope 2 Assessment</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Review & Submit</h1>
            <p className="text-gray-500 text-xs mt-0.5">Please review all details before final submission.</p>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-indigo-900 tracking-widest">4 Of 6 - Review & Submit</span>
              <span className="text-sm font-bold text-gray-400">68%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full" style={{ width: "68%" }}></div>
            </div>
          </div>

          <div className="flex items-center gap-3 opacity-90">
            <img src="/sustally-logo.png" alt="Sustally" className="h-10 w-auto object-contain" />
            <div className="flex gap-1 h-12">
              <div className="w-[1px] bg-gray-300 h-full"></div>
            </div>
            <span className="font-medium text-gray-400 text-sm max-w-[200px] leading-tight text-left">
              Choose Sustally As Your Sustainability Ally
            </span>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0 pb-6">

          {/* Identity & Business */}
          {(formData.userCompany || formData.userName) && (
            <ReviewCard title="Company Details" icon={<BoundaryIcon />} accentColor="#4b5563">
              <DetailGrid>
                <DetailRow label="Name" value={formData.userName} />
                <DetailRow label="Company" value={formData.userCompany} />
                <DetailRow label="Email" value={formData.userEmail} />
                <DetailRow label="Mobile" value={formData.userMobile || "-"} />
                <DetailRow label="Sector" value={formData.sector || "NA"} />
                <DetailRow label="Nature Of Business" value={formData.natureOfBusiness || "NA"} />
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

          {/* Grid Energy Consumption */}
          <ReviewCard title="Grid Energy Consumption" icon={<EnergyIcon />} accentColor="#f59e0b">
            <DetailGrid>
              <DetailRow label="Input Type" value={formData.energyActivityInput} />
              <DetailRow label="Category" value={formData.energyCategory} />
              <DetailRow label="Tracking Type" value={formData.trackingType} />

              {formData.energyActivityInput === "Yearly" ? (
                <>
                  <DetailRow label="Electricity Purchased" value={`${formData.electricityPurchased} kWh`} />
                  <DetailRow label="Energy Consumption" value={`${formData.energyConsumption} GJ`} />
                  <DetailRow label="Data Source Type" value={formData.dataSourceType} />
                  {formData.trackingType && formData.trackingType.includes("Spend") && <DetailRow label="Spend Amount" value={formData.spendAmount ? `${formData.spendAmount} INR` : "-"} />}
                </>
              ) : (
                <div className="col-span-1 md:col-span-2">
                  <p className="text-[10px] text-gray-500 font-bold tracking-wider mb-2">Monthly Breakdown (Grid)</p>
                  <MonthlyTable data={formData.monthlyData} type="Grid" />
                </div>
              )}
              <DetailRow label="Evidence File" value={formData.energySupportingEvidenceFile || "No file uploaded"} fullWidth />
              <DetailRow label="Energy Source Description" value={formData.energySourceDescription || "-"} fullWidth />

            </DetailGrid>
          </ReviewCard>

          {/* Operational Details */}
          <ReviewCard title="Operational Details" icon={<EnergyIcon />} accentColor="#64748b">
            <DetailGrid>
              <DetailRow label="Turnover Of Your Site" value={formData.energyIntensityPerRupee ? `${formData.energyIntensityPerRupee} INR` : "Not specified"} />
            </DetailGrid>
          </ReviewCard>

          {/* Renewable Energy */}
          <ReviewCard title="Renewable Energy" icon={<RenewableIcon />} accentColor="#10b981">
            <DetailGrid>
              <DetailRow label="Net Metering" value={formData.netMeteringApplicable} />
              <DetailRow label="Has Renewable Electricity?" value={formData.hasRenewableElectricity} />

              {formData.hasRenewableElectricity === "Yes" && (
                <>
                  <DetailRow label="Input Type" value={formData.renewableEnergyActivityInput || "Yearly"} />

                  {formData.renewableEnergyActivityInput === "Monthly" ? (
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-[10px] text-gray-500 font-bold tracking-wider mb-2">Monthly Breakdown (Renewable)</p>
                      <MonthlyTable data={formData.renewableMonthlyData} type="Renewable" />
                    </div>
                  ) : (
                    <>
                      <DetailRow label="Renewable Electricity" value={`${formData.renewableElectricity} kWh`} />
                      <DetailRow label="Data Source" value={formData.renewableDataSourceType || "-"} />
                      <DetailRow label="Energy Consumption" value={`${formData.renewableEnergyConsumption} GJ`} />
                    </>
                  )}
                  <DetailRow label="Evidence File" value={formData.renewableSupportingEvidenceFile || "No file uploaded"} fullWidth />
                  <DetailRow label="Energy Source Description" value={formData.renewableEnergySourceDescription || "-"} fullWidth />
                </>
              )}
            </DetailGrid>
          </ReviewCard>

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
