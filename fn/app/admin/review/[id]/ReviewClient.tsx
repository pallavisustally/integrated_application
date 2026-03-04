"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ------------- ICONS (Reused) -------------
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9 12l2 2 4-4"></path>
    </svg>
);

const CrossIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
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

const DetailRow = ({ label, value, subLabel }: { label: string; value: string; subLabel?: string }) => {
    const renderLabel = () => {
        if (label.includes('(kWh)')) return <>{label.replace(' (kWh)', '')} <span className="normal-case">(kWh)</span></>;
        if (label.includes('(GJ)')) return <>{label.replace(' (GJ)', '')} <span className="normal-case">(GJ)</span></>;
        if (label.includes('tCO2e')) return <>{label.replace(' tCO2e', '')} <span className="normal-case">tCO2e</span></>;
        return label;
    };

    return (
        <div className="mb-4 last:mb-0">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{renderLabel()}</p>
            <p className={`font-semibold text-gray-900 text-sm ${!value || value === "Not specified" || value === "-" ? "text-gray-400 italic" : ""}`}>
                {value || "-"}
            </p>
            {subLabel && <p className="text-xs text-gray-500 mt-1">{subLabel}</p>}
        </div>
    );
};

const DetailGrid = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        {children}
    </div>
);

const SUSTALLY_API_URL = process.env.NEXT_PUBLIC_SUSTALLY_API_URL || "https://render-beryl.vercel.app";

