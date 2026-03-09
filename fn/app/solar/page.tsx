"use client";

import { useState, useMemo } from "react";
import { STATE_DATA } from "../../lib/solar-data";
import { calculateSolarModel, SolarInputs, SolarResults } from "../../lib/solar-calculations";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function SolarPage() {
    const [inputs, setInputs] = useState<SolarInputs>({
        stateIrradiance: STATE_DATA[0].irradiance,
        gridConsumption: 10000,
        offset: 0.5,
        backupHours: 4,
        tariff: STATE_DATA[0].tariff,
        pr: 0.75,
    });


    const [selectedState, setSelectedState] = useState(STATE_DATA[0].name);
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");

    // Derived state for the current state object
    const currentStateData = useMemo(() =>
        STATE_DATA.find((s) => s.name === selectedState) || STATE_DATA[0]
        , [selectedState]);

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStateName = e.target.value;
        const newStateData = STATE_DATA.find((s) => s.name === newStateName);

        if (newStateData) {
            setSelectedState(newStateName);
            setSelectedDistrict(""); // Reset district on state change

            setInputs((prev) => ({
                ...prev,
                stateIrradiance: newStateData.irradiance,
                tariff: newStateData.tariff,
            }));
        }
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDistrictName = e.target.value;
        setSelectedDistrict(newDistrictName);

        const districtData = currentStateData.districts?.find(d => d.name === newDistrictName);

        if (districtData) {
            setInputs((prev) => ({
                ...prev,
                stateIrradiance: districtData.annualIrradiance,
            }));
        } else {
            // Revert to state average if "All Districts" or invalid selection
            setInputs((prev) => ({
                ...prev,
                stateIrradiance: currentStateData.irradiance,
            }));
        }
    };


    const results: SolarResults = useMemo(() => {
        return calculateSolarModel(inputs);
    }, [inputs]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Solar PV + Battery System Model</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Inputs Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                                System Inputs
                            </h2>

                            <div className="space-y-4">
                                {/* State Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">State / Location</label>
                                    <select
                                        value={selectedState}
                                        onChange={handleStateChange}
                                        className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all mb-2"
                                    >
                                        {STATE_DATA.map((state) => (
                                            <option key={state.name} value={state.name}>
                                                {state.name}
                                            </option>
                                        ))}
                                    </select>

                                    {currentStateData.districts && currentStateData.districts.length > 0 && (
                                        <select
                                            value={selectedDistrict}
                                            onChange={handleDistrictChange}
                                            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                                        >
                                            <option value="">State Average</option>
                                            {currentStateData.districts.map((district) => (
                                                <option key={district.name} value={district.name}>
                                                    {district.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Grid Consumption */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Annual Electricity Demand (kWh)</label>
                                    <input
                                        type="number"
                                        value={inputs.gridConsumption}
                                        onChange={(e) => setInputs({ ...inputs, gridConsumption: Number(e.target.value) })}
                                        className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                                    />
                                </div>

                                {/* Offset Slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-sm font-semibold text-gray-700">Solar Offset</label>
                                        <span className="text-sm font-bold text-indigo-600">{(inputs.offset * 100).toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={inputs.offset}
                                        onChange={(e) => setInputs({ ...inputs, offset: Number(e.target.value) })}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Target Solar Energy: {(inputs.gridConsumption * inputs.offset).toFixed(0)} kWh/yr</p>
                                </div>

                                {/* Battery Backup */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Battery Backup (Hours)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="24"
                                            step="1"
                                            value={inputs.backupHours}
                                            onChange={(e) => setInputs({ ...inputs, backupHours: Number(e.target.value) })}
                                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <input
                                            type="number"
                                            value={inputs.backupHours}
                                            onChange={(e) => setInputs({ ...inputs, backupHours: Number(e.target.value) })}
                                            className="w-16 h-10 px-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Advanced / Read-only */}
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Tariff (Rs/kWh)</label>
                                            <input
                                                type="number"
                                                value={inputs.tariff}
                                                onChange={(e) => setInputs({ ...inputs, tariff: Number(e.target.value) })}
                                                className="w-full h-8 px-2 bg-gray-100 border border-transparent rounded text-xs text-gray-600 focus:bg-white focus:border-gray-200 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Perf. Ratio (PR)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={inputs.pr}
                                                onChange={(e) => setInputs({ ...inputs, pr: Number(e.target.value) })}
                                                className="w-full h-8 px-2 bg-gray-100 border border-transparent rounded text-xs text-gray-600 focus:bg-white focus:border-gray-200 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Key Metrics Summary Card */}
                        <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-lg">
                            <h3 className="text-lg font-bold mb-4 opacity-90">Estimated System Size</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs opacity-75 tracking-wide">Pv Capacity</p>
                                    <p className="text-2xl font-bold">{results.pvSize.toFixed(2)} <span className="text-sm font-normal opacity-80">kW</span></p>
                                </div>
                                <div>
                                    <p className="text-xs opacity-75 tracking-wide">Battery</p>
                                    <p className="text-2xl font-bold">{results.batteryCapacity.toFixed(2)} <span className="text-sm font-normal opacity-80">kWh</span></p>
                                </div>
                                <div className="col-span-2 pt-4 border-t border-indigo-500/50">
                                    <p className="text-xs opacity-75 tracking-wide">Est. Roof Area</p>
                                    <p className="text-xl font-semibold">{results.roofArea.toFixed(1)} <span className="text-sm font-normal opacity-80">m²</span></p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Results Panel */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Financial Overview Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 tracking-widest mb-1">Total Capex</p>
                                <p className="text-2xl font-bold text-gray-900">₹{(results.totalCapex / 100000).toFixed(2)} <span className="text-sm text-gray-500">Lakh</span></p>
                                <p className="text-xs text-gray-500 mt-2">PV: ₹{(results.pvCapex / 100000).toFixed(2)}L | Batt: ₹{(results.batteryCapex / 100000).toFixed(2)}L</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 tracking-widest mb-1">Annual Savings</p>
                                <p className="text-2xl font-bold text-green-600">₹{(results.financials[0].savings / 1000).toFixed(1)} <span className="text-sm text-gray-500">k/yr</span></p>
                                <p className="text-xs text-gray-500 mt-2">First Year Utility Savings</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 tracking-widest mb-1">Payback Period</p>
                                <p className="text-2xl font-bold text-indigo-600">{results.paybackPeriod ?? "> 25"} <span className="text-sm text-gray-500">Years</span></p>
                                <p className="text-xs text-gray-500 mt-2">Discounted: {results.discountedPaybackPeriod ?? ">25"} Years</p>
                            </div>
                        </div>

                        {/* Cashflow Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Cumulative Cashflow Analysis</h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={results.financials}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(val: number) => [`₹${(val).toFixed(0)}`, '']}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="cumulativeCashflow"
                                            name="Cumulative Cashflow"
                                            stroke="#4F46E5"
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="cumulativeDiscountedCashflow"
                                            name="Discounted Cashflow"
                                            stroke="#9CA3AF"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Environmental Impact */}
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 flex items-center justify-between">
                            <div>
                                <h4 className="text-emerald-800 font-bold text-lg mb-1">Environmental Impact</h4>
                                <p className="text-emerald-600 text-sm">Estimated CO₂ emissions avoided per year.</p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-extrabold text-emerald-600">{results.co2Avoided.toFixed(1)} <span className="text-lg font-medium">kg</span></p>
                                <p className="text-xs text-emerald-500 font-medium">CO₂ / Year</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
