export type TariffRate = {
    p: number; // Price (Rs/kWh)
    sigma: number; // Standard Deviation
    ef: number; // Emission Factor (kg CO2e/kWh)
};

// Data extracted from user-provided images
// States with multiple entries are structured as nested objects
export const TARIFF_DATA: Record<string, TariffRate | Record<string, TariffRate>> = {
    "Andaman and Nicobar Islands": { p: 8.32, sigma: 1.3, ef: 0.716 },
    "Andhra Pradesh": { p: 7.26, sigma: 0.0, ef: 0.716 },
    "Arunachal Pradesh": { p: 4.30, sigma: 0.0, ef: 0.716 },
    "Assam": { // Mapped from "Assam (Urban Areas)" - assuming standard for now or defaulting to Urban
        p: 6.57, sigma: 1.3, ef: 0.716
    },
    "Bihar": { p: 8.81, sigma: 0.2, ef: 0.716 },
    "Chandigarh": { p: 5.13, sigma: 0.7, ef: 0.716 },
    "Chhattisgarh": { p: 6.53, sigma: 0.8, ef: 0.716 },
    "Dadra and Nagar Haveli and Daman and Diu": {
        // Merging entries as per the dropdown in page.tsx which combines them
        // Taking average or defaulting to one?
        // Dadra & Nagar Haveli: 4.39, Daman & Diu: 5.68.
        // Let's offer a choice if possible, or split.
        // Since the key is combined, we'll offer sub-options.
        "Dadra & Nagar Haveli": { p: 4.39, sigma: 0.4, ef: 0.716 },
        "Daman & Diu": { p: 5.68, sigma: 1.9, ef: 0.716 }
    },
    "Delhi": {
        "BYPL / BRPL / NDPL-TPDDL": { p: 10.89, sigma: 0.0, ef: 0.716 },
        "NDMC": { p: 10.89, sigma: 0.0, ef: 0.716 }
    },
    "Goa": { p: 4.82, sigma: 0.2, ef: 0.716 },
    "Gujarat": {
        "State Utility": { p: 6.02, sigma: 0.3, ef: 0.716 },
        "Torrent Power Ltd., Ahmedabad": { p: 6.64, sigma: 1.5, ef: 0.716 },
        "Torrent Power Ltd., Surat": { p: 6.24, sigma: 1.3, ef: 0.716 }
    },
    "Haryana": { p: 7.94, sigma: 1.1, ef: 0.716 },
    "Himachal Pradesh": { p: 5.70, sigma: 0.9, ef: 0.716 },
    "Jammu and Kashmir": { p: 4.05, sigma: 0.2, ef: 0.716 }, // Combined in data, separate in dropdown? Dropdown has "Jammu and Kashmir" and "Ladakh" separately
    "Ladakh": { p: 4.05, sigma: 0.2, ef: 0.716 }, // Assuming same as J&K based on "Jammu & Kashmir and Ladakh" entry
    "Jharkhand": {
        "State Utility": { p: 7.84, sigma: 2.0, ef: 0.716 },
        "D.V.C (Jharkhand Area)": { p: 6.69, sigma: 0.7, ef: 0.716 }
    },
    "Karnataka": {
        "Bruhat Bangalore Mahanagara Palike / Municipal Corp. / Urban": { p: 8.74, sigma: 1.4, ef: 0.716 },
        "Village Panchayats / Rural": { p: 8.22, sigma: 1.3, ef: 0.716 }
    },
    "Kerala": { p: 6.98, sigma: 0.8, ef: 0.716 },
    "Lakshadweep": { p: 6.87, sigma: 0.0, ef: 0.716 },
    "Madhya Pradesh": {
        "Urban Areas": { p: 9.52, sigma: 0.0, ef: 0.716 },
        "Rural Areas": { p: 8.68, sigma: 0.0, ef: 0.716 }
    },
    "Maharashtra": {
        "State Utility / MSEDCL": { p: 9.13, sigma: 2.0, ef: 0.716 },
        "Mumbai - B.E.S.T": { p: 8.77, sigma: 1.7, ef: 0.716 },
        "Mumbai - Adani Electricity": { p: 9.72, sigma: 1.8, ef: 0.716 },
        "Mumbai - TATA's": { p: 9.04, sigma: 1.6, ef: 0.716 }
    },
    "Manipur": { p: 7.05, sigma: 2.4, ef: 0.716 },
    "Mizoram": { p: 6.73, sigma: 0.2, ef: 0.716 },
    "Meghalaya": { p: 7.83, sigma: 0.0, ef: 0.716 },
    "Nagaland": { p: 6.60, sigma: 0.6, ef: 0.716 },
    "Odisha": { p: 7.02, sigma: 0.3, ef: 0.716 },
    "Puducherry": { p: 6.38, sigma: 0.0, ef: 0.716 },
    "Punjab": { p: 7.85, sigma: 0.6, ef: 0.716 },
    "Rajasthan": { p: 8.23, sigma: 0.6, ef: 0.716 },
    "Sikkim": { p: 6.63, sigma: 1.5, ef: 0.716 }, // Note: "At 11 kV"
    "Tamil Nadu": { p: 5.82, sigma: 1.5, ef: 0.716 },
    "Telangana": { p: 7.25, sigma: 0.0, ef: 0.716 },
    "Tripura": { p: 8.15, sigma: 0.3, ef: 0.716 },
    "Uttarakhand": { p: 7.17, sigma: 1.7, ef: 0.716 },
    "Uttar Pradesh": {
        "Urban": { p: 10.72, sigma: 1.1, ef: 0.716 },
        "Rural": { p: 9.92, sigma: 1.0, ef: 0.716 }
    },
    "West Bengal": {
        "Urban": { p: 8.35, sigma: 1.3, ef: 0.716 },
        "Rural": { p: 8.12, sigma: 1.3, ef: 0.716 },
        "CESC Ltd., Kolkata": { p: 8.46, sigma: 1.3, ef: 0.716 },
        "IPCL": { p: 5.51, sigma: 1.1, ef: 0.716 }
    }
};
