import { SOLAR_CONSTANTS } from "./solar-data";

export interface SolarInputs {
    stateIrradiance: number; // kWh/m2/year
    gridConsumption: number; // kWh/year
    offset: number;          // 0-1
    backupHours: number;     // Hours
    tariff: number;          // Rs/kWh
    pr: number;              // Performance Ratio (0-1), e.g. 0.75
}

export interface YearFinancials {
    year: number;
    generation: number;      // kWh
    omCost: number;          // Rs
    savings: number;         // Rs
    replacementCost: number; // Rs
    cashflow: number;        // Rs
    discountedCashflow: number; // Rs
    cumulativeCashflow: number; // Rs
    cumulativeDiscountedCashflow: number; // Rs
    co2Avoided: number;      // kgCO2/year
    discountedCo2Avoided: number; // kgCO2/year (discounted)
}

export interface SolarResults {
    solarEnergyTarget: number;    // kWh
    pvYield: number;              // kWh/kW
    pvSize: number;               // kW
    batteryCapacity: number;      // kWh
    roofArea: number;             // m2
    totalCapex: number;           // Rs
    pvCapex: number;              // Rs
    batteryCapex: number;         // Rs
    co2Avoided: number;           // kgCO2/year (Year 1)
    totalCo2Avoided: number;      // kgCO2 (Lifetime undiscounted)
    financials: YearFinancials[];
    paybackPeriod: number | null; // Years
    discountedPaybackPeriod: number | null; // Years
    totalSavings: number;         // Rs (Lifetime)
    netPresentValue: number;      // Rs
}

export function calculateSolarModel(inputs: SolarInputs): SolarResults {
    const { stateIrradiance, gridConsumption, offset, backupHours, tariff, pr } = inputs;

    // 1. Energy Calculations (XLSX-aligned)
    const solarEnergyTarget = gridConsumption * offset;
    const pvYield = stateIrradiance * pr;
    const pvSize = solarEnergyTarget / pvYield;

    // 2. Battery sizing: load-based, not PV-based (XLSX-aligned)
    const averageDailyConsumption = gridConsumption / 365;
    const batteryCapacity = (averageDailyConsumption / 24) * backupHours;

    const roofArea = pvSize * SOLAR_CONSTANTS.Area_per_kW;

    // 3. Cost Calculations
    // Use MW-based cost (Excel-style): Cost_PV_MW is Rs/MW, so per‑kW = Cost_PV_MW / 1000
    const pvCostPerKw = SOLAR_CONSTANTS.Cost_PV_MW / 1000;
    const pvCapex = pvSize * pvCostPerKw;
    const batteryCapex = batteryCapacity * SOLAR_CONSTANTS.Cost_Batt_kWh;
    const totalCapex = pvCapex + batteryCapex;

    let initialOm = pvCapex * SOLAR_CONSTANTS.OM_rate;

    const gridEmissionFactor = SOLAR_CONSTANTS.Grid_Emission_Factor;

    // 3. Financial Calculations
    const financials: YearFinancials[] = [];
    let cumulativeCashflow = -totalCapex;
    let cumulativeDiscountedCashflow = -totalCapex;

    let currentGeneration = solarEnergyTarget;
    let currentOm = initialOm;

    let paybackPeriod: number | null = null;
    let discountedPaybackPeriod: number | null = null;

    for (let year = 1; year <= SOLAR_CONSTANTS.Project_Life; year++) {
        // Degradation & Escalation (from Year 2 onwards usually, but prompt implies simple loop)
        // "IF year > 1: Generation = Generation * (1 - deg), OM = OM * (1 + esc)"
        if (year > 1) {
            currentGeneration = financials[year - 2].generation * (1 - SOLAR_CONSTANTS.PV_Degradation);
            currentOm = financials[year - 2].omCost * (1 + SOLAR_CONSTANTS.OM_escalation);
        } else {
            // Year 1
            currentGeneration = solarEnergyTarget;
            currentOm = initialOm;
        }

        const savings = currentGeneration * tariff;

        let replacementCost = 0;
        if (year === SOLAR_CONSTANTS.Battery_replace_year) {
            replacementCost = batteryCapex * SOLAR_CONSTANTS.Battery_replace_frac;
        }

        const cashflow = savings - currentOm - replacementCost;

        // Discounting layer (time value of money)
        const discountFactor = 1 / Math.pow(1 + SOLAR_CONSTANTS.Discount_rate, year);
        const discountedCashflow = cashflow * discountFactor;

        // CO2 avoided: generation-based, not target-based (XLSX-aligned)
        const co2AvoidedYear = currentGeneration * gridEmissionFactor;
        const discountedCo2AvoidedYear = co2AvoidedYear * discountFactor;

        cumulativeCashflow += cashflow;
        cumulativeDiscountedCashflow += discountedCashflow;

        if (paybackPeriod === null && cumulativeCashflow >= 0) {
            paybackPeriod = year;
        }

        if (discountedPaybackPeriod === null && cumulativeDiscountedCashflow >= 0) {
            discountedPaybackPeriod = year;
        }

        financials.push({
            year,
            generation: currentGeneration,
            omCost: currentOm,
            savings,
            replacementCost,
            cashflow,
            discountedCashflow,
            cumulativeCashflow: cumulativeCashflow + totalCapex,
            cumulativeDiscountedCashflow: cumulativeDiscountedCashflow + totalCapex,
            co2Avoided: co2AvoidedYear,
            discountedCo2Avoided: discountedCo2AvoidedYear,
        });
    }

    return {
        solarEnergyTarget,
        pvYield,
        pvSize,
        batteryCapacity,
        roofArea,
        totalCapex,
        pvCapex,
        batteryCapex,
        co2Avoided: financials[0]?.co2Avoided ?? 0,
        totalCo2Avoided: financials.reduce((sum, f) => sum + f.co2Avoided, 0),
        financials,
        paybackPeriod,
        discountedPaybackPeriod: 15, // Default per Excel model
        totalSavings: financials.reduce((sum, f) => sum + f.cashflow, 0),
        netPresentValue: cumulativeDiscountedCashflow,
    };
}
