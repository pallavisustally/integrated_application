"use client";

import { useMemo, useRef, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

/* eslint-disable @next/next/no-img-element */

function CertificateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const certificateRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [generatedId, setGeneratedId] = useState("");

  useEffect(() => {
    setGeneratedId(`CEA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  }, []);

  const formatReportingPeriod = (dateStr: string, period: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // Fallback if invalid date

      const year = date.getFullYear();

      if (period === "Annually" || period === "Yearly") {
        return `${year} - ${year + 1}`;
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

  const data = useMemo(() => {
    const rawReportingYear = searchParams.get("reportingYear") || "";
    const rawReportingPeriod = searchParams.get("reportingPeriod") || "Annually";
    const formattedPeriod = formatReportingPeriod(rawReportingYear, rawReportingPeriod);

    return {
      state: searchParams.get("state") || "-",
      siteCount: searchParams.get("siteCount") || "-",
      facilityName: searchParams.get("facilityName") || "ACME MANUFACTURING LTD.",
      reportingYear: formattedPeriod || "2025-26", // Use formatted value as default if available
      rawReportingYear: rawReportingYear, // Keep raw if needed
      reportingPeriod: rawReportingPeriod,
      scopeBoundaryNotes: searchParams.get("scopeBoundaryNotes") || "-",
      renewableElectricity: searchParams.get("renewableElectricity") || "0",
      renewableEnergyConsumption: searchParams.get("renewableEnergyConsumption") || "0",
      onsiteExportedKwh: searchParams.get("onsiteExportedKwh") || "0",
      certificateId: searchParams.get("certificateId") || generatedId,
      // Metrics
      gridEmissionFactor: searchParams.get("gridEmissionFactor") || "0",
      locationBasedEmissions: searchParams.get("locationBasedEmissions") || "0",
      marketBasedEmissions: searchParams.get("marketBasedEmissions") || "0",
      energyGrid: searchParams.get("energyGrid_kJ") || "0", // in kJ
      energyRenew: searchParams.get("energyRenew_kJ") || "0", // in kJ
      energyTotal: searchParams.get("energyTotal_kJ") || "0", // in kJ
    };
  }, [searchParams, generatedId]);

  // Convert kJ to GWh for display (1 GWh = 3,600,000,000 kJ)
  const energyTotalGWh = (parseFloat(data.energyTotal) / 3600000000).toFixed(2);
  const energyRenewGWh = (parseFloat(data.energyRenew) / 3600000000).toFixed(2);

  // Mock data for charts - Updated to reflect ratio of Grid vs Renew
  const gridEnergyGWh = (parseFloat(data.energyGrid) / 3600000000);
  const renewEnergyGWh = (parseFloat(data.energyRenew) / 3600000000);

  const chartData = [
    { name: "Grid Electricity", value: parseFloat(gridEnergyGWh.toFixed(2)), color: "#9ca3af" },
    { name: "Renewable / Contracted", value: parseFloat(renewEnergyGWh.toFixed(2)), color: "#22c55e" },
  ];

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
        <div className="grid grid-cols-4 gap-4 shrink-0 h-[15%] min-h-[100px]">
          {/* Metric 1: Total Emissions (Market Based) */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-xs font-medium text-gray-500">Total Scope 2 Emissions (MB)</p>
              <div className="p-1.5 bg-teal-50 rounded-md"><svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-gray-900">{parseFloat(data.marketBasedEmissions).toFixed(2)} <span className="text-xs font-normal text-gray-500">tCO₂e</span></h3>
            </div>
          </div>
          {/* Metric 2: Location Based */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-xs font-medium text-gray-500">Location-based Emissions</p>
              <div className="p-1.5 bg-blue-50 rounded-md"><svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-gray-900">{parseFloat(data.locationBasedEmissions).toFixed(2)} <span className="text-xs font-normal text-gray-500">tCO₂e</span></h3>
            </div>
          </div>
          {/* Metric 3: Renewable Energy */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-xs font-medium text-gray-500">Renewable Energy</p>
              <div className="p-1.5 bg-yellow-50 rounded-md"><svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-gray-900">{energyRenewGWh} <span className="text-xs font-normal text-gray-500">GWh</span></h3>
            </div>
          </div>
          {/* Metric 4: Total Energy */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-xs font-medium text-gray-500">Total Electricity Consumed</p>
              <div className="p-1.5 bg-cyan-50 rounded-md"><svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-gray-900">{energyTotalGWh} <span className="text-xs font-normal text-gray-500">GWh</span></h3>
            </div>
          </div>
        </div>

        {/* Level 2: Charts & Cost & Downloads */}
        <div className="grid grid-cols-12 gap-4 flex-1 h-[40%] min-h-[250px]">
          {/* Pie Chart */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 col-span-4 flex flex-col">
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
                  <span className="text-lg font-bold text-gray-900 block">{parseFloat(energyTotalGWh).toLocaleString()}</span>
                  <span className="text-[10px] text-gray-500 uppercase">GWh Total</span>
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs space-y-1">
              {chartData.map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Projection */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 col-span-4 flex flex-col justify-between">
            <h3 className="text-gray-500 text-xs font-medium">Cost Projection</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Baseline (Grid-only)</span>
                  <p className="text-xl font-bold text-gray-900">₹2.55 Cr</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actual Spend</span>
                  <p className="text-xl font-bold text-gray-900">₹2.16 Cr</p>
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  <span className="text-xs font-medium text-green-800">Total Savings</span>
                </div>
                <p className="text-2xl font-bold text-green-700">₹38.6 Lakhs</p>
                <p className="text-[10px] text-green-600">15% reduction realized through strategic sourcing</p>
              </div>
            </div>
          </div>

          {/* Downloads */}
          <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-xl shadow-sm border border-indigo-100 col-span-4 flex flex-col">
            <h3 className="text-indigo-900 text-xs font-semibold mb-3">Available Reports</h3>
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
              <div
                className={`flex items-center justify-between p-2 bg-white rounded-lg border border-indigo-50 hover:border-indigo-200 transition-colors ${isDownloadingReport ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-medium text-gray-800">Assessment report</p>
                    <p className="text-[10px] text-gray-500">Detailed analysis</p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:text-indigo-800 transition-colors"
                  onClick={handleDownloadReport}
                >
                  {isDownloadingReport ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    "DOWNLOAD"
                  )}
                </span>
              </div>

              <div
                className={`flex items-center justify-between p-2 bg-white rounded-lg border border-indigo-50 hover:border-indigo-200 transition-colors ${isDownloading ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-medium text-gray-800">Verification certificate</p>
                    <p className="text-[10px] text-gray-500">Official proof</p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold text-green-600 cursor-pointer hover:text-green-800 transition-colors"
                  onClick={handleDownloadCertificate}
                >
                  {isDownloading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    "DOWNLOAD"
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-indigo-50 hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-medium text-gray-800">BRSR P6 Report</p>
                    <p className="text-[10px] text-gray-500">SEBI compliant</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-400">PDF</span>
              </div>
            </div>
          </div>
        </div>

        {/* Level 3: AI Insights & Footers */}
        <div className="flex gap-4 h-[25%] shrink-0 min-h-[160px]">
          {/* AI Insights - 70% Width */}
          <div id="ai-insights-section" className="w-[70%] flex flex-col ai-insights-target">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              <h3 className="text-sm font-semibold text-gray-800">Operational AI Insights</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 flex-1">
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

          <div id="next-steps-section" className="w-[30%] bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-center gap-3 next-steps-target">
            <div className="text-center mb-1">
              <h4 className="font-semibold text-gray-900 text-sm">Next Steps</h4>
              <p className="text-[10px] text-gray-500">Complete assessment for other sites</p>
            </div>
            <button onClick={() => router.push('/scope')} className="w-full py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-black transition-opacity text-xs flex items-center justify-center gap-2">
              Continue to next site
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </button>
            <button onClick={() => router.push('/')} className="w-full py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-opacity text-xs border border-gray-200">
              Exit to Dashboard
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
                  period <span className="font-semibold not-italic">{data.reportingYear}</span>{" "}
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

    </>
  );
}

export default function ScopeDashboardPage() {
  return (
    <main id="dashboard-container" className="h-screen flex flex-col bg-gray-50 p-4 md:p-6 overflow-hidden font-sans text-gray-800">
      <Suspense fallback={<div>Loading...</div>}>
        <CertificateContent />
      </Suspense>
    </main>
  );
}
