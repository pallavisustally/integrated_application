import { calculateSolarModel } from "../lib/solar-calculations";
import { STATE_DATA } from "../lib/solar-data";

// Example inputs from prompt
// Location: Himachal Pradesh
// Grid Electricity: 10000 kWh
// Offset: 0.1 (10%)
// Battery: 4 hours
// Tariff: 5.7 Rs/kWh
// Insolation: 1414.04 kWh/m2
// PV Yield: 1131.232 (Calculated in prompt: 1414.04 * 0.8 (PR? Prompt says 0.8 PR in image, manual calc check))

const state = STATE_DATA.find(s => s.name === "Himachal Pradesh");
if (!state) throw new Error("State not found");

console.log("State Data:", state);

// Note: Prompt image shows PR 0.8
const inputs = {
    stateIrradiance: state.irradiance,
    gridConsumption: 10000,
    offset: 0.1,
    backupHours: 4,
    tariff: 5.7, // Prompt overrides default tariff in example image
    pr: 0.8,
};

const results = calculateSolarModel(inputs);

console.log("--- Verification Results ---");
console.log(`PV Size (Expected ~0.88): ${results.pvSize.toFixed(4)} kW`);
console.log(`PV Yield (Expected ~1131.23): ${results.pvYield.toFixed(2)} kWh/kW`);
console.log(`Battery Capacity (Expected ~3.53): ${results.batteryCapacity.toFixed(4)} kWh`);
console.log(`Total CAPEX: ₹${results.totalCapex.toFixed(2)}`);
console.log(`Payback Period: ${results.paybackPeriod} years`);
console.log("----------------------------");

// Check if values are within acceptable range
const tolerance = 0.01;
const expectedPvSize = 0.8839; // From prompt image
const expectedBatt = 3.5359;   // From prompt image

if (Math.abs(results.pvSize - expectedPvSize) > tolerance) {
    console.warn(`WARNING: PV Size deviation. Got ${results.pvSize}, expected ${expectedPvSize}`);
} else {
    console.log("PV Size verified.");
}

if (Math.abs(results.batteryCapacity - expectedBatt) > tolerance) {
    console.warn(`WARNING: Battery Capacity deviation. Got ${results.batteryCapacity}, expected ${expectedBatt}`);
} else {
    console.log("Battery Capacity verified.");
}
