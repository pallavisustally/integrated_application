'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// ------------- ICONS -------------
const SlotIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const BoundaryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const EnergyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CalcIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="12" y2="14" />
    <line x1="8" y1="18" x2="16" y2="18" />
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
    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: accentColor }} />
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>{icon}</div>
      <h3 className="font-semibold text-gray-900 text-sm tracking-wide uppercase">{title}</h3>
    </div>
    <div className="flex-1 overflow-y-auto">{children}</div>
  </div>
);

const DetailRow = ({ label, value, subLabel }: { label: string; value: string | React.ReactNode; subLabel?: string }) => {
  const renderLabel = () => {
    if (label.includes('(kWh)')) {
      return <>{label.replace(' (kWh)', '')} <span className="normal-case">(kWh)</span></>;
    }
    if (label.includes('(GJ)')) {
      return <>{label.replace(' (GJ)', '')} <span className="normal-case">(GJ)</span></>;
    }
    if (label.includes('tCO2e')) {
      return <>{label.replace(' tCO2e', '')} <span className="normal-case">tCO2e</span></>;
    }
    if (label.includes('(kgCO2e/kWh)')) {
      return <>{label.replace(' (kgCO2e/kWh)', '')} <span className="normal-case">(kgCO2e/kWh)</span></>;
    }
    return label;
  };

  return (
    <div className="mb-4 last:mb-0">
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{renderLabel()}</p>
      <div className={`font-semibold text-gray-900 text-sm ${!value || value === 'Not specified' || value === '-' || value === 'N/A' ? 'text-gray-400 italic' : ''}`}>
        {value || '-'}
      </div>
      {subLabel && <p className="text-xs text-gray-500 mt-1">{subLabel}</p>}
    </div>
  );
};

const DetailGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">{children}</div>
);

