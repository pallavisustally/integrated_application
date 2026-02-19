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

        // Determine grid consumption
        // If electricityPurchased (units) is available, use it.
        // If not, but spendAmount is available, estimate units = spend / tariff.
        let annualConsumption = 0;
        if (userData.electricityPurchased) {
            annualConsumption = parseFloat(userData.electricityPurchased);
            if (userData.reportingPeriod === 'Monthly') annualConsumption *= 12;
        } else if (userData.spendAmount) {
            const annualSpend = parseFloat(userData.spendAmount) * (userData.reportingPeriod === 'Monthly' ? 12 : 1);
            annualConsumption = annualSpend / tariff;
        }

        // Avoid NaN
        if (isNaN(annualConsumption) || annualConsumption === 0) annualConsumption = 10000; // Fallback for preview

        const inputs = {
            stateIrradiance: irradiance,
            gridConsumption: annualConsumption,
            offset: offset,
            backupHours: batteryBackup,
            tariff: tariff,
            pr: 0.8,
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Inputs Row */}
                    <div className="flex gap-4">
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
                                    className="w-full appearance-none bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 px-4 font-bold cursor-pointer hover:border-blue-300 transition-colors"
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
                                    className="w-full appearance-none bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 px-4 font-bold cursor-pointer hover:border-blue-300 transition-colors"
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

                    {/* Details List */}
                    <div className="space-y-4 pt-4">
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3 text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                </svg>
                                <span>Roof area required</span>
                            </div>
                            <span className="font-bold text-gray-700">{results.roofArea.toFixed(2)} m²</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3 text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 6-3-3h1.5a3 3 0 1 0 0-6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                <span>Capex</span>
                            </div>
                            <span className="font-bold text-gray-700">{formatCurrency(results.totalCapex)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3 text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                <span>Payback</span>
                            </div>
                            <span className="font-bold text-gray-700">{results.paybackPeriod || 'N/A'} Years</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3 text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                <span>Discounted Payback</span>
                            </div>
                            <span className="font-bold text-gray-700">{results.discountedPaybackPeriod || 'N/A'} Years</span>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* Annual Savings Box */}
                    <div className="bg-green-50 rounded-2xl p-6 relative overflow-hidden">
                        {/* Background subtle decoration if needed */}
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Annual Savings</p>
                                <p className="text-base font-bold text-gray-900">Electricity Cost Saved</p>
                            </div>
                        </div>
                        <div className="mt-6">
                            <p className="text-4xl font-extrabold text-green-700">
                                ₹{formatSavings(results.financials[0].savings)} <span className="text-2xl font-bold">Lakhs/Year</span>
                            </p>
                        </div>
                    </div>

                    {/* Carbon Emission Box */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                            {/* Simple Leaf Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">
                                carbon emission avoided
                                <br />
                                <span className="font-bold text-gray-800">{formatCO2(results.co2Avoided)}</span> through solar
                            </p>
                        </div>
                    </div>

                    {/* Renewable Energy Display (New) */}
                    {userData?.renewableEnergyConsumption && (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">
                                    Current Renewable Energy
                                    <br />
                                    <span className="font-bold text-gray-800">{userData.renewableEnergyConsumption}</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CostSavingCard;
