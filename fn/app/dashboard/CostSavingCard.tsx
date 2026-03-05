import React, { useState, useMemo } from 'react';
import { calculateSolarModel } from '../../lib/solar-calculations';
import { STATE_DATA } from '../../lib/solar-data';

interface CostSavingCardProps {
    userData: any;
}

const CostSavingCard: React.FC<CostSavingCardProps> = ({ userData }) => {
    const [batteryBackup, setBatteryBackup] = useState(0); // Hours
    const [offset, setOffset] = useState(0.3); // 30% default

    const results = useMemo(() => {
        if (!userData || !userData.state) return null;

        const stateData = STATE_DATA.find(s => s.name.toLowerCase() === userData.state.toLowerCase());
        const irradiance = stateData ? stateData.irradiance : 1500; // Default fallback
        const tariff = stateData ? stateData.tariff : 7; // Default fallback

        // Determine grid consumption (annual kWh)
        // 1. electricityPurchased (units) - primary source
        // 2. spendAmount - estimate units = spend / tariff
        // 3. energyGrid_kJ - derive from energy data (1 kWh = 3600 kJ)
        let annualConsumption = 0;
        if (userData.electricityPurchased != null && userData.electricityPurchased !== '') {
            annualConsumption = parseFloat(String(userData.electricityPurchased));
            if (userData.reportingPeriod === 'Monthly') annualConsumption *= 12;
        } else if (userData.spendAmount != null && userData.spendAmount !== '') {
            const annualSpend = parseFloat(String(userData.spendAmount)) * (userData.reportingPeriod === 'Monthly' ? 12 : 1);
            annualConsumption = tariff > 0 ? annualSpend / tariff : 0;
        } else {
            // Fallback: derive from energyGrid_kJ (certificate page uses energyGrid, verify-otp uses energyGrid_kJ)
            const energyGridKj = parseFloat(String(userData.energyGrid || userData.energyGrid_kJ || '0')) || 0;
            if (energyGridKj > 0) {
                annualConsumption = energyGridKj / 3600; // 1 kWh = 3600 kJ
            }
        }

        if (isNaN(annualConsumption) || annualConsumption === 0) annualConsumption = 10000; // Last-resort fallback for preview

        // Determine Grid Emission Factor from reporting year (matching scope page table)
        let gridEmissionFactor = 0.710; // Latest fallback year value
        if (userData.gridEmissionFactor !== undefined && userData.gridEmissionFactor !== null && userData.gridEmissionFactor > 0) {
            gridEmissionFactor = Number(userData.gridEmissionFactor);
        } else if (userData.reportingYear) {
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
            const date = typeof userData.reportingYear === 'string' ? new Date(userData.reportingYear) : userData.reportingYear;
            if (date && !isNaN(date.getTime())) {
                const year = date.getFullYear();
                const shortNextYear = (year + 1) % 100;
                const yearStr = `${year}-${shortNextYear}`;
                gridEmissionFactor = GRID_EMISSION_FACTORS[yearStr] || 0.710;
            }
        }

        const inputs = {
            stateIrradiance: irradiance,
            gridConsumption: annualConsumption,
            offset: offset,
            backupHours: batteryBackup,
            tariff: tariff,
            pr: 0.8,
            gridEmissionFactor: gridEmissionFactor,
        };

        return calculateSolarModel(inputs);
    }, [userData, batteryBackup, offset]);

    if (!results) return null;

    // Formatting helpers
    const formatCurrency = (val: number) => {
        const inLakhs = val / 100000;
        return `₹${inLakhs.toFixed(2)} Lakh`;
    };

    const formatSavings = (val: number) => {
        const inLakhs = val / 100000;
        return inLakhs.toFixed(2); // Just the number
    };

    const formatCO2 = (kg: number) => {
        const tonnes = kg / 1000;
        return `${tonnes.toFixed(2)} tCO2e/year`;
    };

    return (
        <div className="bg-white rounded-3xl p-4 w-full h-full flex flex-col justify-center">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                    </svg>
                </div>
                <h2 className="text-base font-bold text-gray-900">Cost Saving through Solar</h2>
            </div>

            <div className="flex flex-col flex-1 justify-between gap-6 py-2">

                {/* Top Section: Inputs */}
                <div className="flex gap-4 w-full shrink-0">
                    <div className="flex-1">
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5h15m-15 0v3.75c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V10.5m-15 0a1.125 1.125 0 0 0-1.125 1.125v2.25A1.125 1.125 0 0 0 4.5 15.375" />
                            </svg>
                            Battery
                        </label>
                        <div className="relative">
                            <select
                                value={batteryBackup}
                                onChange={(e) => setBatteryBackup(Number(e.target.value))}
                                className="w-full appearance-none bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 font-bold cursor-pointer hover:border-blue-300 transition-colors"
                            >
                                {[0, 1, 2, 3, 4, 6, 8, 10, 12].map(hours => (
                                    <option key={hours} value={hours}>{hours} Hr</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-orange-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                            </svg>
                            Electricity Off-Set
                        </label>
                        <div className="relative">
                            <select
                                value={offset}
                                onChange={(e) => setOffset(Number(e.target.value))}
                                className="w-full appearance-none bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 font-bold cursor-pointer hover:border-blue-300 transition-colors"
                            >
                                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(percent => (
                                    <option key={percent} value={percent / 100}>{percent}%</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Section: Details List as Small Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full shrink-0">
                    <div className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-100 flex flex-col justify-center items-center text-center hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                            </svg>
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Roof Area</span>
                        </div>
                        <span className="font-bold text-gray-800 text-sm whitespace-nowrap">{results.roofArea.toFixed(1)} m²</span>
                    </div>
                    <div className="bg-green-50/50 p-2.5 rounded-xl border border-green-100/50 flex flex-col justify-center items-center text-center hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex items-center gap-1.5 text-green-600 mb-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 6-3-3h1.5a3 3 0 1 0 0-6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Capex</span>
                        </div>
                        <span className="font-bold text-gray-800 text-sm whitespace-nowrap">{formatCurrency(results.totalCapex)}</span>
                    </div>
                    <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/50 flex flex-col justify-center items-center text-center hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex items-center gap-1.5 text-purple-600 mb-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Payback</span>
                        </div>
                        <span className="font-bold text-gray-800 text-sm whitespace-nowrap">{results.paybackPeriod != null ? Number(results.paybackPeriod).toFixed(1) : 'N/A'} Yrs</span>
                    </div>
                    <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/50 flex flex-col justify-center items-center text-center hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex items-center gap-1.5 text-purple-600 mb-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Disc. Payback</span>
                        </div>
                        <span className="font-bold text-gray-800 text-sm whitespace-nowrap">{results.discountedPaybackPeriod != null ? Number(results.discountedPaybackPeriod).toFixed(1) : 'N/A'} Yrs</span>
                    </div>
                </div>

                {/* Bottom Section: Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 shrink-0">
                    {/* Annual Savings Box */}
                    <div className="bg-green-50 rounded-2xl p-4 flex flex-col justify-center border border-green-100/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                                </svg>
                            </div>
                            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide leading-tight">Annual<br />Savings</p>
                        </div>
                        <div>
                            <p className="text-xl font-extrabold text-green-700">
                                ₹{formatSavings(results.financials[0].savings)} <span className="text-sm font-bold">L/Yr</span>
                            </p>
                        </div>
                    </div>

                    {/* Carbon Emission Box */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            </div>
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">Carbon<br />Avoided</p>
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-sm">{formatCO2(results.co2Avoided)}</p>
                        </div>
                    </div>

                    {/* Renewable Energy Display (New) */}
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                </svg>
                            </div>
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">Renewable<br />Energy</p>
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-sm">{results.solarEnergyTarget.toFixed(2)} kWh</p>
                        </div>
                    </div>
                </div>

                {/* Added Disclaimer */}
                <div className="mt-4 text-center">
                    <p className="text-[10px] text-gray-500 italic">
                        * The calculation is performed using the given values by the user (including months).
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CostSavingCard;