export default function ReviewClient({ submission }: { submission: any }) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState(submission.status);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);

    const data = submission.data;

    const handleApprove = async () => {
        if (!confirm("Are you sure you want to approve this submission?")) return;

        setIsProcessing(true);
        try {
            const res = await fetch(`${SUSTALLY_API_URL}/api/scope2-applications/${submission.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "APPROVED" }),
            });

            if (!res.ok) throw new Error("Failed to approve");

            setStatus("APPROVED");
            alert("Submission approved successfully!");
        } catch (error) {
            console.error(error);
            alert("Error approving submission");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch(`${SUSTALLY_API_URL}/api/scope2-applications/${submission.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "REJECTED",
                    rejectionReason: rejectReason
                }),
            });

            if (!res.ok) throw new Error("Failed to reject");

            setStatus("REJECTED");
            setShowRejectModal(false);
            alert("Submission rejected successfully!");
        } catch (error) {
            console.error(error);
            alert("Error rejecting submission");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#f8f9fa] p-4 font-sans text-gray-900 flex flex-col items-center">
            <div className="w-full max-w-6xl flex flex-col h-full">

                {/* HEADER */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Review Panel</h1>
                        <p className="text-gray-500 text-sm mt-1">Submission ID: {submission.id}</p>
                    </div>

                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold border ${status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' :
                        status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' :
                            'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}>
                        {status}
                    </div>
                </div>

                {/* CONTENT GRID - Duplicating Structure */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                    {/* Left Column */}
                    <div className="flex flex-col gap-4">
                        <ReviewCard title="User Identity" icon={<BoundaryIcon />} accentColor="#6366f1">
                            <DetailGrid>
                                <DetailRow label="Name" value={data.userName || "Unknown"} />
                                <DetailRow label="Email" value={data.userEmail || "Unknown"} />
                                <DetailRow label="Company" value={data.userCompany || "Unknown"} />
                                <DetailRow label="Mobile" value={data.userMobile || "Unknown"} />
                                <DetailRow label="Sector" value={data.sector || "NA"} />
                                <DetailRow label="Nature of Business" value={data.natureOfBusiness || "NA"} />
                            </DetailGrid>
                        </ReviewCard>

                        <ReviewCard title="Boundary & Site Details" icon={<BoundaryIcon />} accentColor="#6366f1">
                            <DetailGrid>
                                <DetailRow label="Grid Regions" value={data.state} />
                                <DetailRow label="Facility Name" value={data.facilityName} />
                                <DetailRow label="Site Count" value={data.siteCount} />
                                <DetailRow label="Reporting Year" value={data.reportingYear ? new Date(data.reportingYear).getFullYear().toString() : '2024'} />
                                <DetailRow label="Period" value={data.reportingPeriod} />
                            </DetailGrid>
                        </ReviewCard>

                        <ReviewCard title="Operational Details" icon={<EnergyIcon />} accentColor="#64748b">
                            <DetailGrid>
                                <DetailRow label="Turnover of your site (INR)" value={data.energyIntensityPerRupee ? String(data.energyIntensityPerRupee) : "Not specified"} />
                                <DetailRow label="Net Metering" value={data.netMeteringApplicable || "-"} />
                                <DetailRow label="On-site Generated Exported (kWh)" value={data.onsiteExportedKwh ? String(data.onsiteExportedKwh) : "-"} />
                            </DetailGrid>
                        </ReviewCard>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-4">
                        <ReviewCard title="Energy Data" icon={<EnergyIcon />} accentColor="#f59e0b">
                            <DetailGrid>
                                <DetailRow label="Energy Activity" value={data.energyActivityInput} />
                                <DetailRow label="Category" value={data.energyCategory || "-"} />
                                <DetailRow label="Value Type" value="Gross" />
                                <DetailRow label="Electricity Purchased (kWh)" value={data.electricityPurchased || "-"} />
                                <DetailRow label="Energy Consumption (GJ)" value={data.energyConsumption || "-"} />
                                <DetailRow label="Spend Amount" value={data.spendAmount || "-"} />
                                <DetailRow label="Data Source" value={data.dataSourceType || data.energySourceDescription || "-"} />
                            </DetailGrid>
                        </ReviewCard>

                        <ReviewCard title="Renewable Data" icon={<RenewableIcon />} accentColor="#10b981">
                            <DetailGrid>
                                <DetailRow label="Has Renewable?" value={data.hasRenewableElectricity || "No"} />
                                <DetailRow label="Renewable Electricity (kWh)" value={data.renewableElectricity || "-"} />
                                <DetailRow label="Energy Consumption (GJ)" value={data.renewableEnergyConsumption || "-"} />
                            </DetailGrid>
                        </ReviewCard>

                        <ReviewCard title="Uploaded Evidence" icon={<EvidenceIcon />} accentColor="#8b5cf6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Grid Energy Evidence</p>
                                    {data.energySupportingEvidenceFileUrl ? (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <p className="text-sm font-semibold text-indigo-600">{data.energySupportingEvidenceFileName || "Energy Evidence"}</p>
                                            </div>
                                            <a href={data.energySupportingEvidenceFileUrl.includes('/api/evidence/download') ? data.energySupportingEvidenceFileUrl : `/api/evidence/download?url=${encodeURIComponent(data.energySupportingEvidenceFileUrl)}`} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 text-gray-700 font-medium whitespace-nowrap">
                                                View File
                                            </a>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 font-semibold italic">-</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Renewable Energy Evidence</p>
                                    {data.renewableSupportingEvidenceFileUrl ? (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <p className="text-sm font-semibold text-indigo-600">{data.renewableSupportingEvidenceFileName || "Renewable Evidence"}</p>
                                            </div>
                                            <a href={data.renewableSupportingEvidenceFileUrl.includes('/api/evidence/download') ? data.renewableSupportingEvidenceFileUrl : `/api/evidence/download?url=${encodeURIComponent(data.renewableSupportingEvidenceFileUrl)}`} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 text-gray-700 font-medium whitespace-nowrap">
                                                View File
                                            </a>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 font-semibold italic">-</p>
                                    )}
                                </div>
                            </div>
                        </ReviewCard>
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-center gap-4 shadow-lg z-10">
                    {status === 'PENDING' ? (
                        <>
                            <button
                                onClick={() => setShowRejectModal(true)}
                                disabled={isProcessing}
                                className="px-8 py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors border border-red-200"
                            >
                                Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={isProcessing}
                                className="px-8 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                            >
                                {isProcessing ? "Processing..." : "Verify & Approve"}
                            </button>
                        </>
                    ) : (
                        <p className="text-gray-500 font-medium">This submission has been processed.</p>
                    )}
                </div>

                {/* Reject Modal */}
                {showRejectModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-[fadeIn_0.2s_ease-out]">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Submission</h3>
                            <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejection. This will be sent to the user.</p>

                            <textarea
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm mb-4 focus:ring-2 focus:ring-red-500 outline-none h-32 resize-none"
                                placeholder="Reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />

                            <div className="flex justify-end gap-3">
                                <button
                                    className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2"
                                    onClick={() => setShowRejectModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="bg-red-600 text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                    onClick={handleReject}
                                    disabled={!rejectReason.trim() || isProcessing}
                                >
                                    {isProcessing ? "Rejecting..." : "Confirm Reject"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}
