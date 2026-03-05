"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TARIFF_DATA, TariffRate } from "../lib/electricityTariffData";
import Combobox from "./Combobox";
import { upload } from '@vercel/blob/client';

const STATE_OPTIONS = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

type YesNo = "Yes" | "No" | "";

type MonthlyEntry = {
  id: string;
  month: string;
  electricityPurchased: string;
  dataSourceType: string;
  energyConsumption: string;
  spend: string;
};

type FormDataType = {
  // User Identity (Passed from previous steps)
  userName: string;
  userEmail: string;
  userMobile: string;
  userCompany: string;
  sector: string;
  natureOfBusiness: string;

  // Page 1 - Box 1
  state: string;
  utilityProvider: string;
  siteCount: string;
  facilityName: string;
  energyIntensityPerRupee: string;

  // Page 1 - Box 2
  renewableProcurement: YesNo;
  onsiteExportedKwh: string;
  netMeteringApplicable: YesNo;

  // Page 1 - Box 3
  reportingYear: Date | null;
  reportingPeriod: "Monthly" | "Quarterly" | "Annually" | "";
  conditionalApproach:
  | "Operational Control"
  | "Equity Share"
  | "Financial Control"
  | "";

  // Page 1 - Box 4
  scopeBoundaryNotes: string;

  // ---------------- PAGE 2 ----------------

  // Page 2 - Box 1 (Energy Activity)
  energyActivityInput: "Monthly" | "Quarterly" | "Yearly" | "";
  energyCategory: string;
  electricityPurchased: string;
  dataSourceType: string;
  energyConsumption: string;
  spendAmount: string;
  trackingType: "Unit consumption" | "Spend amount" | "Both" | "";
  energySupportingEvidenceFile: File | null;
  energySourceDescription: string;

  // Page 2 - Box 2 (Renewable Electricity)
  hasRenewableElectricity: YesNo;
  renewableElectricity: string;
  renewableDataSourceType: string;
  renewableEnergyConsumption: string;
  renewableSupportingEvidenceFile: File | null;
  renewableEnergySourceDescription: string;
  renewableEnergyActivityInput: "Monthly" | "Quarterly" | "Yearly" | "";
  renewableMonthlyData: MonthlyEntry[];

  // Calculated fields
  gridEmissionFactor?: number;
  locationBasedEmissions?: number;
  marketBasedEmissions?: number;
  energyGrid_kJ?: number;
  energyRenew_kJ?: number;
  energyTotal_kJ?: number;

  // Monthly Data
  monthlyData: MonthlyEntry[];
};

function TemplateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState<1 | 2>(1);

  const [formData, setFormData] = useState<FormDataType>({
    // Identity - Initialize from Search Params
    userName: searchParams.get("name") || "",
    userEmail: searchParams.get("email") || "",
    userMobile: searchParams.get("mobile") || "",
    userCompany: searchParams.get("company") || "",
    sector: searchParams.get("sector") || "",
    natureOfBusiness: searchParams.get("natureOfBusiness") || "",

    // Page 1
    state: "",
    utilityProvider: "",
    siteCount: (() => {
      const count = searchParams.get("siteCount");
      const number = searchParams.get("siteCountNumber");
      if (count === "Multiple sites" && number) {
        return number;
      }
      return "1"; // Default for Single Site
    })(),
    facilityName: "",
    energyIntensityPerRupee: "",

    renewableProcurement: "Yes",
    onsiteExportedKwh: "",
    netMeteringApplicable: "Yes",

    reportingYear: null,
    reportingPeriod: "Annually", // Updated to match type
    conditionalApproach: "Operational Control",

    scopeBoundaryNotes: "",

    // Page 2
    energyActivityInput: "Yearly",
    energyCategory: "Grid Electricity", // Set to default disabled value
    electricityPurchased: "",
    dataSourceType: "",
    energyConsumption: "",
    spendAmount: "",
    trackingType: "Unit consumption",
    energySupportingEvidenceFile: null,
    energySourceDescription: "",

    // Page 2 - Box 2
    hasRenewableElectricity: "",
    renewableElectricity: "",
    renewableDataSourceType: "",
    renewableEnergyConsumption: "",
    renewableSupportingEvidenceFile: null,
    renewableEnergySourceDescription: "",
    renewableEnergyActivityInput: "Yearly",
    renewableMonthlyData: [{ id: "r1", month: "", electricityPurchased: "", dataSourceType: "", energyConsumption: "", spend: "" }],

    // Calculated fields
    gridEmissionFactor: 0,
    locationBasedEmissions: 0,
    marketBasedEmissions: 0,
    energyGrid_kJ: 0,
    energyRenew_kJ: 0,
    energyTotal_kJ: 0,

    // Initialize with one empty row
    monthlyData: [{ id: "1", month: "", electricityPurchased: "", dataSourceType: "", energyConsumption: "", spend: "" }],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedFormData = sessionStorage.getItem("scopeFormData");
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData);
        if (parsed.reportingYear) {
          parsed.reportingYear = new Date(parsed.reportingYear);
        }
        setFormData((prev) => ({ ...prev, ...parsed }));
      } catch (e) { }
    }
    const savedPage = sessionStorage.getItem("scopeFormPage");
    if (savedPage) {
      setPage(Number(savedPage) as 1 | 2);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem("scopeFormData", JSON.stringify(formData));
    }
  }, [formData, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem("scopeFormPage", String(page));
    }
  }, [page, isLoaded]);

  // Countdown Logic
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  const [isCheckingTime, setIsCheckingTime] = useState(true);

  useEffect(() => {
    const checkTime = () => {
      const assignmentDate = searchParams.get("assignmentDate");
      const assignmentTime = searchParams.get("assignmentTime");

      if (!assignmentDate || !assignmentTime) {
        setIsCheckingTime(false);
        return; // Allow access if params are missing (legacy or direct access)
      }

      // Combine date and time string
      // Format: "Month DD, YYYY" and "HH:MM AM/PM"
      const dateString = `${assignmentDate} ${assignmentTime}`;
      const targetDate = new Date(dateString);

      if (isNaN(targetDate.getTime())) {
        // If parsing fails, allow access
        setIsCheckingTime(false);
        return;
      }

      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          total: difference
        });
      } else {
        setTimeLeft(null);
      }
      setIsCheckingTime(false);
    };

    checkTime();
    const timer = setInterval(checkTime, 1000);

    return () => clearInterval(timer);
  }, [searchParams]);

  // If we are still checking or if there is time left, show the countdown screen
  if (isCheckingTime) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (timeLeft && timeLeft.total > 0) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
            Assessment Not Started
          </h1>

          <p className="text-gray-500 mb-8 text-sm">
            Your assessment is scheduled to begin on <br />
            <span className="font-semibold text-gray-800">
              {searchParams.get("assignmentDate")} at {searchParams.get("assignmentTime")}
            </span>
          </p>

          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-2xl font-bold text-indigo-600">{timeLeft.days}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Days</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-2xl font-bold text-indigo-600">{timeLeft.hours}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Hours</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-2xl font-bold text-indigo-600">{timeLeft.minutes}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Mins</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-2xl font-bold text-indigo-600">{timeLeft.seconds}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Secs</span>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            The assessment will automatically load when the timer reaches zero.
          </p>
        </div>
      </div>
    );
  }

  // Year-wise Grid Emission Factors (kg CO2e/kWh)
  const GRID_EMISSION_FACTORS: Record<string, number> = {
    "2013-14": 0.774,
    "2014-15": 0.779,
    "2015-16": 0.774,
    "2016-17": 0.770,
    "2017-18": 0.754,
    "2018-19": 0.744,
    "2019-20": 0.713,
    "2020-21": 0.703,
    "2021-22": 0.715,
    "2022-23": 0.716,
    "2023-24": 0.722,
    "2024-25": 0.710,
  };

  // Helper to map Year Y to Financial Year String
  const getFinancialYear = (date: Date | null): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const shortNextYear = (year + 1) % 100;
    return `${year}-${shortNextYear}`; // e.g. "2023-24"
  };

  // Helper function to perform calculations
  const calculateScope2 = (
    electricityPurchased: string,
    renewableElectricity: string,
    reportingYear: Date | null
  ) => {
    const B = parseFloat(electricityPurchased) || 0; // Grid electricity (kWh)
    const C = parseFloat(renewableElectricity) || 0; // Renewable electricity (kWh)
    const A = B + C; // Total electricity

    const yearStr = getFinancialYear(reportingYear);
    // Use the latest factor if year is not found (e.g. future years)
    // For years > 2025, we use the 2024-25 value (0.710)
    const EF_grid = GRID_EMISSION_FACTORS[yearStr] || GRID_EMISSION_FACTORS["2024-25"];
    const EF_renew = 0; // Assuming renewable EF is 0

    // Energy calculations (kJ)
    const Energy_grid_kJ = B * 3600;
    const Energy_renew_kJ = C * 3600;
    const Energy_total_kJ = A * 3600;

    // Location-Based Emissions (tonnes)
    // LB_t = (A * EF_grid) / 1000
    const LB_t = parseFloat(((A * EF_grid) / 1000).toFixed(2));

    // Market-Based Emissions (tonnes)
    // MB_total = ((C * EF_renew) + (B * EF_grid)) / 1000
    const MB_total = parseFloat((((C * EF_renew) + (B * EF_grid)) / 1000).toFixed(2));

    return {
      gridEmissionFactor: EF_grid,
      energyGrid_kJ: Energy_grid_kJ,
      energyRenew_kJ: Energy_renew_kJ,
      energyTotal_kJ: Energy_total_kJ,
      locationBasedEmissions: LB_t,
      marketBasedEmissions: MB_total,
    };
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updates: Partial<FormDataType> = { [name]: value };

      // Helper to get Price
      const getPrice = (s: string, u: string): number | null => {
        if (!s || !TARIFF_DATA[s]) return null;
        const data = TARIFF_DATA[s];
        if ("p" in data) return (data as TariffRate).p;
        if (u && data[u as keyof typeof data]) return (data[u as keyof typeof data] as TariffRate).p;
        return null;
      };

      // Reset utility provider if state changes
      if (name === "state") {
        updates.utilityProvider = "";
        // If the new state has only one option (no sub-utilities), we might want to conceptually select it, 
        // but our logic handles "p" in data directly.
      }

      // Auto-calculate Consumption from Spend
      if (name === "spendAmount") {
        const spend = parseFloat(value);
        const stateToUse = prev.state; // State is on Page 1, so stable here
        const utilityToUse = prev.utilityProvider;
        const price = getPrice(stateToUse, utilityToUse);

        if (!isNaN(spend) && price) {
          const consumption = spend / price;
          updates.electricityPurchased = consumption.toFixed(2);
          // Also update energy cons (GJ)
          updates.energyConsumption = (consumption * 0.0036).toFixed(2);
        }
      }

      // Auto-calculate Energy Consumption (GJ) if Electricity Purchased (kWh) changes (and user manually enters it)
      // Conversion: 1 kWh = 0.0036 GJ
      if (name === "electricityPurchased") {
        const kwh = parseFloat(value);
        if (!isNaN(kwh)) {
          const gj = kwh * 0.0036;
          updates.energyConsumption = gj.toFixed(2);
        } else {
          updates.energyConsumption = "";
        }
      }

      // Auto-calculate Renewable Energy Consumption (GJ) if Renewable Electricity (kWh) changes
      if (name === "renewableElectricity") {
        const kwh = parseFloat(value);
        if (!isNaN(kwh)) {
          const gj = kwh * 0.0036;
          updates.renewableEnergyConsumption = gj.toFixed(2);
        } else {
          updates.renewableEnergyConsumption = "";
        }
      }

      // Trigger Scope 2 Calculations
      // We need the *latest* values of inputs involved in calculation.
      // Since state updates are batched, we use the 'value' for the field currently being changed,
      // and 'prev' values for others.
      let currentElec = prev.electricityPurchased;
      let currentRenew = prev.renewableElectricity;
      let currentYear = prev.reportingYear;
      // let currentState = prev.state;
      // let currentUtility = prev.utilityProvider;

      if (name === "electricityPurchased") currentElec = value;
      if (name === "renewableElectricity") currentRenew = value;
      // if (name === "reportingYear") ... (handled in DatePicker)
      // if (name === "state") currentState = value;
      // if (name === "utilityProvider") currentUtility = value;
      if (name === "spendAmount" && updates.electricityPurchased) currentElec = updates.electricityPurchased;

      const results = calculateScope2(currentElec, currentRenew, currentYear);

      return { ...prev, ...updates, ...results } as FormDataType;
    });

    // Clear error for the field being edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const generateQuarterlyDataForYear = (date: Date | null): MonthlyEntry[] => {
    if (!date) return [{ id: Math.random().toString(36).substr(2, 9), month: "", electricityPurchased: "", dataSourceType: "", energyConsumption: "", spend: "" }];
    const year = date.getFullYear();
    const result: MonthlyEntry[] = [];
    for (let i = 0; i < 4; i++) {
      result.push({
        id: Math.random().toString(36).substr(2, 9),
        month: `Q${i + 1} ${year}-${String(year + 1).slice(-2)}`,
        electricityPurchased: "",
        dataSourceType: "",
        energyConsumption: "",
        spend: ""
      });
    }
    return result;
  };

  const generateMonthlyDataForYear = (date: Date | null): MonthlyEntry[] => {
    if (!date) return [{ id: Math.random().toString(36).substr(2, 9), month: "", electricityPurchased: "", dataSourceType: "", energyConsumption: "", spend: "" }];
    const year = date.getFullYear();
    const result: MonthlyEntry[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(year, 3 + i, 1);
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, "0");
      result.push({
        id: Math.random().toString(36).substr(2, 9),
        month: `${yStr}-${mStr}`, // YYYY-MM format
        electricityPurchased: "",
        dataSourceType: "",
        energyConsumption: "",
        spend: ""
      });
    }
    return result;
  };

  const handleRadioChange = (name: keyof FormDataType, value: any) => {
    setFormData((prev) => {
      let updates: Partial<FormDataType> = { [name]: value };

      if (name === "trackingType" && prev.trackingType !== value) {
        updates = {
          ...updates,
          electricityPurchased: "",
          dataSourceType: "",
          energyConsumption: "",
          spendAmount: "",
          monthlyData: prev.monthlyData.map((row) => ({
            ...row,
            electricityPurchased: "",
            dataSourceType: "",
            energyConsumption: "",
            spend: "",
          })),
        };
      }

      if (name === "energyActivityInput" && prev.energyActivityInput !== value) {
        updates = {
          ...updates,
          electricityPurchased: "",
          dataSourceType: "",
          energyConsumption: "",
          spendAmount: "",
        };
        if (value === "Monthly" && prev.reportingPeriod !== "Monthly") {
          updates.monthlyData = generateMonthlyDataForYear(prev.reportingYear);
        } else if (value === "Quarterly") {
          updates.monthlyData = generateQuarterlyDataForYear(prev.reportingYear);
        } else {
          updates.monthlyData = [{ id: Math.random().toString(36).substr(2, 9), month: "", electricityPurchased: "", dataSourceType: "", energyConsumption: "", spend: "" }];
        }
      }

      if (name === "hasRenewableElectricity" && value === "Yes" && prev.hasRenewableElectricity !== "Yes") {
        updates.renewableEnergyActivityInput = "Yearly";
      }

      let currentElec = updates.electricityPurchased !== undefined ? updates.electricityPurchased : prev.electricityPurchased;
      let currentRenew = updates.renewableElectricity !== undefined ? updates.renewableElectricity : prev.renewableElectricity;

      const results = calculateScope2(currentElec, currentRenew, prev.reportingYear);

      return { ...prev, ...updates, ...results } as FormDataType;
    });
  };

  const handleStateChange = (value: string) => {
    setFormData((prev) => {
      const updates: Partial<FormDataType> = { state: value };
      // Reset utility provider if state changes
      if (prev.state !== value) {
        updates.utilityProvider = "";
      }
      return { ...prev, ...updates };
    });
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "energySupportingEvidenceFile" | "renewableSupportingEvidenceFile"
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFormData((prev) => ({ ...prev, [fieldName]: null }));
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
      return;
    }

    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, [fieldName]: "Invalid file type. Please upload a PDF, JPG, or PNG." }));
      setFormData((prev) => ({ ...prev, [fieldName]: null }));
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [fieldName]: "File size exceeds 10MB limit." }));
      setFormData((prev) => ({ ...prev, [fieldName]: null }));
      e.target.value = "";
      return;
    }

    setFormData((prev) => ({ ...prev, [fieldName]: file }));
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));
  };


  const validate = () => {
    const newErrors: Record<string, string> = {};
    const missingFields: string[] = [];

    // Helper for numeric validation
    const isValidNumber = (val: string) => {
      if (!val || !val.trim()) return false;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    };

    // Page 1 validations
    if (page === 1) {
      if (!formData.state?.trim()) {
        newErrors.state = "State is required";
        missingFields.push("State / Grid Region");
      }

      // Utility check
      if (formData.state && TARIFF_DATA[formData.state] && !("p" in TARIFF_DATA[formData.state])) {
        if (!formData.utilityProvider?.trim()) {
          newErrors.utilityProvider = "Utility Provider is required";
          missingFields.push("Utility Provider");
        }
      }

      if (!formData.siteCount?.trim()) {
        newErrors.siteCount = "Site Count is required";
        missingFields.push("Site Count");
      } else if (!isValidNumber(formData.siteCount)) {
        newErrors.siteCount = "Please enter a valid number";
        missingFields.push("Site Count (Invalid Number)");
      }

      if (!formData.facilityName?.trim()) {
        newErrors.facilityName = "Facility Name is required";
        missingFields.push("Facility Name");
      } else if (/\d/.test(formData.facilityName)) {
        newErrors.facilityName = "Please enter a valid string (no numbers)";
        missingFields.push("Facility Name (No Numbers)");
      }


      if (formData.onsiteExportedKwh && !isValidNumber(formData.onsiteExportedKwh)) {
        newErrors.onsiteExportedKwh = "Please enter a valid positive number";
        missingFields.push("On-site Generation");
      }

      if (!formData.netMeteringApplicable) {
        newErrors.netMeteringApplicable = "Please select an option";
        missingFields.push("Net Metering Applicable");
      }

      if (!formData.reportingYear) {
        newErrors.reportingYear = "Reporting Year is required";
        missingFields.push("Reporting Year");
      }
      if (!formData.reportingPeriod) {
        newErrors.reportingPeriod = "Reporting Period is required";
        missingFields.push("Reporting Period");
      }
      if (!formData.conditionalApproach) {
        newErrors.conditionalApproach = "Conditional Approach is required";
        missingFields.push("Consolidation Approach");
      }
    }

    if (page === 2) {
      // Page 2 validations
      if (!formData.energyActivityInput) {
        newErrors.energyActivityInput = "Required";
        missingFields.push("Energy Activity Input");
      }
      if (!formData.energyCategory?.trim()) {
        newErrors.energyCategory = "Required";
        missingFields.push("Energy Category");
      }
      if (!formData.trackingType) {
        newErrors.trackingType = "Required";
        missingFields.push("Tracking Type");
      }

      // Validation Branching based on Monthly vs Yearly
      if (formData.energyActivityInput === "Yearly") {
        if (formData.trackingType === "Unit consumption" || formData.trackingType === "Both") {
          if (!formData.electricityPurchased?.trim()) {
            newErrors.electricityPurchased = "Required";
            missingFields.push("Electricity Purchased");
          } else if (!isValidNumber(formData.electricityPurchased)) {
            newErrors.electricityPurchased = "Invalid number";
            missingFields.push("Electricity Purchased (Invalid)");
          }

          if (!formData.dataSourceType?.trim()) {
            newErrors.dataSourceType = "Required";
            missingFields.push("Data Source Type");
          }

          if (!formData.energyConsumption?.trim()) {
            newErrors.energyConsumption = "Required";
            missingFields.push("Energy Consumption");
          } else if (!isValidNumber(formData.energyConsumption)) {
            newErrors.energyConsumption = "Invalid number";
            missingFields.push("Energy Consumption (Invalid)");
          }
        }

        if (formData.trackingType === "Spend amount" || formData.trackingType === "Both") {
          if (!formData.spendAmount?.trim()) {
            newErrors.spendAmount = "Required";
            missingFields.push("Spend Amount");
          } else if (!isValidNumber(formData.spendAmount)) {
            newErrors.spendAmount = "Invalid number";
            missingFields.push("Spend Amount (Invalid)");
          }
        }
      } else if ((formData.energyActivityInput === "Monthly" || formData.energyActivityInput === "Quarterly")) {
        // Validation for Monthly Data
        if (formData.monthlyData.length === 0) {
          missingFields.push("At least one monthly entry is required");
        } else {
          let rowError = false;
          formData.monthlyData.forEach((row, idx) => {
            if (formData.trackingType === "Unit consumption" || formData.trackingType === "Both") {
              if (!isValidNumber(row.electricityPurchased)) {
                newErrors[`monthly_${row.id}_electricityPurchased`] = "Required";
                missingFields.push(`Row ${idx + 1}: Electricity Purchased`);
                rowError = true;
              }
              if (!row.dataSourceType?.trim()) {
                newErrors[`monthly_${row.id}_dataSourceType`] = "Required";
                missingFields.push(`Row ${idx + 1}: Data Source Type`);
                rowError = true;
              }
              if (!isValidNumber(row.energyConsumption)) {
                newErrors[`monthly_${row.id}_energyConsumption`] = "Required";
                missingFields.push(`Row ${idx + 1}: Energy Consumption`);
                rowError = true;
              }
            }
            if (formData.trackingType === "Spend amount" || formData.trackingType === "Both") {
              if (!isValidNumber(row.spend)) {
                newErrors[`monthly_${row.id}_spend`] = "Required";
                missingFields.push(`Row ${idx + 1}: Spend Amount`);
                rowError = true;
              }
            }
          });
          if (rowError) {
            newErrors.monthlyData = "Please check monthly entries";
          }
        }
      }

      if (!formData.hasRenewableElectricity) {
        newErrors.hasRenewableElectricity = "Required";
        missingFields.push("Renewable Electricity (Yes/No)");
      }

      // Page 2 - Box 2 Validation
      if (page === 2 && formData.hasRenewableElectricity === "Yes") {
        if ((formData.renewableEnergyActivityInput === "Monthly" || formData.renewableEnergyActivityInput === "Quarterly")) {
          let hasError = false;
          formData.renewableMonthlyData.forEach((row) => {
            if (!row.month) {
              hasError = true;
              // You might want to set specific row errors here if your UI supports it,
              // but for now we'll just flag the general error.
            }
            if (!row.electricityPurchased || !isValidNumber(row.electricityPurchased)) {
              hasError = true;
            }
            if (!row.dataSourceType?.trim()) {
              hasError = true;
            }
          });

          if (hasError) {
            // You might want to assign specific error keys to highlight rows
            // using a naming convention like `renewable_monthly_${row.id}_field`
            // For now, let's just push a general message if we don't have row-level error display logic ready for renewable
            // OR better: implement row-level validation keys
            missingFields.push("Renewable Monthly Data (Check all fields)");
            // To make it robust:
            /*
            formData.renewableMonthlyData.forEach(row => {
               if(!row.month) newErrors[`renewable_monthly_${row.id}_month`] = "Required";
               if(!row.electricityPurchased) newErrors[`renewable_monthly_${row.id}_electricityPurchased`] = "Required";
            })
            */
          }
        } else {
          // Yearly Validation
          if (!formData.renewableElectricity?.trim()) {
            newErrors.renewableElectricity = "Required";
            missingFields.push("Renewable Electricity");
          } else if (!isValidNumber(formData.renewableElectricity)) {
            newErrors.renewableElectricity = "Invalid number";
            missingFields.push("Renewable Electricity (Invalid)");
          }

          if (!formData.renewableDataSourceType?.trim()) {
            newErrors.renewableDataSourceType = "Required";
            missingFields.push("Renewable Data Source Type");
          }

          if (!formData.renewableEnergyConsumption?.trim()) {
            newErrors.renewableEnergyConsumption = "Required";
            missingFields.push("Renewable Energy Consumption");
          } else if (!isValidNumber(formData.renewableEnergyConsumption)) {
            newErrors.renewableEnergyConsumption = "Invalid number";
            missingFields.push("Renewable Energy Consumption (Invalid)");
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && missingFields.length === 0;
  };

  const handleAddRow = () => {
    setFormData((prev) => ({
      ...prev,
      monthlyData: [
        ...prev.monthlyData,
        { id: Math.random().toString(36).substr(2, 9), month: "", electricityPurchased: "", dataSourceType: "", energyConsumption: "", spend: "" },
      ],
    }));
  };

  const handleDeleteRow = (id: string) => {
    if (formData.monthlyData.length <= 1) return; // Prevent deleting the last row
    setFormData((prev) => {
      const newData = prev.monthlyData.filter((row) => row.id !== id);
      const { totalConsumption, totalSpend, totalEnergy } = calculateTotals(newData);

      // Recalculate Scope 2 emissions with new total electricity
      const emissionResults = calculateScope2(totalConsumption, prev.renewableElectricity, prev.reportingYear);

      return {
        ...prev,
        monthlyData: newData,
        electricityPurchased: totalConsumption,
        energyConsumption: totalEnergy,
        spendAmount: totalSpend,
        ...emissionResults,
      };
    });
  };

  const calculateTotals = (data: MonthlyEntry[]) => {
    let totalElectricity = 0;
    let totalSpend = 0;

    data.forEach((row) => {
      const elec = parseFloat(row.electricityPurchased) || 0;
      const spend = parseFloat(row.spend) || 0;
      totalElectricity += elec;
      totalSpend += spend;
    });

    const totalConsumption = totalElectricity > 0 ? totalElectricity.toString() : "";
    const totalEnergy = totalElectricity > 0 ? (totalElectricity * 0.0036).toFixed(2) : "";

    return {
      totalConsumption,
      totalSpend: totalSpend > 0 ? totalSpend.toString() : "",
      totalEnergy,
    };
  };

  // Helper to get Price for row calculation
  const getRowPrice = (): number | null => {
    if (!formData.state || !TARIFF_DATA[formData.state]) return null;
    const data = TARIFF_DATA[formData.state];
    if ("p" in data) return (data as TariffRate).p;
    if (formData.utilityProvider && data[formData.utilityProvider as keyof typeof data]) return (data[formData.utilityProvider as keyof typeof data] as TariffRate).p;
    return null;
  };

  const handleRowChange = (id: string, field: keyof MonthlyEntry, value: string) => {
    setFormData((prev) => {
      const newData = prev.monthlyData.map((row) => {
        if (row.id !== id) return row;

        const updatedRow = { ...row, [field]: value };

        // Auto-calculate Energy Consumption (GJ) if Electricity Purchased (kWh) changes
        if (field === "electricityPurchased") {
          const kwh = parseFloat(value);
          if (!isNaN(kwh)) {
            const gj = kwh * 0.0036;
            updatedRow.energyConsumption = gj.toFixed(2);
          } else {
            updatedRow.energyConsumption = "";
          }
        }

        // Auto-calc from Spend in Monthly Row
        if (field === "spend") {
          const spendVal = parseFloat(value);
          const price = getRowPrice();
          if (!isNaN(spendVal) && price) {
            const calculatedKwh = spendVal / price;
            updatedRow.electricityPurchased = calculatedKwh.toFixed(2);
            updatedRow.energyConsumption = (calculatedKwh * 0.0036).toFixed(2);
          }
        }

        return updatedRow;
      });

      // Auto-calculate totals
      const { totalConsumption, totalSpend, totalEnergy } = calculateTotals(newData);

      // Recalculate Scope 2 emissions with new total electricity
      const emissionResults = calculateScope2(totalConsumption, prev.renewableElectricity, prev.reportingYear);

      return {
        ...prev,
        monthlyData: newData,
        electricityPurchased: totalConsumption,
        energyConsumption: totalEnergy,
        spendAmount: totalSpend,
        ...emissionResults,
      };
    });
  };

  // Helper to prepare chart data for monthly view
  const prepareMonthlyChartData = (gridData: MonthlyEntry[], renewData: MonthlyEntry[], hasRenewable: string, renewInput: string) => {
    const monthMap = new Map<string, { grid: number, renewable: number }>();

    gridData.forEach(item => {
      if (item.month) {
        const val = parseFloat(item.electricityPurchased) || 0;
        if (!monthMap.has(item.month)) monthMap.set(item.month, { grid: 0, renewable: 0 });
        monthMap.get(item.month)!.grid += val;
      }
    });

    if (hasRenewable === "Yes" && renewInput === "Monthly") {
      renewData.forEach(item => {
        if (item.month) {
          const val = parseFloat(item.electricityPurchased) || 0;
          if (!monthMap.has(item.month)) monthMap.set(item.month, { grid: 0, renewable: 0 });
          monthMap.get(item.month)!.renewable += val;
        }
      });
    }

    return Array.from(monthMap.entries())
      .filter(([_, data]) => data.grid > 0 || data.renewable > 0)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([monthStr, data]) => {
        let monthLabel = monthStr;
        if (!monthStr.startsWith("Q") && monthStr.includes("-")) {
          const date = new Date(monthStr + "-01");
          if (!isNaN(date.getTime())) {
            monthLabel = date.toLocaleDateString('default', { month: 'short', year: '2-digit' });
          }
        }
        return {
          name: monthLabel,
          Grid: parseFloat(data.grid.toFixed(2)),
          Renewable: parseFloat(data.renewable.toFixed(2))
        };
      });
  };

  // --- Renewable Monthly Handlers ---

  const calculateRenewableTotals = (data: MonthlyEntry[]) => {
    let totalElectricity = 0;

    data.forEach((row) => {
      const elec = parseFloat(row.electricityPurchased) || 0;
      totalElectricity += elec;
    });

    const totalConsumption = totalElectricity > 0 ? totalElectricity.toString() : "";
    const totalEnergy = totalElectricity > 0 ? (totalElectricity * 0.0036).toFixed(2) : "";

    return {
      totalConsumption,
      totalEnergy,
    };
  };

  const handleAddRenewableRow = () => {
    setFormData((prev) => ({
      ...prev,
      renewableMonthlyData: [
        ...prev.renewableMonthlyData,
        { id: Math.random().toString(36).substr(2, 9), month: "", electricityPurchased: "", dataSourceType: "", energyConsumption: "", spend: "" },
      ],
    }));
  };

  const handleDeleteRenewableRow = (id: string) => {
    if (formData.renewableMonthlyData.length <= 1) return;
    setFormData((prev) => {
      const newData = prev.renewableMonthlyData.filter((row) => row.id !== id);
      const { totalConsumption, totalEnergy } = calculateRenewableTotals(newData);

      const emissionResults = calculateScope2(prev.electricityPurchased, totalConsumption, prev.reportingYear);

      return {
        ...prev,
        renewableMonthlyData: newData,
        renewableElectricity: totalConsumption,
        renewableEnergyConsumption: totalEnergy,
        ...emissionResults,
      };
    });
  };

  const handleRenewableRowChange = (id: string, field: keyof MonthlyEntry, value: string) => {
    setFormData((prev) => {
      const newData = prev.renewableMonthlyData.map((row) => {
        if (row.id !== id) return row;

        const updatedRow = { ...row, [field]: value };

        if (field === "electricityPurchased") {
          const kwh = parseFloat(value);
          if (!isNaN(kwh)) {
            const gj = kwh * 0.0036;
            updatedRow.energyConsumption = gj.toFixed(2);
          } else {
            updatedRow.energyConsumption = "";
          }
        }

        return updatedRow;
      });

      const { totalConsumption, totalEnergy } = calculateRenewableTotals(newData);
      const emissionResults = calculateScope2(prev.electricityPurchased, totalConsumption, prev.reportingYear);

      return {
        ...prev,
        renewableMonthlyData: newData,
        renewableElectricity: totalConsumption,
        renewableEnergyConsumption: totalEnergy,
        ...emissionResults,
      };
    });
  };

  const handleNext = () => {
    if (validate()) {
      setPage(2);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Prepare data for API (convert File objects to filenames)
      let energyEvidanceUrl = "";
      let renewableEvidanceUrl = "";

      const uploadTasks: Promise<void>[] = [];

      if (formData.energySupportingEvidenceFile instanceof File) {
        const file = formData.energySupportingEvidenceFile;
        uploadTasks.push(
          upload(file.name, file, { access: 'private', handleUploadUrl: '/api/evidence/upload' })
            .then(({ url }) => {
              energyEvidanceUrl = `${window.location.origin}/api/evidence/download?url=${encodeURIComponent(url)}`;
            })
            .catch((error: any) => {
              console.error("Vercel blob upload error:", error);
              throw new Error(`Energy evidence upload failed: ${error.message || "Unknown error"}`);
            })
        );
      }

      if (formData.renewableSupportingEvidenceFile instanceof File) {
        const file = formData.renewableSupportingEvidenceFile;
        uploadTasks.push(
          upload(file.name, file, { access: 'private', handleUploadUrl: '/api/evidence/upload' })
            .then(({ url }) => {
              renewableEvidanceUrl = `${window.location.origin}/api/evidence/download?url=${encodeURIComponent(url)}`;
            })
            .catch((error: any) => {
              console.error("Vercel blob upload error:", error);
              throw new Error(`Renewable evidence upload failed: ${error.message || "Unknown error"}`);
            })
        );
      }

      // Wait for all uploads to complete in parallel
      if (uploadTasks.length > 0) {
        await Promise.all(uploadTasks);
      }

      // Moved API saving logic to review page to decrease click-to-load latency

      // Save to LocalStorage for Review Page (to avoid URL limits)
      const reviewData = {
        ...formData,
        reportingYear: formData.reportingYear ? formData.reportingYear.toISOString() : null,
        energySupportingEvidenceFile: formData.energySupportingEvidenceFile ? formData.energySupportingEvidenceFile.name : null,
        energySupportingEvidenceFileUrl: energyEvidanceUrl || null,
        renewableSupportingEvidenceFile: formData.renewableSupportingEvidenceFile ? formData.renewableSupportingEvidenceFile.name : null,
        renewableSupportingEvidenceFileUrl: renewableEvidanceUrl || null,
      };
      localStorage.setItem("scope2ReviewData", JSON.stringify(reviewData));

      router.push(`/scope/review`);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error instanceof Error ? error.message : "Failed to submit form. Please try again.");
      setIsSubmitting(false);
    }
  };

  const monthlyChartData = prepareMonthlyChartData(formData.monthlyData, formData.renewableMonthlyData, formData.hasRenewableElectricity, formData.renewableEnergyActivityInput);

  let derivedGridKWh = 0;
  let derivedRenewKWh = 0;

  if ((formData.energyActivityInput === "Monthly" || formData.energyActivityInput === "Quarterly")) {
    derivedGridKWh = formData.monthlyData.reduce((sum, row) => sum + (parseFloat(row.electricityPurchased) || 0), 0);
  } else {
    derivedGridKWh = parseFloat(formData.electricityPurchased) || 0;
  }

  if (formData.hasRenewableElectricity === "Yes") {
    if ((formData.renewableEnergyActivityInput === "Monthly" || formData.renewableEnergyActivityInput === "Quarterly")) {
      derivedRenewKWh = formData.renewableMonthlyData.reduce((sum, row) => sum + (parseFloat(row.electricityPurchased) || 0), 0);
    } else {
      derivedRenewKWh = parseFloat(formData.renewableElectricity) || 0;
    }
  }

  const derivedGridGW = derivedGridKWh;
  const derivedRenewGW = derivedRenewKWh;
  const derivedTotalGW = derivedGridGW + derivedRenewGW;

  const renderYesNo = (name: keyof FormDataType, value: YesNo) => (
    <div className={`flex flex-col sm:flex-row h-auto sm:h-10 bg-gray-50 p-1 rounded-lg w-full border ${errors[name] ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
      <button
        type="button"
        onClick={() => handleRadioChange(name, "Yes")}
        className={`flex-1 h-full flex items-center justify-center rounded-md text-sm font-medium transition-all ${value === "Yes"
          ? "bg-[#4F46E5] text-white shadow-sm"
          : "text-gray-500 hover:text-gray-900"
          }`}
      >
        Yes
      </button>

      {/* Horizontal Divider for Mobile */}
      <div className="w-full h-[1px] bg-gray-300 sm:hidden my-1"></div>

      <button
        type="button"
        onClick={() => handleRadioChange(name, "No")}
        className={`flex-1 h-full flex items-center justify-center rounded-md text-sm font-medium transition-all ${value === "No"
          ? "bg-[#4F46E5] text-white shadow-sm"
          : "text-gray-500 hover:text-gray-900"
          }`}
      >
        No
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-indigo-100 flex flex-col">
      <div className="w-full max-w-[1400px] mx-auto p-4 flex flex-col flex-grow">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-2 gap-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Scope 2 Assessment
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Book your Scope 2 self-assessment
            </h1>
            <p className="text-gray-500 mt-1 text-xs">
              Share a few basic details. Takes about 2 minutes.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-indigo-900 tracking-widest uppercase">
                {page === 1 ? "2 OF 6 - BOUNDARIES" : "3 OF 6 - ENERGY INPUTS"}
              </span>
              <span className="text-sm font-bold text-gray-400">
                {page === 1 ? "34%" : "51%"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: page === 1 ? "34%" : "51%" }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-3 opacity-90">
            <img
              src="/sustally-logo.png"
              alt="sustally"
              className="h-10 w-auto object-contain"
            />
            <div className="flex gap-1 h-12">
              <div className="w-[1px] bg-gray-300 h-full"></div>
            </div>
            <span className="font-medium text-gray-400 text-sm max-w-[200px] leading-tight text-left">
              choose sustally as your sustainability ally
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0">

          {/* ===================== PAGE 1 ===================== */}
          {page === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-1 flex-grow overflow-hidden min-h-0">

              {/* Box 1: Define Reporting Boundary */}
              <section className="bg-white rounded-xl p-2 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col lg:h-full lg:overflow-y-auto">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 border-b-2 border-transparent hover:border-indigo-100 transition-colors cursor-default">
                    Define your reporting boundary
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* State */}
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      State / Grid Region <span className="text-red-500">*</span>
                    </label>
                    <Combobox
                      options={STATE_OPTIONS}
                      value={formData.state}
                      onChange={handleStateChange}
                      placeholder="Select grid region..."
                      error={!!errors.state}
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      Select the grid region where this site operates
                    </p>
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                  </div>

                  {/* Utility Provider (Conditional) */}
                  {formData.state && TARIFF_DATA[formData.state] && !("p" in TARIFF_DATA[formData.state]) && (
                    <div className="col-span-1 animate-in fade-in slide-in-from-top-2">
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        Utility Provider <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="utilityProvider"
                        value={formData.utilityProvider || ""}
                        onChange={handleChange}
                        className={`w-full h-10 px-2 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none text-gray-600 ${errors.utilityProvider ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                      >
                        <option value="">Select utility...</option>
                        {Object.keys(TARIFF_DATA[formData.state]).map((utility) => (
                          <option key={utility} value={utility}>{utility}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        Select the specific utility for accurate tariffs
                      </p>
                      {errors.utilityProvider && <p className="text-red-500 text-xs mt-1">{errors.utilityProvider}</p>}
                    </div>
                  )}

                  {/* Site Count */}
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Site count
                    </label>
                    <input
                      type="text"
                      name="siteCount"
                      value={formData.siteCount || ""}
                      onChange={handleChange}
                      placeholder="Site 1"
                      className={`w-full h-10 px-2 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.siteCount ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      Based on your earlier input
                    </p>
                    {errors.siteCount && <p className="text-red-500 text-xs mt-1">{errors.siteCount}</p>}
                  </div>

                  {/* Facility Name */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Facility / Site name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="facilityName"
                      value={formData.facilityName || ""}
                      onChange={handleChange}
                      placeholder="e.g., Pune Manufacturing Plant"
                      className={`w-full h-10 px-2 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.facilityName ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      Based on your earlier input
                    </p>
                    {errors.facilityName && <p className="text-red-500 text-xs mt-1">{errors.facilityName}</p>}
                  </div>


                </div>
              </section>

              {/* Box 2: Operational Details */}
              <section className="bg-white rounded-xl p-2 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col lg:h-full lg:overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-yellow-50 rounded-lg text-yellow-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Operational Details <span className="text-red-500">*</span>
                  </h2>
                </div>

                <div className="space-y-2">
                  {/* Energy Intensity Per Rupee */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Turnover of your site <span className="text-gray-400 font-normal ml-1">Optional</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">Rs.</span>
                      <input
                        type="text"
                        name="energyIntensityPerRupee"
                        value={formData.energyIntensityPerRupee || ""}
                        onChange={handleChange}
                        placeholder="e.g., 2000"
                        className="w-full h-10 pl-9 pr-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      Optional input
                    </p>
                  </div>



                  {/* Net metering */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Net metering applicable? <span className="text-red-500">*</span>
                    </label>
                    {renderYesNo("netMeteringApplicable", formData.netMeteringApplicable)}
                    {errors.netMeteringApplicable && <p className="text-red-500 text-xs mt-1">{errors.netMeteringApplicable}</p>}
                  </div>
                </div>
              </section>

              {/* Box 3: Reporting Period */}
              <section className="bg-white rounded-xl p-2 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col lg:h-full lg:overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Reporting period
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {/* Year */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        Financial year <span className="text-red-500">*</span>
                      </label>
                      {formData.reportingPeriod === "Monthly" ? (
                        <DatePicker
                          selected={formData.reportingYear}
                          onChange={(date: Date | null) =>
                            setFormData((prev) => {
                              const newYear = date;
                              // Calculate with new year and current inputs
                              const results = calculateScope2(prev.electricityPurchased, prev.renewableElectricity, newYear);
                              return { ...prev, reportingYear: date, ...results };
                            })
                          }
                          showMonthYearPicker
                          minDate={new Date(2020, 0, 1)}
                          maxDate={new Date(2024, 11, 31)}
                          dateFormat="MM/yyyy"
                          wrapperClassName="w-full"
                          customInput={
                            <button
                              type="button"
                              className={`w-full h-10 flex justify-between items-center px-2 text-xs bg-white border rounded-lg text-gray-700 hover:border-gray-300 focus:ring-2 focus:ring-indigo-500 transition-all ${errors.reportingYear ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                            >
                              {formData.reportingYear
                                ? formData.reportingYear.toLocaleDateString('default', { month: 'short', year: 'numeric' })
                                : "Select Month"}
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          }
                        />
                      ) : (
                        <select
                          value={formData.reportingYear ? formData.reportingYear.getFullYear() : ""}
                          onChange={(e) => {
                            if (!e.target.value) {
                              setFormData((prev) => ({ ...prev, reportingYear: null }));
                              return;
                            }
                            const selectedYear = parseInt(e.target.value);
                            const date = new Date(selectedYear, 0, 1);
                            setFormData((prev) => {
                              let currentElec = prev.electricityPurchased;
                              let currentRenew = prev.renewableElectricity;

                              const updates: any = { ...prev, reportingYear: date };

                              if (prev.energyActivityInput === "Quarterly") {
                                updates.monthlyData = generateQuarterlyDataForYear(date);
                                currentElec = "";
                                updates.electricityPurchased = "";
                                updates.energyConsumption = "";
                                updates.spendAmount = "";
                              } else if (prev.energyActivityInput === "Monthly" && prev.reportingPeriod !== "Monthly") {
                                updates.monthlyData = generateMonthlyDataForYear(date);
                                currentElec = "";
                                updates.electricityPurchased = "";
                                updates.energyConsumption = "";
                                updates.spendAmount = "";
                              }

                              if (prev.renewableEnergyActivityInput === "Quarterly") {
                                updates.renewableMonthlyData = generateQuarterlyDataForYear(date);
                                currentRenew = "";
                                updates.renewableElectricity = "";
                                updates.renewableEnergyConsumption = "";
                              } else if (prev.renewableEnergyActivityInput === "Monthly" && prev.reportingPeriod !== "Monthly") {
                                updates.renewableMonthlyData = generateMonthlyDataForYear(date);
                                currentRenew = "";
                                updates.renewableElectricity = "";
                                updates.renewableEnergyConsumption = "";
                              }

                              const results = calculateScope2(currentElec, currentRenew, date);
                              Object.assign(updates, results);

                              return updates;
                            });
                          }}
                          className={`w-full h-10 px-2 text-xs bg-white border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none text-gray-700 ${errors.reportingYear ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                        >
                          <option value="">Select Financial Year</option>
                          {(() => {
                            const years = [];
                            // 5 years backward from 2024 means 2020 to 2024 inclusive
                            for (let year = 2020; year <= 2024; year++) {
                              years.push(year);
                            }
                            // Sort descending for better UX
                            return years.reverse().map((year) => (
                              <option key={year} value={year}>
                                {year}-{String(year + 1).slice(-2)}
                              </option>
                            ));
                          })()}
                        </select>
                      )}
                      {errors.reportingYear && <p className="text-red-500 text-xs mt-1">{errors.reportingYear}</p>}
                    </div>
                    {/* Period */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        Reporting period <span className="text-red-500">*</span>
                      </label>
                      <div className={`flex flex-col sm:flex-row h-auto sm:h-10 text-xs font-medium bg-gray-50 border rounded-lg p-1 ${errors.reportingPeriod ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                        {["Monthly", "Quarterly", "Annually"].map((p, index) => (
                          <div key={p} className="contents">
                            <button
                              type="button"
                              onClick={() => setFormData(prev => {
                                const updates: any = { ...prev, reportingPeriod: p as any };
                                let currentElec = prev.electricityPurchased;
                                let currentRenew = prev.renewableElectricity;

                                if (p === "Quarterly") {
                                  if (prev.energyActivityInput === "Monthly" || prev.energyActivityInput === "Quarterly") {
                                    updates.energyActivityInput = "Quarterly";
                                    updates.monthlyData = generateQuarterlyDataForYear(prev.reportingYear);
                                    currentElec = ""; updates.electricityPurchased = ""; updates.energyConsumption = ""; updates.spendAmount = "";
                                  }
                                  if (prev.renewableEnergyActivityInput === "Monthly" || prev.renewableEnergyActivityInput === "Quarterly") {
                                    updates.renewableEnergyActivityInput = "Quarterly";
                                    updates.renewableMonthlyData = generateQuarterlyDataForYear(prev.reportingYear);
                                    currentRenew = ""; updates.renewableElectricity = ""; updates.renewableEnergyConsumption = "";
                                  }
                                } else {
                                  if (prev.energyActivityInput === "Monthly" || prev.energyActivityInput === "Quarterly") {
                                    updates.energyActivityInput = "Monthly";
                                    if (p !== "Monthly") {
                                      updates.monthlyData = generateMonthlyDataForYear(prev.reportingYear);
                                    } else {
                                      updates.monthlyData = [{ id: Math.random().toString(36).substr(2, 9), month: "", electricityPurchased: "", dataSourceType: "", energyConsumption: "", spend: "" }];
                                    }
                                    currentElec = ""; updates.electricityPurchased = ""; updates.energyConsumption = ""; updates.spendAmount = "";
                                  }
                                  if (prev.renewableEnergyActivityInput === "Monthly" || prev.renewableEnergyActivityInput === "Quarterly") {
                                    updates.renewableEnergyActivityInput = "Monthly";
                                    if (p !== "Monthly") {
                                      updates.renewableMonthlyData = generateMonthlyDataForYear(prev.reportingYear);
                                    } else {
                                      updates.renewableMonthlyData = [{ id: Math.random().toString(36).substr(2, 9), month: "", electricityPurchased: "", dataSourceType: "", energyConsumption: "", spend: "" }];
                                    }
                                    currentRenew = ""; updates.renewableElectricity = ""; updates.renewableEnergyConsumption = "";
                                  }
                                }

                                const results = calculateScope2(currentElec, currentRenew, prev.reportingYear);
                                Object.assign(updates, results);

                                return updates;
                              })}
                              className={`flex-1 h-full min-h-[32px] flex items-center justify-center rounded text-center transition-all ${formData.reportingPeriod === p
                                ? "bg-[#4F46E5] text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                                }`}
                            >
                              {p}
                            </button>
                            {index < 2 && (
                              <div className="w-full h-[1px] bg-gray-300 sm:hidden my-1"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Consolidation Approach */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-3">
                      Consolidation approach <span className="text-gray-400 font-normal ml-1">(Fixed)</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 opacity-60 pointer-events-none grayscale">
                      {[
                        { id: "Operational Control", label: "Operational control", sub: "Default approach for most organizations", default: true },
                        { id: "Equity Share", label: "Equity share", sub: "Based on ownership percentage" },
                        { id: "Financial Control", label: "Financial control", sub: "Based on financial authority" }
                      ].map((opt) => (
                        <div
                          key={opt.id}
                          className={`relative border rounded-xl p-4 cursor-pointer transition-all hover:border-indigo-300 ${formData.conditionalApproach === opt.id
                            ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500"
                            : errors.conditionalApproach ? "bg-red-50 border-red-300" : "bg-white border-gray-200"
                            }`}
                          onClick={() => setFormData(prev => ({ ...prev, conditionalApproach: opt.id as any }))}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${formData.conditionalApproach === opt.id ? "border-indigo-600" : "border-gray-300"
                              }`}>
                              {formData.conditionalApproach === opt.id && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                            </div>
                            <div>
                              <p className={`text-xs font-bold ${formData.conditionalApproach === opt.id ? "text-indigo-900" : "text-gray-700"}`}>
                                {opt.label}  {opt.default && <span className="text-indigo-500 text-[10px] font-normal">(default)</span>}
                              </p>
                              <p className="text-[10px] text-gray-500 leading-tight mt-1">
                                {opt.sub}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-blue-400 mt-3 font-medium cursor-help">
                      This defines how emissions are attributed
                    </p>
                    {errors.conditionalApproach && <p className="text-red-500 text-xs mt-1">{errors.conditionalApproach}</p>}
                  </div>
                </div>
              </section>

              {/* Box 4: Boundary Notes */}
              <section className="bg-white rounded-xl p-2 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col lg:h-full lg:overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Boundary notes <span className="text-gray-400 font-normal ml-1">Optional</span>
                  </h2>
                </div>

                <div className="flex-grow flex flex-col">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Scope boundary notes
                  </label>
                  <textarea
                    name="scopeBoundaryNotes"
                    value={formData.scopeBoundaryNotes}
                    onChange={handleChange}
                    placeholder="Any special considerations or exclusions?"
                    className="w-full flex-grow px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none min-h-[40px]"
                  />
                </div>
              </section>

            </div>
          )}

          {/* ===================== PAGE 2 ===================== */}
          {page === 2 && (
            <div className="flex-1 overflow-y-auto p-1 pb-4">
              <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 content-start">
                {/* Box 1: Energy Activity */}
                <section className={`bg-white rounded-xl p-2 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col ${formData.renewableProcurement === 'Yes' ? '' : 'lg:col-span-2'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-gray-900">
                      Energy activity
                    </h2>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {/* Activity Input */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          Energy activity input <span className="text-red-500">*</span>
                        </label>
                        <div className={`flex flex-row h-10 bg-gray-50 p-1 rounded-lg border w-fit ${errors.energyActivityInput ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                          {(formData.reportingPeriod === "Quarterly" ? ["Quarterly", "Yearly"] : ["Monthly", "Yearly"]).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => handleRadioChange("energyActivityInput", m)}
                              className={`px-3 h-full flex items-center justify-center rounded-md text-xs font-bold transition-all ${formData.energyActivityInput === m
                                ? "bg-white text-indigo-900 shadow-sm ring-1 ring-gray-100"
                                : "text-gray-400 hover:text-gray-600"
                                }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1.5">
                          Based on your earlier input
                        </p>
                        {errors.energyActivityInput && <p className="text-red-500 text-xs mt-1">{errors.energyActivityInput}</p>}
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          Energy category <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="energyCategory"
                          value={formData.energyCategory}
                          onChange={handleChange}
                          className={`w-full h-10 px-2 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none text-gray-600 ${errors.energyCategory ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                        >
                          <option value="">Select category...</option>
                          <option value="Grid Energy">Grid Energy</option>
                          <option value="Steam">Steam</option>
                          <option value="Heating">Heating</option>
                          <option value="Cooling">Cooling</option>
                        </select>
                        {errors.energyCategory && <p className="text-red-500 text-xs mt-1">{errors.energyCategory}</p>}
                      </div>
                    </div>

                    {/* Tracking Type */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        Are you tracking <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4 items-center flex-wrap">
                        <div className="flex gap-4">
                          {[
                            { id: "Unit consumption", label: "UNIT CONSUMPTION" },
                            { id: "Spend amount", label: "SPEND AMOUNT" },
                            // { id: "Both", label: "BOTH" }
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleRadioChange("trackingType", t.id)}
                              className={`px-4 h-10 flex items-center justify-center rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all border ${formData.trackingType === t.id
                                ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                                : errors.trackingType ? "bg-red-50 text-red-500 border-red-300" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                                }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                        {(formData.state && (formData.trackingType === "Spend amount" || formData.trackingType === "Both")) && (() => {
                          let price = null;
                          if (TARIFF_DATA[formData.state]) {
                            const data = TARIFF_DATA[formData.state];
                            if ("p" in data) price = (data as TariffRate).p;
                            else if (formData.utilityProvider && data[formData.utilityProvider as keyof typeof data]) price = (data[formData.utilityProvider as keyof typeof data] as TariffRate).p;
                          }
                          return (
                            <table className="ml-auto text-left">
                              <tbody>
                                <tr>
                                  <td className="pr-2 text-right py-0.5"><span className="text-xs font-bold text-gray-700">State:</span></td>
                                  <td className="py-0.5"><span className="text-sm font-bold text-gray-800">{formData.state}</span></td>
                                </tr>
                                {price !== null && (
                                  <tr>
                                    <td className="pr-2 text-right py-0.5"><span className="text-xs font-bold text-gray-700">Tariff:</span></td>
                                    <td className="py-0.5"><span className="text-sm font-bold text-gray-800">₹{price}/kWh</span></td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                      {errors.trackingType && <p className="text-red-500 text-xs mt-1">{errors.trackingType}</p>}
                    </div>

                    {/* Dynamic Inputs based on Energy Activity Input */}
                    <div className="mt-4">
                      {(formData.energyActivityInput === "Monthly" || formData.energyActivityInput === "Quarterly") ? (
                        <>
                          <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="w-full text-xs text-left text-gray-700">
                              <thead className="text-[10px] text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="px-3 py-2 font-bold min-w-[130px]">{formData.energyActivityInput === "Quarterly" ? "Quarter" : "Month"}</th>
                                  {(formData.trackingType === "Unit consumption" || formData.trackingType === "Both") && (
                                    <>
                                      <th className="px-3 py-2 font-bold min-w-[130px]">Electricity purchased (<span className="normal-case">kWh</span>)</th>
                                      <th className="px-3 py-2 font-bold min-w-[130px]">Data source type</th>
                                      <th className="px-3 py-2 font-bold min-w-[130px]">Energy Consumption (GJ)</th>
                                    </>
                                  )}
                                  {(formData.trackingType === "Spend amount" || formData.trackingType === "Both") && (
                                    <th className="px-3 py-2 font-bold min-w-[130px]">Spend Amount</th>
                                  )}
                                  {formData.trackingType === "Spend amount" && (
                                    <>
                                      <th className="px-3 py-2 font-bold min-w-[130px]">Electricity purchased (<span className="normal-case">kWh</span>)</th>
                                      <th className="px-3 py-2 font-bold min-w-[130px]">Data source type</th>
                                      <th className="px-3 py-2 font-bold min-w-[130px]">Energy Consumption (GJ)</th>
                                    </>
                                  )}
                                  <th className="px-3 py-2 w-10"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {formData.monthlyData.map((row, index) => (
                                  <tr key={row.id} className="border-b border-gray-100 last:border-none group hover:bg-gray-50/50">
                                    <td className="px-3 py-2">
                                      {formData.energyActivityInput === "Quarterly" ? (
                                        <input
                                          type="text"
                                          value={row.month}
                                          onChange={(e) => handleRowChange(row.id, "month", e.target.value)}
                                          className="w-full h-10 px-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-gray-700 placeholder-gray-400"
                                          placeholder="e.g. Q1 2024"
                                        />
                                      ) : formData.reportingPeriod !== "Monthly" ? (
                                        <div className="w-full h-10 px-2 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800">
                                          {row.month && !row.month.startsWith("Q") ? new Date(row.month + "-01").toLocaleDateString('default', { month: 'short', year: 'numeric' }) : row.month}
                                        </div>
                                      ) : (
                                        <input
                                          type="month"
                                          value={row.month}
                                          onChange={(e) => handleRowChange(row.id, "month", e.target.value)}
                                          className="w-full h-10 px-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-gray-700 placeholder-gray-400"
                                          placeholder="Select month"
                                        />
                                      )}
                                    </td>
                                    {(formData.trackingType === "Unit consumption" || formData.trackingType === "Both") && (
                                      <>
                                        <td className="px-3 py-2">
                                          <div className={`border rounded-lg h-10 px-2 flex items-center bg-gray-50 ${errors[`monthly_${row.id}_electricityPurchased`] ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                                            <input
                                              type="number"
                                              value={row.electricityPurchased}
                                              onChange={(e) => handleRowChange(row.id, "electricityPurchased", e.target.value)}
                                              className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs text-gray-700 placeholder-gray-400"
                                              placeholder="0"
                                            />
                                          </div>
                                        </td>
                                        <td className="px-3 py-2">
                                          <div className={`border rounded-lg h-10 px-2 flex items-center bg-gray-50 ${errors[`monthly_${row.id}_dataSourceType`] ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                                            <select
                                              value={row.dataSourceType}
                                              onChange={(e) => handleRowChange(row.id, "dataSourceType", e.target.value)}
                                              className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs text-gray-700 placeholder-gray-400 appearance-none"
                                            >
                                              <option value="">Select...</option>
                                              <option value="Invoice">Invoice</option>
                                              <option value="Meter Reading">Meter Reading</option>
                                              <option value="Estimate">Estimate</option>
                                              <option value="Other">Other</option>
                                            </select>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2">
                                          <div className={`border rounded-lg h-10 px-2 flex items-center bg-gray-100 ${errors[`monthly_${row.id}_energyConsumption`] ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                                            <input
                                              type="number"
                                              value={row.energyConsumption}
                                              readOnly
                                              className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs text-gray-500 cursor-not-allowed"
                                              placeholder="0"
                                            />
                                          </div>
                                        </td>
                                      </>
                                    )}
                                    {(formData.trackingType === "Spend amount" || formData.trackingType === "Both") && (
                                      <td className="px-3 py-2">
                                        <div className={`border rounded-lg h-10 px-2 flex items-center bg-gray-50 ${errors[`monthly_${row.id}_spend`] ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                                          <input
                                            type="number"
                                            value={row.spend}
                                            onChange={(e) => handleRowChange(row.id, "spend", e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs text-gray-700 placeholder-gray-400"
                                            placeholder="0"
                                          />
                                        </div>
                                      </td>
                                    )}
                                    {formData.trackingType === "Spend amount" && (
                                      <>
                                        <td className="px-3 py-2">
                                          <div className="border rounded-lg h-10 px-2 flex items-center bg-gray-100 border-gray-200">
                                            <input
                                              type="text"
                                              value={row.electricityPurchased ? parseFloat(row.electricityPurchased).toFixed(2) : ""}
                                              readOnly
                                              className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs text-gray-500 cursor-not-allowed"
                                              placeholder="0"
                                            />
                                          </div>
                                        </td>
                                        <td className="px-3 py-2">
                                          <div className={`border rounded-lg h-10 px-2 flex items-center bg-gray-50 ${errors[`monthly_${row.id}_dataSourceType`] ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                                            <select
                                              value={row.dataSourceType}
                                              onChange={(e) => handleRowChange(row.id, "dataSourceType", e.target.value)}
                                              className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs text-gray-700 placeholder-gray-400 appearance-none"
                                            >
                                              <option value="">Select...</option>
                                              <option value="Invoice">Invoice</option>
                                              <option value="Meter Reading">Meter Reading</option>
                                              <option value="Estimate">Estimate</option>
                                              <option value="Other">Other</option>
                                            </select>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2">
                                          <div className="border rounded-lg h-10 px-2 flex items-center bg-gray-100 border-gray-200">
                                            <input
                                              type="text"
                                              value={row.energyConsumption ? parseFloat(row.energyConsumption).toFixed(2) : ""}
                                              readOnly
                                              className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs text-gray-500 cursor-not-allowed"
                                              placeholder="0"
                                            />
                                          </div>
                                        </td>
                                      </>
                                    )}
                                    <td className="px-2 py-2 text-right">
                                      {(formData.reportingPeriod === "Monthly" || formData.energyActivityInput === "Quarterly") && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteRow(row.id)}
                                          className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                          title="Delete row"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {(formData.reportingPeriod === "Monthly" || formData.energyActivityInput === "Quarterly") && (
                              <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
                                <button
                                  type="button"
                                  onClick={handleAddRow}
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  {formData.energyActivityInput === "Quarterly" ? "Add Quarter" : "Add Month"}
                                </button>
                              </div>
                            )}
                          </div> {/* Closing overflow-x-auto div */}
                        </>
                      ) : (
                        // EXISTING YEARLY INPUTS
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {(formData.trackingType === "Unit consumption" || formData.trackingType === "Both") && (
                            <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Electricity Purchased */}
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">
                                  Electricity purchased <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    name="electricityPurchased"
                                    value={formData.electricityPurchased || ""}
                                    onChange={handleChange}
                                    placeholder="Enter value"
                                    className={`w-full h-10 px-2 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${errors.electricityPurchased ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                                  />
                                  <span className="absolute right-3 top-3 text-[10px] text-gray-400">kWh</span>
                                </div>
                                {errors.electricityPurchased && <p className="text-red-500 text-xs mt-1">{errors.electricityPurchased}</p>}
                              </div>

                              {/* Data Source Type */}
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">
                                  Data source type <span className="text-red-500">*</span>
                                </label>
                                <select
                                  name="dataSourceType"
                                  value={formData.dataSourceType || ""}
                                  onChange={handleChange}
                                  className={`w-full h-10 px-2 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none ${errors.dataSourceType ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                                >
                                  <option value="">Select data source...</option>
                                  <option value="Invoice">Invoice</option>
                                  <option value="Meter Reading">Meter Reading</option>
                                  <option value="Estimate">Estimate</option>
                                  <option value="Other">Other</option>
                                </select>
                                {errors.dataSourceType && <p className="text-red-500 text-xs mt-1">{errors.dataSourceType}</p>}
                              </div>

                              {/* Energy Consumption */}
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">
                                  Energy Consumption <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    name="energyConsumption"
                                    value={formData.energyConsumption ? parseFloat(formData.energyConsumption).toFixed(2) : ""}
                                    readOnly
                                    placeholder="Auto-calculated"
                                    className="w-full h-10 px-2 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                  />
                                  <span className="absolute right-3 top-3 text-[10px] text-gray-400">GJ</span>
                                </div>
                                {errors.energyConsumption && <p className="text-red-500 text-xs mt-1">{errors.energyConsumption}</p>}
                              </div>
                            </div>
                          )}

                          {(formData.trackingType === "Spend amount" || formData.trackingType === "Both") && (
                            <div className={`col-span-2 grid grid-cols-1 ${formData.trackingType === 'Spend amount' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
                              <div className="col-span-1 flex flex-col justify-end">
                                <label className="block text-xs font-bold text-gray-700 mb-2">
                                  Spend Amount <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  name="spendAmount"
                                  value={formData.spendAmount || ""}
                                  onChange={handleChange}
                                  placeholder="Enter amount"
                                  className="w-full h-10 px-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                {errors.spendAmount && <p className="text-red-500 text-xs mt-1">{errors.spendAmount}</p>}
                              </div>

                              {/* Read-only Electricity Purchased for Spend Amount Users */}
                              {formData.trackingType === "Spend amount" && (
                                <div className="col-span-1 flex flex-col justify-end">
                                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2">
                                    Electricity purchased
                                    <span className="bg-yellow-100 text-yellow-800 text-[10px] font-medium px-1.5 py-0.5 rounded border border-yellow-200">
                                      Estimated
                                    </span>
                                    <div className="group relative flex items-center">
                                      <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg pointer-events-none">
                                        Electricity consumption is estimated using a spend-based methodology and state-wise average electricity tariff data provided in the SEBI BRSR Core document (SEBI/HO/CFD/CFD-SEC-2/P/CIR/2023/122). The estimation is a proxy and may differ from actual metered consumption.
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                      </div>
                                    </div>
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={formData.electricityPurchased || ""}
                                      disabled
                                      className="w-full h-10 px-2 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                    />
                                    <span className="absolute right-3 top-3 text-[10px] text-gray-400">kWh</span>
                                  </div>
                                </div>
                              )}

                              {/* Data Source Type for Spend Amount Users */}
                              {formData.trackingType === "Spend amount" && (
                                <div className="col-span-1 flex flex-col justify-end">
                                  <label className="block text-xs font-bold text-gray-700 mb-2">
                                    Data source type <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    name="dataSourceType"
                                    value={formData.dataSourceType || ""}
                                    onChange={handleChange}
                                    className={`w-full h-10 px-2 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none ${errors.dataSourceType ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                                  >
                                    <option value="">Select data source...</option>
                                    <option value="Invoice">Invoice</option>
                                    <option value="Meter Reading">Meter Reading</option>
                                    <option value="Estimate">Estimate</option>
                                    <option value="Other">Other</option>
                                  </select>
                                  {errors.dataSourceType && <p className="text-red-500 text-xs mt-1">{errors.dataSourceType}</p>}
                                </div>
                              )}

                              {formData.trackingType === "Spend amount" && (
                                <div className="col-span-1 flex flex-col justify-end">
                                  <label className="block text-xs font-bold text-gray-700 mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
                                    Energy Consumption
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      name="energyConsumption"
                                      value={formData.energyConsumption ? parseFloat(formData.energyConsumption).toFixed(2) : ""}
                                      readOnly
                                      placeholder="Auto-calculated"
                                      className="w-full h-10 px-2 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                    />
                                    <span className="absolute right-3 top-3 text-[10px] text-gray-400">GJ</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Supporting Evidence Upload */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        Supporting evidence
                      </label>
                      <div className={`border border-dashed rounded-xl ${errors.energySupportingEvidenceFile ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50/50"} p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors group relative`}>
                        {formData.energySupportingEvidenceFile ? (
                          <div className="flex flex-col items-center w-full z-10">
                            <div className="flex items-center justify-between w-full bg-white p-2 rounded border border-gray-100 shadow-sm mb-2">
                              <span className="text-xs text-gray-700 truncate max-w-[80%]">{formData.energySupportingEvidenceFile.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, energySupportingEvidenceFile: null }));
                                  setErrors(prev => ({ ...prev, energySupportingEvidenceFile: "" }));
                                }}
                                className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 focus:outline-none"
                              >
                                Cancel
                              </button>
                            </div>
                            <label className="text-xs text-indigo-600 font-semibold cursor-pointer hover:underline">
                              Upload a different file
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.png,.jpeg,.jpg"
                                onChange={(e) => handleFileUpload(e, "energySupportingEvidenceFile")}
                              />
                            </label>
                          </div>
                        ) : (
                          <>
                            <label className="bg-indigo-100 p-2.5 rounded-full mb-3 hover:scale-110 transition-transform cursor-pointer">
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.png,.jpeg,.jpg"
                                onChange={(e) => handleFileUpload(e, "energySupportingEvidenceFile")}
                              />
                              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                            </label>
                            <p className="text-sm font-semibold text-gray-600">
                              Click icon to upload
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              PDF, JPG, PNG up to 10MB
                            </p>
                          </>
                        )}
                      </div>
                      {errors.energySupportingEvidenceFile && (
                        <p className="text-red-500 text-xs mt-1 text-center">
                          {errors.energySupportingEvidenceFile}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-2">
                        Uploading bills improves data confidence.
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        Energy source description
                      </label>
                      <textarea
                        name="energySourceDescription"
                        value={formData.energySourceDescription || ""}
                        onChange={handleChange}
                        maxLength={200}
                        placeholder="Describe the energy source or any relevant details..."
                        className="w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none min-h-[40px]"
                      />
                    </div>
                  </div>
                </section>

                {/* Box 2: Renewable Electricity */}
                {formData.renewableProcurement === "Yes" && (
                  <section className="bg-white rounded-xl p-2 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-green-50 rounded-lg text-green-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h2 className="text-sm font-bold text-gray-900">
                        Renewable electricity
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {/* Do you have renewable? */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-xs font-bold text-gray-700">
                            Do you have renewable electricity?
                          </label>
                        </div>
                        {renderYesNo("hasRenewableElectricity", formData.hasRenewableElectricity)}
                      </div>

                      {formData.hasRenewableElectricity === "Yes" && (
                        <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                          {/* Renewable Input Type Toggle */}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2">
                              Renewable Activity Input <span className="text-red-500">*</span>
                            </label>
                            <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-fit">
                              {["Monthly", "Yearly"].map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setFormData(prev => {
                                    const updates: any = { ...prev, renewableEnergyActivityInput: type as "Monthly" | "Yearly" };
                                    if (type === "Monthly" && prev.reportingPeriod !== "Monthly") {
                                      updates.renewableMonthlyData = generateMonthlyDataForYear(prev.reportingYear);
                                    } else if (type === "Monthly") {
                                      updates.renewableMonthlyData = [{ id: Math.random().toString(36).substr(2, 9), month: "", electricityPurchased: "", dataSourceType: "", energyConsumption: "", spend: "" }];
                                    }
                                    return updates;
                                  })}
                                  className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${formData.renewableEnergyActivityInput === type
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>

                          {(formData.renewableEnergyActivityInput === "Monthly" || formData.renewableEnergyActivityInput === "Quarterly") ? (
                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                              <table className="w-full text-xs text-left text-gray-700">
                                <thead className="text-[10px] text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                  <tr>
                                    <th className="px-3 py-2 font-bold w-1/4">Month</th>
                                    <th className="px-3 py-2 font-bold min-w-[120px]">Renewable Electricity (<span className="normal-case">kWh</span>)</th>
                                    <th className="px-3 py-2 font-bold min-w-[130px]">Data source type</th>
                                    <th className="px-3 py-2 font-bold min-w-[120px]">Energy Consumption (GJ)</th>
                                    <th className="px-3 py-2 w-10"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {formData.renewableMonthlyData.map((row) => (
                                    <tr key={row.id} className="border-b border-gray-100 last:border-none group hover:bg-gray-50/50">
                                      <td className="px-3 py-2">
                                        {formData.renewableEnergyActivityInput === "Quarterly" ? (
                                          <input
                                            type="text"
                                            value={row.month}
                                            onChange={(e) => handleRenewableRowChange(row.id, "month", e.target.value)}
                                            className="w-full h-10 px-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-gray-700 placeholder-gray-400"
                                            placeholder="e.g. Q1 2024"
                                          />
                                        ) : formData.reportingPeriod !== "Monthly" ? (
                                          <div className="w-full h-10 px-2 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800">
                                            {row.month && !row.month.startsWith("Q") ? new Date(row.month + "-01").toLocaleDateString('default', { month: 'short', year: 'numeric' }) : row.month}
                                          </div>
                                        ) : (
                                          <input
                                            type="month"
                                            value={row.month}
                                            onChange={(e) => handleRenewableRowChange(row.id, "month", e.target.value)}
                                            className="w-full h-10 px-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-gray-700 placeholder-gray-400"
                                            placeholder="Select month"
                                          />
                                        )}
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className={`border rounded-lg h-10 px-2 flex items-center bg-gray-50 border-gray-200`}>
                                          <input
                                            type="number"
                                            value={row.electricityPurchased}
                                            onChange={(e) => handleRenewableRowChange(row.id, "electricityPurchased", e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs text-gray-700 placeholder-gray-400"
                                            placeholder="0"
                                          />
                                        </div>
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className={`border rounded-lg h-10 px-2 flex items-center bg-gray-50 border-gray-200`}>
                                          <select
                                            value={row.dataSourceType}
                                            onChange={(e) => handleRenewableRowChange(row.id, "dataSourceType", e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs text-gray-700 placeholder-gray-400 appearance-none"
                                          >
                                            <option value="">Select...</option>
                                            <option value="Invoice">Invoice</option>
                                            <option value="Meter Reading">Meter Reading</option>
                                            <option value="Estimate">Estimate</option>
                                            <option value="Other">Other</option>
                                          </select>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className="border rounded-lg h-10 px-2 flex items-center bg-gray-100 border-gray-200">
                                          <input
                                            type="number"
                                            value={row.energyConsumption}
                                            readOnly
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs text-gray-500 cursor-not-allowed"
                                            placeholder="0"
                                          />
                                        </div>
                                      </td>
                                      <td className="px-2 py-2 text-right">
                                        {(formData.reportingPeriod === "Monthly" || formData.energyActivityInput === "Quarterly") && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteRenewableRow(row.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {(formData.reportingPeriod === "Monthly" || formData.energyActivityInput === "Quarterly") && (
                                <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
                                  <button
                                    type="button"
                                    onClick={handleAddRenewableRow}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    {formData.energyActivityInput === "Quarterly" ? "Add Quarter" : "Add Month"}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            // YEARLY VIEW
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">
                                  Renewable electricity
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    name="renewableElectricity"
                                    value={formData.renewableElectricity || ""}
                                    onChange={handleChange}
                                    placeholder="Enter value"
                                    className={`w-full h-10 px-2 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${errors.renewableElectricity ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                                  />
                                  <span className="absolute right-3 top-3 text-[10px] text-gray-400">kWh</span>
                                </div>
                                {errors.renewableElectricity && <p className="text-red-500 text-xs mt-1">{errors.renewableElectricity}</p>}
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">
                                  Data source type <span className="text-red-500">*</span>
                                </label>
                                <select
                                  name="renewableDataSourceType"
                                  value={formData.renewableDataSourceType || ""}
                                  onChange={handleChange}
                                  className={`w-full h-10 px-2 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none ${errors.renewableDataSourceType ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                                >
                                  <option value="">Select data source...</option>
                                  <option value="Invoice">Invoice</option>
                                  <option value="Meter Reading">Meter Reading</option>
                                  <option value="Estimate">Estimate</option>
                                  <option value="Other">Other</option>
                                </select>
                                {errors.renewableDataSourceType && <p className="text-red-500 text-xs mt-1">{errors.renewableDataSourceType}</p>}
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">
                                  Energy Consumption <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    name="renewableEnergyConsumption"
                                    value={formData.renewableEnergyConsumption ? parseFloat(formData.renewableEnergyConsumption).toFixed(2) : ""}
                                    readOnly
                                    placeholder="Auto-calculated"
                                    className="w-full h-10 px-2 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                  />
                                  <span className="absolute right-3 top-3 text-[10px] text-gray-400">GJ</span>
                                </div>
                                {errors.renewableEnergyConsumption && <p className="text-red-500 text-xs mt-1">{errors.renewableEnergyConsumption}</p>}
                              </div>
                            </div>
                          )}

                          {/* On-site generation moved from Page 1 */}
                          <div className="col-span-2 mt-2">
                            <label className="block text-xs font-bold text-gray-700 mb-2">
                              On-site generation exported (kWh)
                            </label>
                            <input
                              type="text"
                              name="onsiteExportedKwh"
                              value={formData.onsiteExportedKwh || ""}
                              onChange={handleChange}
                              placeholder="Enter kWh value"
                              className={`w-full h-10 px-2 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.onsiteExportedKwh ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                            />
                            <p className="text-[10px] text-gray-400 mt-1.5">
                              Based on your earlier input
                            </p>
                            {errors.onsiteExportedKwh && <p className="text-red-500 text-xs mt-1">{errors.onsiteExportedKwh}</p>}
                          </div>
                        </div>
                      )}

                      {/* Supporting Evidence Upload */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          Supporting evidence
                        </label>
                        <div className={`border border-dashed rounded-xl ${errors.renewableSupportingEvidenceFile ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50/50"} p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors group relative h-28`}>
                          {formData.renewableSupportingEvidenceFile ? (
                            <div className="flex flex-col items-center w-full z-10">
                              <div className="flex items-center justify-between w-full bg-white p-2 rounded border border-gray-100 shadow-sm mb-2">
                                <span className="text-xs text-gray-700 truncate max-w-[80%]">{formData.renewableSupportingEvidenceFile.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, renewableSupportingEvidenceFile: null }));
                                    setErrors(prev => ({ ...prev, renewableSupportingEvidenceFile: "" }));
                                  }}
                                  className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 focus:outline-none"
                                >
                                  Cancel
                                </button>
                              </div>
                              <label className="text-xs text-green-600 font-semibold cursor-pointer hover:underline">
                                Upload a different file
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.png,.jpeg,.jpg"
                                  onChange={(e) => handleFileUpload(e, "renewableSupportingEvidenceFile")}
                                />
                              </label>
                            </div>
                          ) : (
                            <>
                              <label className="bg-green-100 p-2 rounded-full mb-2 hover:scale-110 transition-transform cursor-pointer">
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.png,.jpeg,.jpg"
                                  onChange={(e) => handleFileUpload(e, "renewableSupportingEvidenceFile")}
                                />
                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                              </label>
                              <p className="text-xs font-semibold text-gray-600">
                                Click icon to upload
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                PDF, JPG, PNG up to 10MB
                              </p>
                            </>
                          )}
                        </div>
                        {errors.renewableSupportingEvidenceFile && (
                          <p className="text-red-500 text-xs mt-1 text-center">
                            {errors.renewableSupportingEvidenceFile}
                          </p>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          Energy source description
                        </label>
                        <textarea
                          name="renewableEnergySourceDescription"
                          value={formData.renewableEnergySourceDescription || ""}
                          onChange={handleChange}
                          maxLength={200}
                          placeholder="Describe renewable energy source..."
                          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none min-h-[40px]"
                        />
                      </div>
                    </div>
                  </section>
                )}
                {/* Calculated Results Display - Output Only - Chart */}
                <section className="col-span-2 bg-white rounded-xl p-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col">
                  <h3 className="text-gray-500 text-xs font-medium mb-2">Total Energy Consumption Breakdown</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    {/* Pie Chart Column */}
                    <div className="flex flex-col h-[250px]">
                      <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={(derivedTotalGW === 0)
                                ? [{ name: "No Data", value: 1, color: "#e5e7eb" }]
                                : [
                                  { name: "Grid Electricity", value: parseFloat(derivedGridGW.toFixed(2)), color: "#9ca3af" },
                                  { name: "Renewable / Contracted", value: parseFloat(derivedRenewGW.toFixed(2)), color: "#22c55e" },
                                ]
                              }
                              cx="50%"
                              cy="50%"
                              innerRadius="55%"
                              outerRadius="75%"
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {(derivedTotalGW === 0) ? (
                                <Cell key="placeholder" fill="#e5e7eb" />
                              ) : (
                                [
                                  { name: "Grid Electricity", value: parseFloat(derivedGridGW.toFixed(2)), color: "#9ca3af" },
                                  { name: "Renewable / Contracted", value: parseFloat(derivedRenewGW.toFixed(2)), color: "#22c55e" },
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))
                              )}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-center">
                            <span className="text-lg font-bold text-gray-900 block">{derivedTotalGW.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-[10px] text-gray-500">kWh TOTAL</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs space-y-1">
                        {[
                          { name: "Grid Electricity", value: derivedGridGW.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " kWh", color: "#9ca3af" },
                          { name: "Renewable / Contracted", value: derivedRenewGW.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " kWh", color: "#22c55e" },
                        ].map((item, i) => (
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

                    {/* Bar Chart Column */}
                    <div className="flex flex-col h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {(formData.energyActivityInput === "Monthly" || formData.energyActivityInput === "Quarterly") && monthlyChartData.length > 0 ? (
                          <BarChart
                            data={monthlyChartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              cursor={{ fill: 'transparent' }}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar
                              dataKey="Grid"
                              fill="#6366F1"
                              radius={[4, 4, 0, 0]}
                              barSize={Math.max(15, 200 / monthlyChartData.length)}
                            />
                            <Bar
                              dataKey="Renewable"
                              fill="#22c55e"
                              radius={[4, 4, 0, 0]}
                              barSize={Math.max(15, 200 / monthlyChartData.length)}
                            />
                          </BarChart>
                        ) : (
                          <BarChart
                            data={[
                              { name: "Grid", value: parseFloat(derivedGridGW.toFixed(2)), color: "#9ca3af" },
                              { name: "Renewable", value: parseFloat(derivedRenewGW.toFixed(2)), color: "#22c55e" },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {
                                [
                                  { name: "Grid", value: parseFloat(derivedGridGW.toFixed(2)), color: "#9ca3af" },
                                  { name: "Renewable", value: parseFloat(derivedRenewGW.toFixed(2)), color: "#22c55e" },
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))
                              }
                            </Bar>
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>

              </div>

            </div>
          )
          }

          {/* Footer Actions */}
          {/* Footer Actions */}
          <div className="pt-1 pb-1 mt-auto flex justify-end items-center border-t border-gray-100 flex-shrink-0 bg-white gap-4">
            {page === 1 ? (
              <p className="text-[10px] text-gray-400">
                You can edit these details later
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 hover:underline cursor-pointer">
                You can edit this later.
              </p>
            )}

            <div className="flex gap-4">
              {page === 2 && (
                <button
                  type="button"
                  onClick={() => { setPage(1); window.scrollTo(0, 0); }}
                  className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                >
                  Back
                </button>
              )}

              <button
                type="button"
                onClick={page === 1 ? handleNext : (e) => handleSubmit(e as any)}
                disabled={isSubmitting}
                className="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {page === 1 ? (
                  <>
                    Next: Electricity data
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                ) : (
                  isSubmitting ? "Submitting..." : "Next: Review & submit"
                )}
              </button>
            </div>
          </div>

        </form >
      </div >
    </div >
  );
}

export default function TemplatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TemplateContent />
    </Suspense>
  );
}