// Helper for Monthly Table
const MonthlyTable = ({ data, type }: { data: any; type: 'Grid' | 'Renewable' }) => {
  const parsedData = useMemo(() => {
    if (!data) return [];
    let items = data;
    if (typeof data === 'string') {
      try {
        items = JSON.parse(data);
        // Handle double-stringification if it happens
        if (typeof items === 'string') {
          items = JSON.parse(items);
        }
      } catch (e) {
        return [];
      }
    }
    return Array.isArray(items) ? items : [];
  }, [data]);

  if (!parsedData || parsedData.length === 0) {
    return <p className="text-xs text-gray-400 italic">No monthly data entered.</p>;
  }

  return (
    <div className="overflow-x-auto mt-2 border rounded-lg w-full">
      <table className="min-w-full divide-y divide-gray-200 table-auto text-[10px]">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Month</th>
            <th className="px-2 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Electricity (kWh)</th>
            <th className="px-2 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">Consumption (GJ)</th>
            <th className="px-2 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">
              {type === 'Grid' ? 'Spend / Source' : 'Source'}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {parsedData.map((row: any, idx: number) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-2 py-2 font-medium text-gray-900 whitespace-nowrap">
                {row.month ? (row.month.includes('-') && row.month.split('-').length === 2 ? new Date(row.month + '-01').toLocaleDateString('default', { month: 'short', year: '2-digit' }) : row.month) : '-'}
              </td>
              <td className="px-2 py-2 text-gray-700">{row.electricityPurchased || '-'}</td>
              <td className="px-2 py-2 text-gray-700">{row.energyConsumption || '-'}</td>
              <td className="px-2 py-2 text-gray-700">
                {type === 'Grid' ? (row.dataSourceType || row.spend || '-') : (row.dataSourceType || '-')}
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
  const params = useParams();
  const id = params?.id as string;

  const [scope2Data, setScope2Data] = useState<any>(null);
  const [slotBooking, setSlotBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_SUSTALLY_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/scope2-applications/${id}`);
        if (!res.ok) {
          setError('Assessment not found');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setScope2Data(data);

        const email = data.email;
        if (email) {
          const slotsRes = await fetch(
            `${API_URL}/api/slot-bookings?where[email][equals]=${encodeURIComponent(email)}&limit=10`
          );
          const slotsJson = await slotsRes.json();
          if (slotsJson?.docs?.length > 0) {
            setSlotBooking(slotsJson.docs[0]);
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
  }, [id]);

  const handleApprove = async () => {
    if (!confirm('Approve this submission?')) return;
    try {
      const res = await fetch(`${API_URL}/api/scope2-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (res.ok) {
        setScope2Data((prev: any) => ({ ...prev, status: 'APPROVED' }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      const res = await fetch(`${API_URL}/api/scope2-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason: reason }),
      });
      if (res.ok) {
        setScope2Data((prev: any) => ({ ...prev, status: 'REJECTED', rejectionReason: reason }));
      }
    } catch (e) {
      console.error(e);
    }
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

  const data = scope2Data;
  const status = data.status || 'PENDING';

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 font-sans text-gray-900 flex flex-col items-center pb-24">
      <div className="w-full max-w-6xl flex flex-col">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Link href="/" className="text-gray-500 hover:text-gray-700 p-1 -ml-1 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assessment Review</h1>
              <p className="text-gray-500 text-sm mt-0.5">{data.facilityName || 'Scope 2'}</p>
            </div>
          </div>
          <div className="flex-1 flex justify-center shrink-0">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' :
              status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' :
                status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  'bg-orange-100 text-orange-700 border-orange-200'
              }`}>{status.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-3 opacity-90 flex-1 justify-end shrink-0">
            <Image src="/sustally-logo.png" alt="Sustally" width={100} height={40} className="object-contain h-10 w-auto" style={{ width: 'auto', height: 'auto' }} />
            <div className="w-[1px] bg-gray-300 h-10" />
            <span className="font-medium text-gray-400 text-sm max-w-[200px] leading-tight">
              choose sustally as your sustainability ally
            </span>
          </div>
        </div>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 1. Slot Booking (if exists) */}
          {slotBooking && (
            <ReviewCard title="Slot Booking" icon={<SlotIcon />} accentColor="#8b5cf6">
              <DetailGrid>
                <DetailRow label="Name" value={slotBooking.name || '-'} />
                <DetailRow label="Email" value={slotBooking.email || '-'} />
                <DetailRow label="Mobile" value={slotBooking.mobile || '-'} />
                <DetailRow label="Company" value={slotBooking.company || '-'} />
                <DetailRow label="Sector" value={slotBooking.sector || '-'} />
                <DetailRow label="Nature of Business" value={slotBooking.natureOfBusiness || '-'} />
                <DetailRow label="Country" value={slotBooking.country || '-'} />
                <DetailRow label="Assignment Date" value={slotBooking.assignmentDate || '-'} />
                <DetailRow label="Assignment Slot" value={slotBooking.assignmentSlot || '-'} />
                <DetailRow label="Assignment Time" value={slotBooking.assignmentTime || '-'} />
              </DetailGrid>
            </ReviewCard>
          )}

          {/* 2. Boundary & Site Details */}
          <ReviewCard title="Boundary & Site Details" icon={<BoundaryIcon />} accentColor="#6366f1">
            <DetailGrid>
              <DetailRow label="State / Grid Region" value={data.state} />
              <DetailRow label="Facility Name" value={data.facilityName} />
              <DetailRow label="Utility Provider" value={data.utilityProvider} />
              <DetailRow label="Site Count" value={data.siteCount} />
              <DetailRow label="Reporting Year" value={data.reportingYear ? new Date(data.reportingYear).toLocaleDateString('default', { year: 'numeric' }) : '-'} />
              <DetailRow label="Reporting Period" value={data.reportingPeriod} />
              {data.reportingPeriod === 'Quarterly' && (
                <DetailRow label="Selected Quarter" value={data.selectedQuarter || '-'} />
              )}
              <DetailRow label="Consolidation Approach" value={data.conditionalApproach} />
              <DetailRow label="Scope Boundary Notes" value={data.scopeBoundaryNotes} />
            </DetailGrid>
          </ReviewCard>

          {/* Operational Details */}
          <ReviewCard title="Operational Details" icon={<EnergyIcon />} accentColor="#64748b">
            <DetailGrid>
              <DetailRow label="Turnover of your site (₹)" value={data.energyIntensityPerRupee} />
            </DetailGrid>
          </ReviewCard>

          {/* 3. Energy Activity */}
          <ReviewCard title="Grid Energy & Activity" icon={<EnergyIcon />} accentColor="#f59e0b">
            <DetailGrid>
              <DetailRow label="Energy Activity Input" value={data.energyActivityInput} />
              <DetailRow label="Energy Category" value={data.energyCategory} />
              <DetailRow label="Tracking Type" value={data.trackingType} />
              <DetailRow label="Data Source Type" value={data.dataSourceType || (data.energyActivityInput === 'Monthly' || data.energyActivityInput === 'Quarterly' ? 'Monthly Breakdown' : '-')} />
              <DetailRow label="Total Electricity Purchased (kWh)" value={(() => {
                if (data.energyActivityInput === 'Monthly' || data.energyActivityInput === 'Quarterly') {
                  const items = typeof data.monthlyData === 'string' ? JSON.parse(data.monthlyData) : (data.monthlyData || []);
                  const sum = Array.isArray(items) ? items.reduce((acc: number, row: any) => acc + (parseFloat(row.electricityPurchased) || 0), 0) : 0;
                  return sum > 0 ? sum.toFixed(2) : (data.electricityPurchased || "-");
                }
                return data.electricityPurchased || "-";
              })()} />
              <DetailRow label="Total Spend Amount (₹)" value={data.spendAmount != null ? String(data.spendAmount) : '-'} />
              <DetailRow label="Total Energy Consumption (GJ)" value={(() => {
                if (data.energyActivityInput === 'Monthly' || data.energyActivityInput === 'Quarterly') {
                  const items = typeof data.monthlyData === 'string' ? JSON.parse(data.monthlyData) : (data.monthlyData || []);
                  const sum = Array.isArray(items) ? items.reduce((acc: number, row: any) => acc + (parseFloat(row.electricityPurchased) || 0), 0) : 0;
                  return sum > 0 ? (sum * 0.0036).toFixed(2) : (data.energyConsumption || "-");
                }
                return data.energyConsumption || "-";
              })()} />

              {(data.energyActivityInput === 'Monthly' || data.energyActivityInput === 'Quarterly' || data.reportingPeriod === 'Monthly' || data.reportingPeriod === 'Quarterly') && (
                <div className="col-span-1 md:col-span-2 mt-2">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 border-t pt-4">Monthly Breakdown (Grid)</p>
                  <MonthlyTable data={data.monthlyData} type="Grid" />
                </div>
              )}
              <DetailRow label="Energy Source Description" value={data.energySourceDescription} />
            </DetailGrid>
          </ReviewCard>

          {/* 4. Renewable Energy */}
          <ReviewCard title="Renewable Electricity" icon={<RenewableIcon />} accentColor="#10b981">
            <DetailGrid>
              <DetailRow label="Net Metering" value={data.netMeteringApplicable} />
              <DetailRow label="Has Renewable Electricity" value={data.hasRenewableElectricity} />

              {data.hasRenewableElectricity === 'Yes' && (
                <>
                  <DetailRow label="Input Type" value={data.renewableEnergyActivityInput || 'Yearly'} />
                  <DetailRow label="Total Renewable Electricity (kWh)" value={(() => {
                    if (data.renewableEnergyActivityInput === 'Monthly' || data.renewableEnergyActivityInput === 'Quarterly') {
                      const items = typeof data.renewableMonthlyData === 'string' ? JSON.parse(data.renewableMonthlyData) : (data.renewableMonthlyData || []);
                      const sum = Array.isArray(items) ? items.reduce((acc: number, row: any) => acc + (parseFloat(row.electricityPurchased) || 0), 0) : 0;
                      return sum > 0 ? sum.toFixed(2) : (data.renewableElectricity || "-");
                    }
                    return data.renewableElectricity || "-";
                  })()} />
                  <DetailRow label="Total Renewable Consumption (GJ)" value={(() => {
                    if (data.renewableEnergyActivityInput === 'Monthly' || data.renewableEnergyActivityInput === 'Quarterly') {
                      const items = typeof data.renewableMonthlyData === 'string' ? JSON.parse(data.renewableMonthlyData) : (data.renewableMonthlyData || []);
                      const sum = Array.isArray(items) ? items.reduce((acc: number, row: any) => acc + (parseFloat(row.electricityPurchased) || 0), 0) : 0;
                      return sum > 0 ? (sum * 0.0036).toFixed(2) : (data.renewableEnergyConsumption || "-");
                    }
                    return data.renewableEnergyConsumption || "-";
                  })()} />

                  {(data.renewableEnergyActivityInput === 'Monthly' || data.renewableEnergyActivityInput === 'Quarterly') && (
                    <div className="col-span-1 md:col-span-2 mt-2">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 border-t pt-4">Monthly Breakdown (Renewable)</p>
                      <MonthlyTable data={data.renewableMonthlyData} type="Renewable" />
                    </div>
                  )}
                  <DetailRow label="Renewable Source Description" value={data.renewableEnergySourceDescription} />
                </>
              )}
            </DetailGrid>
          </ReviewCard>

          {/* 6. Evidence Files */}
          <ReviewCard title="Uploaded Evidence" icon={<EvidenceIcon />} accentColor="#8b5cf6">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Grid Energy Evidence</p>
                {data.energySupportingEvidenceFileUrl ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm font-semibold text-indigo-600">{data.energySupportingEvidenceFileName || 'Energy Evidence'}</p>
                    <a href={data.energySupportingEvidenceFileUrl} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 font-medium">View</a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 font-semibold italic">-</p>
                )}
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Renewable Energy Evidence</p>
                {data.renewableSupportingEvidenceFileUrl ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm font-semibold text-indigo-600">{data.renewableSupportingEvidenceFileName || 'Renewable Evidence'}</p>
                    <a href={data.renewableSupportingEvidenceFileUrl} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 font-medium">View</a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 font-semibold italic">-</p>
                )}
              </div>
            </div>
          </ReviewCard>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-between items-center shadow-lg z-10">
          <div className="flex items-center gap-4">
            <Link href="/" className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50">
              Back to Dashboard
            </Link>
            {status === 'PENDING' || status === 'IN_PROGRESS' ? (
              <>
                <button onClick={handleReject} className="px-6 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 border border-red-200">
                  Reject
                </button>
                <button onClick={handleApprove} className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg">
                  Approve
                </button>
              </>
            ) : null}
          </div>
          {status !== 'PENDING' && status !== 'IN_PROGRESS' ? (
            <span className="text-gray-500 font-medium">Submission processed</span>
          ) : null}
        </div>

      </div>
    </main>
  );
}
