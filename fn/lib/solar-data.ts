export interface DistrictData {
    name: string;
    annualIrradiance: number; // kWh/m2/year
}

export interface StateData {
    name: string;
    irradiance: number; // Annual kWh/m2/year (State Average)
    tariff: number;     // Rs/kWh
    districts?: DistrictData[];
}

export const SOLAR_CONSTANTS = {
    Area_per_kW: 10,       // m2/kW (Approximate standard)
    Cost_PV_kW: 45000,     // Rs/kW (Avg of 3-10kW range)
    Cost_Batt_kWh: 12000,  // Rs/kWh (Estimated from example)
    PV_Degradation: 0.01,  // 1% per year
    OM_rate: 0.01,         // 1% of CAPEX
    OM_escalation: 0.05,   // 5% per year
    Battery_replace_frac: 0.8, // 80% of original cost
    Battery_replace_year: 10,  // Year 10
    Discount_rate: 0.10,   // 10%
    Project_Life: 25,      // 25 years
    Grid_Emission_Factor: 0.716, // kgCO2/kWh
};

// Data sourced from prompt images/tables
export const STATE_DATA: StateData[] = [
    {
        name: "Andaman and Nicobar Islands",
        irradiance: 1542.96,
        tariff: 8.32
    },
    {
        name: "Andhra Pradesh",
        irradiance: 1588.83,
        tariff: 7.26,
        districts: [
            { name: "Visakhapatnam", annualIrradiance: 1005 },
            { name: "Vijayawada", annualIrradiance: 1185 }
        ]
    },
    {
        name: "Arunachal Pradesh",
        irradiance: 1274.8,
        tariff: 4.3,
        districts: [
            { name: "Itanagar", annualIrradiance: 960 }
        ]
    },
    {
        name: "Assam",
        irradiance: 1496.72,
        tariff: 6.57,
        districts: [
            { name: "Guwahati", annualIrradiance: 1155 }
        ]
    },
    {
        name: "Bihar",
        irradiance: 1447.59,
        tariff: 8.81,
        districts: [
            { name: "Patna", annualIrradiance: 735 }
        ]
    },
    { name: "Chandigarh", irradiance: 1383, tariff: 5.13 },
    {
        name: "Chhattisgarh",
        irradiance: 1624.96,
        tariff: 6.53,
        districts: [
            { name: "Raipur", annualIrradiance: 1275 }
        ]
    },
    { name: "Dadra and Nagar Haveli and Daman and Diu", irradiance: 1685.66, tariff: 4.89 },
    {
        name: "Delhi",
        irradiance: 1265,
        tariff: 7.89,
        districts: [
            { name: "Central", annualIrradiance: 750 }
        ]
    },
    {
        name: "Goa",
        irradiance: 1719,
        tariff: 4.82,
        districts: [
            { name: "Panaji", annualIrradiance: 1665 }
        ]
    },
    {
        name: "Gujarat",
        irradiance: 1631.31,
        tariff: 6.02,
        districts: [
            { name: "Gandhinagar", annualIrradiance: 900 },
            { name: "Ahmedabad", annualIrradiance: 1230 },
            { name: "Surat", annualIrradiance: 1335 }
        ]
    },
    {
        name: "Haryana",
        irradiance: 1299.38,
        tariff: 7.94,
        districts: [
            { name: "Gurugram", annualIrradiance: 735 }
        ]
    },
    {
        name: "Himachal Pradesh",
        irradiance: 1414.04,
        tariff: 5.7,
        districts: [
            { name: "Shimla", annualIrradiance: 900 },
            { name: "Manali", annualIrradiance: 825 }
        ]
    },
    { name: "Jammu and Kashmir", irradiance: 1323.8, tariff: 4.05 },
    {
        name: "Jharkhand",
        irradiance: 1513.04,
        tariff: 7.84,
        districts: [
            { name: "Ranchi", annualIrradiance: 1050 }
        ]
    },
    {
        name: "Karnataka",
        irradiance: 1705.49,
        tariff: 7.73,
        districts: [
            { name: "Bengaluru", annualIrradiance: 1590 }
        ]
    },
    {
        name: "Kerala",
        irradiance: 1658.71,
        tariff: 6.98,
        districts: [
            { name: "Thiruvananthapuram", annualIrradiance: 1710 }
        ]
    },
    { name: "Ladakh", irradiance: 1371.55, tariff: 4.05 },
    { name: "Lakshadweep", irradiance: 1598, tariff: 6.87 },
    {
        name: "Madhya Pradesh",
        irradiance: 1585.95,
        tariff: 5.51,
        districts: [
            { name: "Bhopal", annualIrradiance: 1305 }
        ]
    },
    {
        name: "Maharashtra",
        irradiance: 1633.67,
        tariff: 9.13,
        districts: [
            { name: "Mumbai", annualIrradiance: 1425 },
            { name: "Pune", annualIrradiance: 1335 },
            { name: "Nagpur", annualIrradiance: 1320 }
        ]
    },
    {
        name: "Manipur",
        irradiance: 1590.66,
        tariff: 7.05,
        districts: [
            { name: "Imphal", annualIrradiance: 1455 }
        ]
    },
    {
        name: "Meghalaya",
        irradiance: 1393.28,
        tariff: 7.83,
        districts: [
            { name: "Shillong", annualIrradiance: 1260 }
        ]
    },
    {
        name: "Mizoram",
        irradiance: 1728,
        tariff: 6.73,
        districts: [
            { name: "Aizawl", annualIrradiance: 1575 }
        ]
    },
    {
        name: "Nagaland",
        irradiance: 1589.1,
        tariff: 6.6,
        districts: [
            { name: "Kohima", annualIrradiance: 1485 }
        ]
    },
    {
        name: "Odisha",
        irradiance: 1694.33,
        tariff: 7.02,
        districts: [
            { name: "Bhubaneswar", annualIrradiance: 960 }
        ]
    },
    { name: "Puducherry", irradiance: 1694.33, tariff: 6.38 },
    {
        name: "Punjab",
        irradiance: 1322.79,
        tariff: 7.85,
        districts: [
            { name: "Gurdaspur", annualIrradiance: 795 },
            { name: "Amritsar", annualIrradiance: 795 },
            { name: "Ludhiana", annualIrradiance: 840 }
        ]
    },
    {
        name: "Rajasthan",
        irradiance: 1864.57,
        tariff: 8.23,
        districts: [
            { name: "Jaisalmer", annualIrradiance: 1095 },
            { name: "Barmer", annualIrradiance: 1050 },
            { name: "Bikaner", annualIrradiance: 1065 },
            { name: "Jaipur", annualIrradiance: 945 },
            { name: "Jodhpur", annualIrradiance: 1095 },
            { name: "Udaipur", annualIrradiance: 1215 } // Razor mapped to Udaipur
        ]
    },
    {
        name: "Sikkim",
        irradiance: 1207.66,
        tariff: 6.63,
        districts: [
            { name: "Gangtok", annualIrradiance: 795 }
        ]
    },
    {
        name: "Tamil Nadu",
        irradiance: 1689.15,
        tariff: 5.82,
        districts: [
            { name: "Chennai", annualIrradiance: 1410 }
        ]
    },
    {
        name: "Telangana",
        irradiance: 1628.45,
        tariff: 7.25,
        districts: [
            { name: "Hyderabad", annualIrradiance: 1260 }
        ]
    },
    {
        name: "Tripura",
        irradiance: 1626.75,
        tariff: 8.15,
        districts: [
            { name: "Agartala", annualIrradiance: 1215 }
        ]
    },
    { name: "Uttar Pradesh", irradiance: 1374.24, tariff: 6.72, districts: [{ name: "Lucknow", annualIrradiance: 705 }] },
    {
        name: "Uttarakhand",
        irradiance: 1505.76,
        tariff: 7.17,
        districts: [
            { name: "Dehradun", annualIrradiance: 945 }
        ]
    },
    {
        name: "West Bengal",
        irradiance: 1390.19,
        tariff: 8.35,
        districts: [
            { name: "Kolkata", annualIrradiance: 870 }
        ]
    },
];
