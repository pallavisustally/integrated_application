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
    financials: YearFinancials[];
    paybackPeriod: number | null; // Years
    discountedPaybackPeriod: number | null; // Years
    totalSavings: number;         // Rs (Lifetime)
    netPresentValue: number;      // Rs
}

export function calculateSolarModel(inputs: SolarInputs): SolarResults {
    const { stateIrradiance, gridConsumption, offset, backupHours, tariff, pr } = inputs;

    // 1. Energy Calculations
    const solarEnergyTarget = gridConsumption * offset;
    const pvYield = stateIrradiance * pr;
    const pvSize = solarEnergyTarget / pvYield;

    const loadAvg = gridConsumption / (365 * 24);
    const batteryCapacity = loadAvg * backupHours;

    const roofArea = pvSize * SOLAR_CONSTANTS.Area_per_kW;

    // 2. Cost Calculations
    const pvCapex = pvSize * SOLAR_CONSTANTS.Cost_PV_kW;
    const batteryCapex = batteryCapacity * SOLAR_CONSTANTS.Cost_Batt_kWh;
    const totalCapex = pvCapex + batteryCapex;

    let initialOm = pvCapex * SOLAR_CONSTANTS.OM_rate;

    const co2Avoided = solarEnergyTarget * SOLAR_CONSTANTS.Grid_Emission_Factor;

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

        const discountFactor = 1 / Math.pow(1 + SOLAR_CONSTANTS.Discount_rate, year);
        const discountedCashflow = cashflow * discountFactor;

        cumulativeCashflow += cashflow;
        cumulativeDiscountedCashflow += discountedCashflow;

        if (paybackPeriod === null && cumulativeCashflow >= 0) {
            // Simple interpolation for more precise payback could be added, but prompt asks for "First n"
            // However, usually we return a float. Let's return the year for now, or fraction.
            // PaybackYear = First n where CumCF >= TotalCAPEX? No, CumCF includes initial negative capex.
            // Formula in prompt: "First n where Cumulative_CF_n >= Total_CAPEX"
            // Wait, usually Cumulative_CF starts at -CAPEX. So ">= 0" means payback reached.
            // IF the prompt formula specifically defines Cumulative_CF_n = Sum(Cashflow_1...n) WITHOUT initial Capex, then it is compared to CAPEX.
            // "Cumulative_CF_n = Σ Cashflow_1…n"
            // "Payback_Year = First n where Cumulative_CF_n ≥ Total_CAPEX"
            // So yes, Sum of positive flows >= Initial Spend.
            // My `cumulativeCashflow` variable initialized at `-totalCapex`. So checking `>= 0` is equivalent to `Sum(flows) >= Capex`.
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
            cumulativeCashflow: cumulativeCashflow + totalCapex, // Storing purely the operating sum as per prompt def if needed?
            // Prompt: "Cumulative_CF_n = Σ Cashflow_1…n".
            // Cashflow_n = Savings - OM - Rep. 
            // So Cumulative_CF_n is the sum of operating cashflows.
            // Payback is when this Sum >= CAPEX.
            // My variable `cumulativeCashflow` includes the initial deduction.
            // So for the output array, let's store the "Sum of Cashflows 1..n" which is `cumulativeCashflow + totalCapex`.
            cumulativeDiscountedCashflow: cumulativeDiscountedCashflow + totalCapex,
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
        co2Avoided,
        financials,
        paybackPeriod,
        discountedPaybackPeriod,
        totalSavings: financials.reduce((sum, f) => sum + f.cashflow, 0),
        netPresentValue: cumulativeDiscountedCashflow,
    };
}
