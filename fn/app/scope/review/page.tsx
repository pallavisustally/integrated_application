"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SUSTALLY_API_URL } from "../../../lib/assessment-api";
import { loadAssessmentSession } from "../../../lib/assessment-session";
import {
  scope2CalculationBreakdownFields,
  scope2CalculationSummaryFields,
} from "@/lib/scope2-review-build";
import { Scope2WizardShell } from "@/components/scope2-shell";
import { useWizardTheme } from "@/lib/use-wizard-theme";
import { Scope1ReviewSubmittedContent } from "@/components/review/scope1-review-page";
import {
  BoundaryIcon,
  CalcIcon,
  CheckIcon,
  DetailGrid,
  DetailRow,
  EnergyIcon,
  ReviewCard,
} from "@/components/review/review-primitives";

const RenewableIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.5a9.5 9.5 0 0 0-9.5 9.5c0 5.25 4.25 9.5 9.5 9.5s9.5-4.25 9.5-9.5A9.5 9.5 0 0 0 12 2.5z" />
    <path d="M12 7.5v9" />
    <path d="M7.5 12h9" />
  </svg>
);

const CrossIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

// Helper for Monthly Table
const MonthlyTable = ({ data, type, isEstimated = false }: { data: any[]; type: "Grid" | "Renewable"; isEstimated?: boolean }) => {
  if (!data || data.length === 0) return <p className="review-detail-value is-muted">No monthly data entered.</p>;

  return (
    <div className="overflow-x-auto mt-2">
      <table className="scope2-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>
              Electricity (kWh) {isEstimated ? <span className="scope2-badge">Estimated</span> : null}
            </th>
            <th>Consumption (GJ)</th>
            {type === "Grid" && data.some((r) => r.spend && parseFloat(r.spend) > 0) && <th>Spend (INR)</th>}
            <th>Data Source Type</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              <td>
                {row.month
                  ? row.month.includes('-') && row.month.split('-').length === 2
                    ? new Date(row.month + '-01').toLocaleDateString('default', { month: 'short', year: '2-digit' })
                    : row.month
                  : '-'}
              </td>
              <td>{row.electricityPurchased ? parseFloat(row.electricityPurchased).toFixed(2) : '-'}</td>
              <td>{row.energyConsumption ? parseFloat(row.energyConsumption).toFixed(2) : '-'}</td>
              {type === 'Grid' && data.some((r) => r.spend && parseFloat(r.spend) > 0) && (
                <td>{row.spend ? parseFloat(row.spend).toFixed(2) : '-'}</td>
              )}
              <td>{row.dataSourceType || '-'}</td>
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
  const { theme, toggleTheme } = useWizardTheme();

  useEffect(() => {
    // Check if user has already submitted based on email or assessmentId
    const emailFromUrl = searchParams.get("email");
    const assessmentId = searchParams.get("assessmentId");
    const isRetry = searchParams.get("retry") === "true";

    // Clear flags if retry
    if (emailFromUrl && isRetry) {
      localStorage.removeItem(`scope2_completed_${emailFromUrl}`);
      if (assessmentId) localStorage.removeItem(`scope2_completed_${assessmentId}`);
    }

    // Check completion specifically for this assessment ID if available
    let isAlreadyDone = false;
    if (assessmentId) {
      isAlreadyDone = localStorage.getItem(`scope2_completed_${assessmentId}`) === "true";
    } else if (emailFromUrl) {
      isAlreadyDone = localStorage.getItem(`scope2_completed_${emailFromUrl}`) === "true";
    }

    if (isAlreadyDone && !isRetry) {
      setIsSubmitted(true);
      return;
    }

    // Try to load from LocalStorage first (richer data)
    const stored = localStorage.getItem("scope2ReviewData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // Also check if this stored data was already completed
        const storedIsDone = (parsed.assessmentId && localStorage.getItem(`scope2_completed_${parsed.assessmentId}`)) ||
          (!assessmentId && parsed.userEmail && localStorage.getItem(`scope2_completed_${parsed.userEmail}`));

        if (storedIsDone && !isRetry) {
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

      const session = loadAssessmentSession();
      const resolvedAssessmentId =
        formData.assessmentId ||
        searchParams.get("assessmentId") ||
        session?.assessmentId ||
        "";

      const formDataToSend = new FormData();
      if (resolvedAssessmentId) {
        formDataToSend.append("assessmentId", resolvedAssessmentId);
      }
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "assessmentId") return;
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

      const saveResponse = await fetch(`${SUSTALLY_API_URL}/api/save-scope2`, {
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
        if (formData.assessmentId) {
          localStorage.setItem(`scope2_completed_${formData.assessmentId}`, "true");
        }
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

    const year = date.getFullYear();
    return `FY${year}-${String(year + 1).slice(-2)}`;
  };

  const calcSummaryFields = useMemo(
    () =>
      formData
        ? scope2CalculationSummaryFields(formData as Record<string, unknown>)
        : [],
    [formData],
  );
  const calcBreakdownFields = useMemo(
    () =>
      formData
        ? scope2CalculationBreakdownFields(formData as Record<string, unknown>)
        : [],
    [formData],
  );

  if (isSubmitted) {
    return (
      <Scope2WizardShell
        step={3}
        theme={theme}
        onThemeToggle={toggleTheme}
        canReachStep={() => true}
      >
        <Scope1ReviewSubmittedContent sectorLabel="Scope 2 · Grid electricity" />
      </Scope2WizardShell>
    );
  }

  if (!formData) {
    return (
      <Scope2WizardShell step={3} theme={theme} onThemeToggle={toggleTheme} canReachStep={() => true}>
        <section className="step-page active review-step-page">
          <p className="step-sub">Loading assessment data…</p>
        </section>
      </Scope2WizardShell>
    );
  }

  return (
    <Scope2WizardShell
      step={3}
      theme={theme}
      onThemeToggle={toggleTheme}
      canReachStep={() => true}
      onStepGo={(target) => {
        if (target < 3) router.push('/scope');
      }}
    >
      <section className="step-page active review-step-page">
        <h1 className="step-title">
          Review &amp; <em>submit</em>
        </h1>
        <p className="step-sub">Review entered details and calculated emissions before submitting for admin approval.</p>

        <div className="review-grid">

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
            <ReviewCard title="Boundary & Site Details" icon={<BoundaryIcon />} accentColor="#7b3ff2">
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

              <DetailRow 
                label="Electricity Purchased" 
                value={
                  <div className="flex items-center gap-2">
                    <span>{parseFloat(formData.electricityPurchased || "0").toFixed(2)} kWh</span>
                    {formData.trackingType === "Spend amount" && (
                      <span className="bg-yellow-100 text-yellow-800 text-[10px] font-medium px-1.5 py-0.5 rounded border border-yellow-200 uppercase">
                        Estimated
                      </span>
                    )}
                  </div>
                } 
              />
              <DetailRow label="Data Source Type" value={formData.dataSourceType || "-"} />
              <DetailRow label="Energy Consumption" value={`${parseFloat(formData.energyConsumption || "0").toFixed(2)} GJ`} />

              {formData.trackingType && formData.trackingType.includes("Spend") && <DetailRow label="Spend Amount" value={formData.spendAmount ? `${formData.spendAmount} INR` : "-"} />}

              {formData.energyActivityInput === "Monthly" && (
                <div className="col-span-1 md:col-span-2 mt-2">
                  <p className="text-[10px] text-gray-500 font-bold tracking-wider mb-2 border-t pt-4">Monthly Breakdown (Grid)</p>
                  <MonthlyTable data={formData.monthlyData} type="Grid" isEstimated={formData.trackingType === "Spend amount"} />
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
                  <DetailRow label="Renewable Electricity" value={`${parseFloat(formData.renewableElectricity || "0").toFixed(2)} kWh`} />
                  <DetailRow label="Data Source" value={formData.renewableDataSourceType || "-"} />
                  <DetailRow label="Energy Consumption" value={`${parseFloat(formData.renewableEnergyConsumption || "0").toFixed(2)} GJ`} />


                  {(formData.renewableEnergyActivityInput === "Monthly") && (
                    <div className="col-span-1 md:col-span-2 mt-2">
                      <p className="text-[10px] text-gray-500 font-bold tracking-wider mb-2 border-t pt-4">Monthly Breakdown (Renewable)</p>
                      <MonthlyTable data={formData.renewableMonthlyData} type="Renewable" />
                    </div>
                  )}

                  <DetailRow label="Evidence File" value={formData.renewableSupportingEvidenceFile || "No file uploaded"} fullWidth />
                  <DetailRow label="Energy Source Description" value={formData.renewableEnergySourceDescription || "-"} fullWidth />
                </>
              )}
            </DetailGrid>
          </ReviewCard>

          <ReviewCard title="Emissions & methodology" icon={<CalcIcon />} accentColor="#10b981">
            <DetailGrid>
              {calcSummaryFields.map((f) => (
                <DetailRow
                  key={f.label}
                  label={f.label}
                  value={f.value}
                  subLabel={f.subLabel}
                  fullWidth={f.fullWidth}
                />
              ))}
            </DetailGrid>
          </ReviewCard>

          <ReviewCard title="Energy & intensity calculations" icon={<CalcIcon />} accentColor="#64748b">
            <DetailGrid>
              {calcBreakdownFields.map((f) => (
                <DetailRow
                  key={f.label}
                  label={f.label}
                  value={f.value}
                  subLabel={f.subLabel}
                  fullWidth={f.fullWidth}
                />
              ))}
            </DetailGrid>
          </ReviewCard>

        </div>

        <div className="step-footer">
          <button type="button" className="btn ghost" onClick={() => router.back()}>
            Back to edit
          </button>
          <button type="button" className="btn primary" onClick={submitAssessment} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit for review'}
            {!isSubmitting ? <CheckIcon /> : null}
          </button>
        </div>
      </section>

      {notification ? (
        <>
          <div className="scope2-notification-backdrop" onClick={() => setNotification(null)} aria-hidden />
          <div className={`scope2-notification ${notification.type === 'success' ? 'success' : 'error'}`}>
            <div className="flex items-center gap-4">
              {notification.type === 'success' ? <CheckIcon /> : <CrossIcon />}
              <p>{notification.message}</p>
              <button type="button" className="btn ghost" onClick={() => setNotification(null)}>
                Close
              </button>
            </div>
          </div>
        </>
      ) : null}
    </Scope2WizardShell>
  );
}

export default function ScopeReviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScopeReviewContent />
    </Suspense>
  );
}
