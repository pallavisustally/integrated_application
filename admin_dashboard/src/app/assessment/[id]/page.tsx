'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { useAppDialog } from '@/components/app-dialog-provider';
import Scope1AssessmentReview from '@/components/Scope1AssessmentReview';
import { resolveApplicationForReview } from '@/lib/resolve-application';
import { SUSTALLY_API_URL } from '@/lib/api-url';

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
const MonthlyTable = ({ data, type, isEstimated = false }: { data: any; type: "Grid" | "Renewable"; isEstimated?: boolean }) => {
  const parsedData = useMemo(() => {
    if (!data) return [];
    let items = data;
    if (typeof data === 'string') {
      try {
        items = JSON.parse(data);
        if (typeof items === 'string') items = JSON.parse(items);
      } catch (e) {
        return [];
      }
    }
    return Array.isArray(items) ? items : [];
  }, [data]);

  if (!parsedData || parsedData.length === 0) return <p className="text-xs text-gray-400 italic">No monthly data entered.</p>;

  return (
    <div className="overflow-x-auto mt-2 border rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 table-auto text-xs">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-bold text-gray-500 tracking-wider">Month</th>
            <th className="px-3 py-2 text-left font-bold text-gray-500 tracking-wider">
              Electricity (kWh) {isEstimated && <span className="ml-1 bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded border border-yellow-200 uppercase">Estimated</span>}
            </th>
            <th className="px-3 py-2 text-left font-bold text-gray-500 tracking-wider">Consumption (GJ)</th>
            {type === "Grid" && parsedData.some((r: any) => r.spend && parseFloat(r.spend) > 0) && (
              <th className="px-3 py-2 text-left font-bold text-gray-500 tracking-wider">Spend (INR)</th>
            )}
            <th className="px-3 py-2 text-left font-bold text-gray-500 tracking-wider">Data Source Type</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {parsedData.map((row: any, idx: number) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                {row.month ? (row.month.includes('-') && row.month.split('-').length === 2 ? new Date(row.month + "-01").toLocaleDateString('default', { month: 'short', year: '2-digit' }) : row.month) : "-"}
              </td>
              <td className="px-3 py-2 text-gray-700">{row.electricityPurchased || 0}</td>
              <td className="px-3 py-2 text-gray-700">{row.energyConsumption || 0}</td>
              {type === "Grid" && parsedData.some((r: any) => r.spend && parseFloat(r.spend) > 0) && (
                <td className="px-3 py-2 text-gray-700">{row.spend || "-"}</td>
              )}
              <td className="px-3 py-2 text-gray-700">
                {row.dataSourceType || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


export default function AssessmentViewPage() {
  const router = useRouter();
  const dialog = useAppDialog();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const scopeParam = searchParams?.get('scope');
  const scopeHint =
    scopeParam === '1' ? 'SCOPE_1' : scopeParam === '2' ? 'SCOPE_2' : null;

  const [resolvedScope, setResolvedScope] = useState<'SCOPE_1' | 'SCOPE_2' | null>(null);
  const [applicationId, setApplicationId] = useState<string>('');
  const [scope2Data, setScope2Data] = useState<any>(null);
  const [slotBooking, setSlotBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = SUSTALLY_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      setResolvedScope(null);
      try {
        const resolved = await resolveApplicationForReview(id, scopeHint);
        if (!resolved) {
          setError(
            'Assessment not found. Open this link from the admin dashboard (port 3002) or use the application id from scope1-applications.',
          );
          setLoading(false);
          return;
        }

        setResolvedScope(resolved.scope);
        setApplicationId(resolved.applicationId);
        setScope2Data(resolved.doc);

        if (resolved.scope === 'SCOPE_2') {
          const email = resolved.doc.email as string | undefined;
          if (email) {
            const slotsRes = await fetch(
              `${API_URL}/api/slot-bookings?where[email][equals]=${encodeURIComponent(email)}&limit=10`,
            );
            const slotsJson = await slotsRes.json();
            if (slotsJson?.docs?.length > 0) {
              setSlotBooking(slotsJson.docs[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch assessment:', err);
        setError('Failed to load assessment data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, scopeHint]);

  const data = scope2Data;
  const status = data?.status || 'PENDING';

  const handleApprove = async () => {
    const ok = await dialog.confirm('Approve this submission?', 'Approve submission');
    if (!ok) return;
    try {
      const collection =
        resolvedScope === 'SCOPE_1' ? 'scope1-applications' : 'scope2-applications';
      const res = await fetch(`${API_URL}/api/${collection}/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (res.ok) {
        setScope2Data((prev: any) => ({ ...prev, status: 'APPROVED' }));
        await dialog.notify('Submission approved successfully.', 'success');
      } else {
        await dialog.notify('Error approving submission.', 'error');
      }
    } catch (e) {
      console.error(e);
      await dialog.notify('Error approving submission.', 'error');
    }
  };

  const handleReject = async () => {
    const reason = await dialog.prompt(
      'Please enter the reason for rejection.',
      'Reject submission',
      'Reason for rejection…',
    );
    if (reason === null) return;
    try {
      const collection =
        resolvedScope === 'SCOPE_1' ? 'scope1-applications' : 'scope2-applications';
      const res = await fetch(`${API_URL}/api/${collection}/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason: reason }),
      });
      if (res.ok) {
        setScope2Data((prev: any) => ({ ...prev, status: 'REJECTED', rejectionReason: reason }));
        await dialog.notify('Submission rejected successfully.', 'success');
      } else {
        await dialog.notify('Error rejecting submission.', 'error');
      }
    } catch (e) {
      console.error(e);
      await dialog.notify('Error rejecting submission.', 'error');
    }
  };

  const getFinancialYear = (dateStr: string | null) => {
    if (!dateStr) return "2024-25";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const year = date.getFullYear();
    return `${year}-${String(year + 1).slice(-2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !scope2Data) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
        <p className="text-red-500 font-medium mb-4">{error || 'Assessment not found'}</p>
        <Link href="/" className="text-indigo-600 hover:underline font-medium">Back to Dashboard</Link>
      </div>
    );
  }

  if (resolvedScope === 'SCOPE_1') {
    return (
      <Scope1AssessmentReview
        data={scope2Data}
        applicationId={applicationId}
        onStatusChange={(next) =>
          setScope2Data((prev: Record<string, unknown>) => ({ ...prev, status: next }))
        }
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 font-sans text-gray-900 flex flex-col items-center pb-24">
      <div className="w-full max-w-6xl flex flex-col h-full">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700 p-1 -ml-1 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span className="text-[10px] font-bold text-indigo-500 tracking-widest">
                  Scope 2 Assessment Review
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Assessment Review</h1>
              <p className="text-gray-500 text-xs mt-0.5">
                Reviewing submission for {data.facilityName || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' :
              status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' :
                status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  'bg-orange-100 text-orange-700 border-orange-200'
              }`}>{status.replace('_', ' ')}</span>
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

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 pb-6">

          {/* Company Details (from Application) */}
          <ReviewCard title="Company Details" icon={<BoundaryIcon />} accentColor="#4b5563">
            <DetailGrid>
              <DetailRow label="Name" value={data.userName || data.name || (slotBooking?.name)} />
              <DetailRow label="Company" value={data.userCompany || data.company || (slotBooking?.company)} />
              <DetailRow label="Email" value={data.userEmail || data.email || (slotBooking?.email)} />
              <DetailRow label="Mobile" value={data.userMobile || (slotBooking?.mobile) || "-"} />
              <DetailRow label="Sector" value={data.sector || (slotBooking?.sector) || "NA"} />
              <DetailRow label="Nature Of Business" value={data.natureOfBusiness || (slotBooking?.natureOfBusiness) || "NA"} />
              {slotBooking && (
                <>
                  <DetailRow label="Assignment Date" value={slotBooking.assignmentDate || '-'} />
                  <DetailRow label="Assignment Slot" value={slotBooking.assignmentSlot || '-'} />
                </>
              )}
            </DetailGrid>
          </ReviewCard>

          {/* Boundary & Site Details */}
          <ReviewCard title="Boundary & Site Details" icon={<BoundaryIcon />} accentColor="#6366f1">
            <DetailGrid>
              <DetailRow label="State / Grid Region" value={data.state || "Not specified"} />
              <DetailRow label="Facility Name" value={data.facilityName || "Not specified"} />
              <DetailRow label="Site Count" value={data.siteCount || "1"}
                subLabel={data.siteCount === "Multiple sites" ? `(${data.siteCountNumber} sites)` : undefined} />
              <DetailRow label="Reporting Year" value={getFinancialYear(data.reportingYear)} />
              <DetailRow label="Period" value={data.reportingPeriod} />
              <DetailRow label="Consolidation Approach" value={data.conditionalApproach} />
              {data.utilityProvider && <DetailRow label="Utility Provider" value={data.utilityProvider} />}
              <DetailRow label="Scope Boundary Notes" value={data.scopeBoundaryNotes || "-"} fullWidth />
            </DetailGrid>
          </ReviewCard>

          {/* Grid Energy Consumption */}
          <ReviewCard title="Grid Energy Consumption" icon={<EnergyIcon />} accentColor="#f59e0b">
            <DetailGrid>
              <DetailRow label="Input Type" value={data.energyActivityInput} />
              <DetailRow label="Category" value={data.energyCategory} />
              <DetailRow label="Tracking Type" value={data.trackingType} />

              <DetailRow 
                label="Electricity Purchased" 
                value={
                  <div className="flex items-center gap-2">
                    <span>{data.electricityPurchased || 0} kWh</span>
                    {data.trackingType === "Spend amount" && (
                      <span className="bg-yellow-100 text-yellow-800 text-[10px] font-medium px-1.5 py-0.5 rounded border border-yellow-200 uppercase">
                        Estimated
                      </span>
                    )}
                  </div>
                } 
              />
              <DetailRow label="Data Source Type" value={data.dataSourceType || "-"} />
              <DetailRow label="Energy Consumption" value={`${data.energyConsumption || 0} GJ`} />

              {data.trackingType && data.trackingType.includes("Spend") && <DetailRow label="Spend Amount" value={data.spendAmount ? `${data.spendAmount} INR` : "-"} />}

              {data.energyActivityInput === "Monthly" && (
                <div className="col-span-1 md:col-span-2 mt-2">
                  <p className="text-[10px] text-gray-500 font-bold tracking-wider mb-2 border-t pt-4">Monthly Breakdown (Grid)</p>
                  <MonthlyTable data={data.monthlyData} type="Grid" isEstimated={data.trackingType === "Spend amount"} />
                </div>
              )}
              <DetailRow label="Evidence File" value={data.energySupportingEvidenceFileName || "No file uploaded"} fullWidth />
              <DetailRow label="Energy Source Description" value={data.energySourceDescription || "-"} fullWidth />
            </DetailGrid>
          </ReviewCard>

          {/* Operational Details */}
          <ReviewCard title="Operational Details" icon={<EnergyIcon />} accentColor="#64748b">
            <DetailGrid>
              <DetailRow label="Turnover Of Your Site" value={data.energyIntensityPerRupee ? `${data.energyIntensityPerRupee} INR` : "Not specified"} />
            </DetailGrid>
          </ReviewCard>

          {/* Renewable Energy */}
          <ReviewCard title="Renewable Energy" icon={<RenewableIcon />} accentColor="#10b981">
            <DetailGrid>
              <DetailRow label="Net Metering" value={data.netMeteringApplicable} />
              <DetailRow label="Has Renewable Electricity?" value={data.hasRenewableElectricity} />

              {data.hasRenewableElectricity === 'Yes' && (
                <>
                  <DetailRow label="Input Type" value={data.renewableEnergyActivityInput || 'Yearly'} />
                  <DetailRow label="Renewable Electricity" value={`${data.renewableElectricity || 0} kWh`} />
                  <DetailRow label="Data Source" value={data.renewableDataSourceType || "-"} />
                  <DetailRow label="Energy Consumption" value={`${data.renewableEnergyConsumption || 0} GJ`} />


                  {data.renewableEnergyActivityInput === "Monthly" && (
                    <div className="col-span-1 md:col-span-2 mt-2">
                      <p className="text-[10px] text-gray-500 font-bold tracking-wider mb-2 border-t pt-4">Monthly Breakdown (Renewable)</p>
                      <MonthlyTable data={data.renewableMonthlyData} type="Renewable" />
                    </div>
                  )}

                  <DetailRow label="Evidence File" value={data.renewableSupportingEvidenceFileName || "No file uploaded"} fullWidth />
                  <DetailRow label="Energy Source Description" value={data.renewableEnergySourceDescription || "-"} fullWidth />
                </>
              )}
            </DetailGrid>
          </ReviewCard>

          {/* Evidence Files Preview */}
          <ReviewCard title="Evidence Files" icon={<EvidenceIcon />} accentColor="#8b5cf6">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-gray-500 font-bold mb-2">Grid Energy Evidence</p>
                {data.energySupportingEvidenceFileUrl ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm font-semibold text-indigo-600 truncate max-w-[200px]">{data.energySupportingEvidenceFileName || 'Energy Evidence'}</p>
                    <a href={data.energySupportingEvidenceFileUrl} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 font-medium">View</a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 font-semibold italic">No file uploaded</p>
                )}
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold mb-2">Renewable Energy Evidence</p>
                {data.renewableSupportingEvidenceFileUrl ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm font-semibold text-indigo-600 truncate max-w-[200px]">{data.renewableSupportingEvidenceFileName || 'Renewable Evidence'}</p>
                    <a href={data.renewableSupportingEvidenceFileUrl} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 font-medium">View</a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 font-semibold italic">No file uploaded</p>
                )}
              </div>
            </div>
          </ReviewCard>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-between items-center shadow-lg z-10">
          <div className="flex items-center gap-4">
            <Link href="/" className="px-6 py-2.5 rounded-full border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors">
              Back to Dashboard
            </Link>
            {status === 'PENDING' || status === 'IN_PROGRESS' ? (
              <>
                <button onClick={handleReject} className="px-6 py-2.5 rounded-full bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 border border-red-200 transition-colors">
                  Reject
                </button>
                <button onClick={handleApprove} className="px-6 py-2.5 rounded-full bg-green-600 text-white text-xs font-bold hover:bg-green-700 shadow-lg transition-colors">
                  Approve
                </button>
              </>
            ) : null}
          </div>
          {status !== 'PENDING' && status !== 'IN_PROGRESS' ? (
            <span className="text-gray-500 font-medium text-sm italic">Submission already processed</span>
          ) : null}
        </div>

      </div>
    </main>
  );
}

