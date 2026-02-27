"use client";

import { useMemo, useRef, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import CostSavingCard from "../../dashboard/CostSavingCard";

/* eslint-disable @next/next/no-img-element */

function CertificateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const certificateRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const brsrPage1Ref = useRef<HTMLDivElement>(null);
  const brsrPage2Ref = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [isDownloadingBrsr, setIsDownloadingBrsr] = useState(false);
  const formatCertificateId = (reportingYear: string) => {
    const year = reportingYear ? (() => {
      const m = reportingYear.match(/\d{4}/);
      return m ? parseInt(m[0], 10) : new Date().getFullYear();
    })() : new Date().getFullYear();
    const yearKey = `${year}-${String(year + 1).slice(-2)}`;
    return `GHGCAL${yearKey}00001`;
  };

  const formatReportingPeriod = (dateStr: string, period: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // Fallback if invalid date

      const year = date.getFullYear();

      if (period === "Annually" || period === "Yearly") {
        return `${year}-${String(year + 1).slice(-2)}`;
      } else if (period === "Monthly") {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthIndex = date.getMonth();
        const monthName = monthNames[monthIndex];

        // Get last day of the month
        const lastDay = new Date(year, monthIndex + 1, 0).getDate();

        return `1 ${monthName} ${year} to ${lastDay} ${monthName} ${year}`;
      }

      return `${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isPreview = searchParams.get("preview") === "true";

    if (isPreview) {
      // Mock data for preview
      setData({
        state: "Maharashtra",
        siteCount: "Single Site",
        facilityName: "Demo Manufacturing Ltd.",
        reportingYear: "2024 - 2025",
        rawReportingYear: "2024",
        reportingPeriod: "Annually",
        scopeBoundaryNotes: "Operational Control",
        renewableElectricity: "Yes",
        renewableEnergyConsumption: "1000",
        onsiteExportedKwh: "0",
        certificateId: formatCertificateId("2024 - 2025"),
        gridEmissionFactor: "0.82",
        locationBasedEmissions: "17.77",
        marketBasedEmissions: "11.27",
        energyGrid: "72000000000", // ~20 GWh in kJ
        energyRenew: "36000000", // ~0.01 GWh in kJ
        energyTotal: "72036000000",
        electricityPurchased: "20000", // 20k units annual
        spendAmount: "25500000", // 2.55 Cr
        trackingType: "Spend amount",
      });
      setLoading(false);
      return;
    }

    // Check for session data
    const storedUser = sessionStorage.getItem("scope2_user");

    if (!storedUser) {
      // Not authenticated, redirect to login
      router.push("/dashboard");
      return;
    }

    try {
      const parsedData = JSON.parse(storedUser);
      const rawReportingYear = parsedData.reportingYear || "";
      const rawReportingPeriod = parsedData.reportingPeriod || "Annually";
      const formattedPeriod = formatReportingPeriod(rawReportingYear, rawReportingPeriod);

      setData({
        state: parsedData.state || "-",
        siteCount: parsedData.siteCount || "-",
        facilityName: parsedData.facilityName || "ACME MANUFACTURING LTD.",
        reportingYear: formattedPeriod || "2025-26",
        rawReportingYear: rawReportingYear,
        reportingPeriod: rawReportingPeriod,
        scopeBoundaryNotes: parsedData.scopeBoundaryNotes || "-",
        renewableElectricity: parsedData.renewableElectricity || "0",
        renewableEnergyConsumption: parsedData.renewableEnergyConsumption || "0",
        onsiteExportedKwh: parsedData.onsiteExportedKwh || "0",
        certificateId: parsedData.certificateId || formatCertificateId(parsedData.reportingYear || ""),
        // Metrics
        gridEmissionFactor: String(parsedData.gridEmissionFactor || "0"),
        locationBasedEmissions: String(parsedData.locationBasedEmissions || "0"),
        marketBasedEmissions: String(parsedData.marketBasedEmissions || "0"),
        energyGrid: String(parsedData.energyGrid_kJ || "0"),
        energyRenew: String(parsedData.energyRenew_kJ || "0"),
        energyTotal: String(parsedData.energyTotal_kJ || "0"),
        energyIntensityPerRupee: parsedData.energyIntensityPerRupee || "NA",
        energyConsumption: parsedData.energyConsumption || "0",
        // Added manually to support display even if calculation didn't run fully or for debugging
        electricityPurchased: parsedData.electricityPurchased,
        spendAmount: parsedData.spendAmount,
        trackingType: parsedData.trackingType,
      });
    } catch (e) {
      console.error("Failed to parse session data", e);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [router, searchParams]);

  if (loading || !data) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }
  /* eslint-enable react-hooks/exhaustive-deps */

  // Use energyGrid_kJ and energyRenew_kJ when available (canonical values from scope form)
  // Conversion: 1 GWh = 3,600,000,000 kJ
  const energyGridKj = parseFloat(data.energyGrid) || 0;
  const energyRenewKj = parseFloat(data.energyRenew) || 0;
  const energyTotalKj = parseFloat(data.energyTotal) || 0;

  let derivedGridKWh: number;
  let derivedRenewKWh: number;

  if (energyTotalKj > 0 || energyGridKj > 0 || energyRenewKj > 0) {
    derivedGridKWh = energyGridKj / 3600;
    derivedRenewKWh = energyRenewKj / 3600;
  } else {
    // Fallback to kWh inputs (electricityPurchased, renewableElectricity)
    const fallbackGridKWh = parseFloat(data.electricityPurchased) || 0;
    const fallbackRenewKWh = parseFloat(data.renewableElectricity) || parseFloat(data.renewableEnergyConsumption) || 0;
    derivedGridKWh = fallbackGridKWh;
    derivedRenewKWh = fallbackRenewKWh;
  }

  const derivedTotalKWh = derivedGridKWh + derivedRenewKWh;

  const formatEnergyDisplay = (kwh: number) => {
    return { value: kwh.toLocaleString(undefined, { maximumFractionDigits: 2 }), unit: "kWh" };
  };
  const totalDisplay = formatEnergyDisplay(derivedTotalKWh);
  const renewDisplay = formatEnergyDisplay(derivedRenewKWh);

  // For display in top cards
  const energyTotalKWh = totalDisplay.value;
  const energyRenewKWh = renewDisplay.value;
  const energyTotalUnit = totalDisplay.unit;
  const energyRenewUnit = renewDisplay.unit;

  // For pie chart - use kWh values 
  const chartData = [
    { name: "Grid Electricity", value: parseFloat(derivedGridKWh.toFixed(2)), color: "#9ca3af" },
    { name: "Renewable / Contracted", value: parseFloat(derivedRenewKWh.toFixed(2)), color: "#22c55e" },
  ];

  const energyTotalMWhDisp = derivedTotalKWh.toLocaleString(undefined, { maximumFractionDigits: 2 });

  // Use the form's calculated energyConsumption (which is already in GJ)
  const gridGjValue = parseFloat(data.energyConsumption) || (parseFloat(data.electricityPurchased) * 0.0036) || 0;
  const renewGjValue = parseFloat(data.renewableEnergyConsumption) || (parseFloat(data.renewableElectricity) * 0.0036) || 0;
  const totalGjValue = gridGjValue + renewGjValue;

  const formatGj = (val: number) => {
    if (!val) return "NA";
    return val.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  const energyGridGj = formatGj(gridGjValue);
  const energyRenewGj = formatGj(renewGjValue);
  const energyTotalGj = formatGj(totalGjValue);

  const scope2Emissions = data.marketBasedEmissions ? parseFloat(data.marketBasedEmissions).toFixed(2) : "NA";
  const fyYear = data.reportingYear?.includes("FY") ? data.reportingYear : `FY ${data.reportingYear}`;

  const handleDownloadCertificate = async () => {
    if (certificateRef.current === null) {
      return;
    }

    try {
      setIsDownloading(true);

      // Force valid dimensions for capture (A4 at 96 DPI: 794x1123)
      const dataUrl = await toPng(certificateRef.current, { cacheBust: true, width: 794, height: 1123, pixelRatio: 2 });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [794, 1123]
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, 794, 1123);
      pdf.save(`Certification_${data.facilityName}_${data.reportingYear}.pdf`);
    } catch (err) {
      console.error("Failed to generate certificate", err);
      alert("Failed to generate certificate. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadReport = async () => {
    const element = document.getElementById('dashboard-container');
    if (!element) {
      return;
    }

    try {
      setIsDownloadingReport(true);

      // Capture the dashboard with good quality
      const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2 });

      // Calculate aspect ratio to fit in PDF (Landscape A4: 297mm x 210mm)
      // A4 Landscape in px (approx): 1123 x 794
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1123, 794]
      });

      const imgProperties = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Assessment_Report_${data.facilityName}_${data.reportingYear}.pdf`);
    } catch (err) {
      console.error("Failed to generate report", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const handleDownloadBrsr = async () => {
    if (!brsrPage1Ref.current || !brsrPage2Ref.current) return;
    try {
      setIsDownloadingBrsr(true);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [794, 1123]
      });

      const dataUrl1 = await toPng(brsrPage1Ref.current, { cacheBust: true, width: 794, height: 1123, pixelRatio: 2 });
      pdf.addImage(dataUrl1, 'PNG', 0, 0, 794, 1123);

      pdf.addPage([794, 1123], 'portrait');

      const dataUrl2 = await toPng(brsrPage2Ref.current, { cacheBust: true, width: 794, height: 1123, pixelRatio: 2 });
      pdf.addImage(dataUrl2, 'PNG', 0, 0, 794, 1123);

      pdf.save(`BRSR_P6_Report_${data.facilityName}_${data.reportingYear}.pdf`);
    } catch (err) {
      console.error("Failed to generate BRSR report", err);
      alert("Failed to generate BRSR report. Please try again.");
    } finally {
      setIsDownloadingBrsr(false);
    }
  };

  return (
    <>
      <div ref={dashboardRef} className="flex-1 flex flex-col gap-4 max-w-[1600px] mx-auto w-full">

        {/* Header Section */}
        <div className="flex items-start justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Scope 2 Emissions & Cost Performance</h1>
            <div className="flex items-center gap-3 mt-1 text-gray-500 text-sm">
              <span className="font-medium text-gray-700">{data.facilityName}</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>{data.reportingYear}</span>
            </div>
          </div>
          {/* ... Verified Badge ... */}
        </div>

        {/* Level 1: Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 shrink-0 h-auto lg:h-[15%] min-h-[100px]">
          {/* Metric 1: Total Scope 2 Emissions */}
          <div className="bg-white p-4 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-medium text-gray-500">Total Scope 2 Emissions</p>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{parseFloat(data.marketBasedEmissions).toFixed(2)}</h3>
              <span className="text-xs font-normal text-gray-500">tCO₂e</span>
            </div>
          </div>
          {/* Metric 2: Location Based */}
          <div className="bg-white p-4 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-medium text-gray-500">Location-based Emissions</p>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{parseFloat(data.locationBasedEmissions).toFixed(2)}</h3>
              <span className="text-xs font-normal text-gray-500">tCO₂e</span>
            </div>
          </div>
          {/* Metric 3: Renewable Energy */}
          <div className="bg-white p-4 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-medium text-gray-500">Renewable Energy</p>
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{energyRenewKWh}</h3>
              <span className="text-xs font-normal text-gray-500">{energyRenewUnit}</span>
            </div>
          </div>
          {/* Metric 4: Total Energy */}
          <div className="bg-white p-4 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-medium text-gray-500">Total Electricity Consumed</p>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{energyTotalKWh}</h3>
              <span className="text-xs font-normal text-gray-500">{energyTotalUnit}</span>
            </div>
          </div>
        </div>

        {/* Level 2: Charts & Cost & Downloads */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 h-auto min-h-[90px]">
          {/* Pie Chart */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 col-span-1 lg:col-span-2 flex flex-col h-[300px] lg:h-full">
            <h3 className="text-gray-500 text-xs font-medium mb-2">Electricity Consumption Breakdown</h3>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="75%"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <span className="text-lg font-bold text-gray-900 block">{energyTotalKWh}</span>
                  <span className="text-[10px] text-gray-500">{energyTotalUnit} <span className="uppercase">Total</span></span>
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs space-y-1">
              {chartData.map((item, i) => {
                const valueKWh = item.value.toLocaleString(undefined, { maximumFractionDigits: 2 });
                const percentage = derivedTotalKWh > 0 ? ((item.value / derivedTotalKWh) * 100).toFixed(0) : "0";
                return (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900 block">{valueKWh} kWh</span>
                      <span className="text-[10px] text-gray-500">{percentage}% of total</span>
                    </div>
                  </div>
                );
              })}
              <div className="pt-1 mt-1 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total Consumption</span>
                  <span className="font-semibold text-gray-900">{energyTotalMWhDisp} kWh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Projection (Solar Model) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 col-span-1 lg:col-span-2 flex flex-col h-full overflow-hidden">
            <CostSavingCard userData={data} />
          </div>

          {/* Downloads */}
          <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-xl shadow-sm border border-indigo-100 col-span-1 lg:col-span-1 flex flex-col h-[300px] lg:h-full">
            <h3 className="text-indigo-900 text-xs font-semibold mb-3">Available Reports</h3>
            <div className="flex-1 flex flex-col gap-3">
              <div
                className={`flex-1 flex items-center justify-between p-4 bg-white rounded-xl border border-indigo-50 hover:border-indigo-200 transition-colors ${isDownloadingReport ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-gray-800">Assessment report</p>
                    <p className="text-xs text-gray-500">Detailed analysis</p>
                  </div>
                </div>
                <button
                  className="text-xs font-bold text-indigo-600 cursor-pointer hover:text-indigo-800 transition-colors uppercase"
                  onClick={handleDownloadReport}
                >
                  {isDownloadingReport ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    "Download"
                  )}
                </button>
              </div>

              <div
                className={`flex-1 flex items-center justify-between p-4 bg-white rounded-xl border border-indigo-50 hover:border-indigo-200 transition-colors ${isDownloading ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-gray-800">Recognition certificate</p>
                  </div>
                </div>
                <button
                  className="text-xs font-bold text-green-600 cursor-pointer hover:text-green-800 transition-colors uppercase"
                  onClick={handleDownloadCertificate}
                >
                  {isDownloading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    "Download"
                  )}
                </button>
              </div>

              <div
                className={`flex-1 flex items-center justify-between p-4 bg-white rounded-xl border border-indigo-50 hover:border-indigo-200 transition-colors ${isDownloadingBrsr ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-gray-800">BRSR P6 Report</p>
                    <p className="text-xs text-gray-500">SEBI compliant</p>
                  </div>
                </div>
                <button
                  className="text-xs font-bold text-blue-600 cursor-pointer hover:text-blue-800 transition-colors uppercase"
                  onClick={handleDownloadBrsr}
                >
                  {isDownloadingBrsr ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    "Download"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Level 3: AI Insights & Footers */}
        <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[25%] shrink-0 min-h-[160px]">
          {/* AI Insights - 70% Width */}
          <div id="ai-insights-section" className="w-full lg:w-[70%] flex flex-col ai-insights-target">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              <h3 className="text-sm font-semibold text-gray-800">Operational AI Insights</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1">
              <div className="bg-green-50 rounded-lg p-3 border border-green-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-gray-900 text-xs">Production Efficiency</h4>
                  <span className="bg-red-500 text-white text-[8px] uppercase font-bold px-1.5 py-0.5 rounded-full">High</span>
                </div>
                <p className="text-[10px] text-gray-600 leading-snug line-clamp-3">Manufacturing efficiency reached 89.2%, up 6.8%. Scale successful practices.</p>
                <button className="w-full bg-white text-gray-800 text-[10px] font-semibold py-1.5 rounded border border-green-200 hover:bg-green-50 transition-colors flex items-center justify-between px-2">
                  Audit Lines
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </button>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-gray-900 text-xs">Inventory Opt.</h4>
                  <span className="bg-red-500 text-white text-[8px] uppercase font-bold px-1.5 py-0.5 rounded-full">High</span>
                </div>
                <p className="text-[10px] text-gray-600 leading-snug line-clamp-3">Electronics category showing 6.2x turnover rate. Increase allocation by 20%.</p>
                <button className="w-full bg-white text-gray-800 text-[10px] font-semibold py-1.5 rounded border border-blue-200 hover:bg-blue-50 transition-colors flex items-center justify-between px-2">
                  Update Plan
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </button>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-gray-900 text-xs">Delivery Risk</h4>
                  <span className="bg-gray-800 text-white text-[8px] uppercase font-bold px-1.5 py-0.5 rounded-full shrink-0">Med</span>
                </div>
                <p className="text-[10px] text-gray-600 leading-snug line-clamp-3">On-time delivery dipped to 92% in Week 3. Investigate bottlenecks.</p>
                <button className="w-full bg-white text-gray-800 text-[10px] font-semibold py-1.5 rounded border border-yellow-200 hover:bg-yellow-50 transition-colors flex items-center justify-between px-2">
                  Check Logistics
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </button>
              </div>
            </div>
          </div>

          <div id="next-steps-section" className="w-full lg:w-[30%] bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-center gap-3 next-steps-target">
            <div className="text-center mb-1">
              <h4 className="font-semibold text-gray-900 text-sm">Assessment Complete</h4>
              <p className="text-[10px] text-gray-500">Thank you for your submission</p>
            </div>
            <button onClick={() => {
              router.push("/scope/feedback");
            }} className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-opacity text-xs border border-gray-800 flex items-center justify-center gap-2">
              Finish & Exit
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </button>
          </div>
        </div>

      </div>

      {/* 
        HIDDEN CERTIFICATE FOR GENERATION 
        - A4 Portrait dimensions: 210mm x 297mm
        - Pixel dimensions at 96 DPI: 794px x 1123px
        - We position it off-screen to capture.
      */}
      <div style={{ position: "fixed", top: -9999, left: -9999 }}>
        <div
          ref={certificateRef}
          className="relative bg-white"
          style={{
            width: "794px",
            height: "1123px",
            overflow: "hidden",
          }}
        >
          {/* Border Background */}
          <img
            src="/certificate-assets/asset-4.jpg"
            alt="Border"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          <div className="relative z-10 w-full h-full flex flex-col items-center pt-28 pb-24 px-24">

            {/* Title Section */}
            <div className="text-center mb-14">
              <h1 className="text-3xl font-cinzel weight-500 line-height-1.6 letter-spacing-large text-[#1e3a3a] tracking-widest font-medium">
                PLANET POSITIVE
              </h1>

              <h2 className="text-3xl  font-cinzel weight-500 line-height-1.6 letter-spacing-large text-[#1e3a3a] tracking-widest font-medium mt-2">
                STEWARDSHIP RECOGNITION
              </h2>

              {/* Decoration */}
              <div className="mt-6 flex justify-center">
                <img
                  src="/certificate-assets/asset-1.png"
                  alt="Decoration"
                  className="w-72 object-contain opacity-80"
                />
              </div>
              {/* Awarded To */}
              <p className="text-xl font-cormorant Garamond italic text-gray-600 mb-8">
                This certificate is awarded to
              </p>
              {/* Facility Name */}
              <h2 className="text-4xl font-cinzel font-bold text-[#1e3a3a] uppercase tracking-wide mb-12 text-center">
                {data.facilityName}
              </h2>
              {/* Body Text */}
              <div className="text-center max-w-2xl space-y-4 mb-12">
                <p className="text-lg font-Cormorant Garamond style italic size-medium Line-height-relaxed text-gray-700 leading-relaxed italic">
                  in recognition of leadership in environmental transparency through the
                  proactive initiation of a Scope 2 emissions assessment for the reporting
                  period <span className="font-semibold not-italic">{fyYear}</span>{" "}
                  conducted during
                </p>

                <p className="text-lg font-Cormorant Garamond font-bold text-[#1e3a3a]">
                  PPTL Season 3, India’s first certified carbon-neutral sports event
                </p>
              </div>
              {/* Quote */}
              <p className="text-lg font-Cormorant Garamond Italic  text-gray-600 mb-16">
                A foundational milestone toward accountable climate action.
              </p>

              {/* Seal */}
              <div className="mb-10 flex justify-center">
                <img
                  src="/certificate-assets/asset-3.png"
                  alt="Seal"
                  className="w-36 h-36 object-contain"
                />
              </div>
              {/* Certificate ID */}
              <p className="text-xs font-Libre Baskerville text-gray-500 mb-16">
                Certificate ID: {data.certificateId}
              </p>

              {/* Signatures / Logos */}
              <div className="w-full flex justify-center items-end">
                <img
                  src="/certificate-assets/asset-2.png"
                  alt="Signatories"
                  className="w-full max-w-3xl object-contain h-24"
                />
              </div>
            </div>













          </div>
        </div>
      </div>

      {/* 
        HIDDEN BRSR REPORT PAGES
      */}
      <div style={{ position: "fixed", top: -9999, left: -9999 }}>
        <div
          ref={brsrPage1Ref}
          className="relative bg-white font-sans text-black"
          style={{ width: "794px", height: "1123px", overflow: "hidden", padding: "60px" }}
        >
          <h2 className="text-xl font-bold mb-4">PRINCIPLE 6: Businesses should respect and make efforts to protect and restore the environment</h2>
          <h3 className="text-lg font-bold text-center mb-6">Essential Indicators</h3>
          <p className="mb-4">1. Details of total energy consumption (in Joules or multiples) and energy intensity, in the following format:</p>

          <table className="w-full border-collapse border border-black mb-8 text-sm">
            <thead>
              <tr>
                <th className="border border-black p-2 text-left w-2/3 font-bold">Parameter</th>
                <th className="border border-black p-2 text-left w-1/3 font-bold">{fyYear}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold" colSpan={2}>From renewable sources</td>
              </tr>
              <tr>
                <td className="border border-black p-2">Total electricity consumption (A) (GJ)</td>
                <td className="border border-black p-2">{energyRenewGj}</td>
              </tr>
              <tr>
                <td className="border border-black p-2">Total fuel consumption (B) (GJ)</td>
                <td className="border border-black p-2">NA</td>
              </tr>
              <tr>
                <td className="border border-black p-2">Energy consumption through other sources (C) (GJ)</td>
                <td className="border border-black p-2">NA</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">Total energy consumed from renewable sources (A+B+C) (GJ)</td>
                <td className="border border-black p-2">{energyRenewGj}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold" colSpan={2}>From non-renewable sources</td>
              </tr>
              <tr>
                <td className="border border-black p-2">Total electricity consumption (D) (GJ)</td>
                <td className="border border-black p-2">{energyGridGj}</td>
              </tr>
              <tr>
                <td className="border border-black p-2">Total fuel consumption (E) (GJ)</td>
                <td className="border border-black p-2">NA</td>
              </tr>
              <tr>
                <td className="border border-black p-2">Energy consumption through other sources (F) (GJ)</td>
                <td className="border border-black p-2">NA</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">Total energy consumed from non-renewable sources (D+E+F) (GJ)</td>
                <td className="border border-black p-2">{energyGridGj}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">Total energy consumed (A+B+C+D+E+F) (GJ)</td>
                <td className="border border-black p-2">{energyTotalGj}</td>
              </tr>
              <tr>
                <td className="border border-black p-2">Energy intensity per rupee of turnover<br />(Total energy consumed / Revenue from operations)</td>
                <td className="border border-black p-2">
                  {data.energyIntensityPerRupee && !isNaN(parseFloat(data.energyIntensityPerRupee)) && parseFloat(data.energyIntensityPerRupee) > 0
                    ? (totalGjValue / parseFloat(data.energyIntensityPerRupee)).toLocaleString("en-IN", { maximumFractionDigits: 4 })
                    : "NA"}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">Energy intensity per rupee of turnover adjusted for Purchasing Power Parity (PPP)<br /><span className="font-normal">(Total energy consumed / Revenue from operations adjusted for PPP)</span></td>
                <td className="border border-black p-2">NA</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">Energy intensity in terms of physical output</td>
                <td className="border border-black p-2">NA</td>
              </tr>
              <tr>
                <td className="border border-black p-2">Energy intensity (optional) – the relevant metric may be selected by the entity</td>
                <td className="border border-black p-2">NA</td>
              </tr>
            </tbody>
          </table>
          <p className="text-sm">Note: Indicate if any independent assessment/ evaluation/assurance has been carried out by an external agency? (Y/N) If yes, name of the external agency.</p>
        </div>

        <div
          ref={brsrPage2Ref}
          className="relative bg-white font-sans text-black"
          style={{ width: "794px", height: "1123px", overflow: "hidden", padding: "60px" }}
        >
          <p className="mb-6">7. Provide details of greenhouse gas emissions (Scope 1 and Scope 2 emissions) & its intensity, in the following format:</p>

          <table className="w-full border-collapse border border-black mb-8 text-sm">
            <thead>
              <tr>
                <th className="border border-black p-2 text-center italic w-1/2">Parameter</th>
                <th className="border border-black p-2 text-center italic w-1/4">Unit</th>
                <th className="border border-black p-2 text-center italic w-1/4">{fyYear}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold">Total Scope 1 emissions<br /><span className="font-normal">(Break-up of the GHG into CO2, CH4, N2O, HFCs, PFCs, SF6, NF3, if available)</span></td>
                <td className="border border-black p-2 italic">Metric tonnes of CO2 equivalent</td>
                <td className="border border-black p-2 text-right">NA</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">Total Scope 2 emissions<br /><span className="font-normal">(Break-up of the GHG into CO2, CH4, N2O, HFCs, PFCs, SF6, NF3, if available)</span></td>
                <td className="border border-black p-2 italic">Metric tonnes of CO2 equivalent</td>
                <td className="border border-black p-2 text-right">{scope2Emissions}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">Total Scope 1 and Scope 2 emission intensity per rupee of turnover<br /><span className="font-normal">(Total Scope 1 and Scope 2 GHG emissions / Revenue from operations)</span></td>
                <td className="border border-black p-2 italic">Metric tonnes of CO2 Equivalent/(Crore INR)</td>
                <td className="border border-black p-2 text-right">NA</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">Total Scope 1 and Scope 2 emission intensity per rupee of turnover adjusted for Purchasing Power Parity (PPP)<br /><span className="font-normal">(Total Scope 1 and Scope 2 GHG emissions / Revenue from operations adjusted for PPP)</span></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 text-right">NA</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">Total Scope 1 and Scope 2 emission intensity in terms of physical output</td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 text-right">NA</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">Total Scope 1 and Scope 2 emission intensity (optional)<br /><span className="font-normal">– the relevant metric may be selected by the entity</span></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 text-right">NA</td>
              </tr>
            </tbody>
          </table>
          <p className="text-sm">Note: Indicate if any independent assessment/ evaluation/assurance has been carried out by an external agency? (Y/N) If yes, name of the external agency.</p>
        </div>
      </div>

    </>
  );
}

export default function ScopeDashboardPage() {
  return (
    <main id="dashboard-container" className="min-h-screen flex flex-col bg-gray-50 p-4 md:p-6 overflow-y-auto font-sans text-gray-800">
      <Suspense fallback={<div>Loading...</div>}>
        <CertificateContent />
      </Suspense>
    </main>
  );
}
