
import React from 'react';
import CircularProgress from './CircularProgress';

interface SidebarProps {
    currentStep: number;
    totalSteps: number;
    progressPercentage: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentStep, totalSteps, progressPercentage }) => {
    const steps = [
        { id: 1, label: 'Context setup' },
        { id: 2, label: 'Boundaries' },
        { id: 3, label: 'Energy inputs' },
        { id: 4, label: 'Review and submit' },
        { id: 5, label: 'Admin verification' },
        { id: 6, label: 'Dashboard and certificate' },
    ];

    return (
        <div className="w-full lg:w-96 bg-white border-r border-gray-100 flex flex-col items-center py-8 px-6 h-full">
            {/* Logo Area */}
            <div className="w-full flex flex-col gap-20">
                <div className="flex flex-row items-center gap-4 w-full px-2">
                    <img src="/sustally-logo.png" alt="Sustally" className="h-10 w-auto object-contain flex-shrink-0" />
                    <div className="h-8 w-px bg-gray-300 flex-shrink-0"></div>
                    <p className="text-[10px] text-gray-400 font-medium leading-tight">
                        choose sustally as your sustainability ally
                    </p>
                </div>

                {/* Progress Circle */}
                <div className="flex justify-center">
                    <CircularProgress percentage={progressPercentage} size={140} strokeWidth={12} />
                </div>
            </div>

            {/* Steps List */}
            <div className="w-full space-y-4 mt-16">
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    let circleClasses = "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ";
                    let textClasses = "text-sm font-medium ";

                    // Logic for styling based on state
                    if (stepNumber < currentStep) {
                        // Completed Steps (Green)
                        circleClasses += "bg-green-50 text-green-600 border-green-500";
                        textClasses += "text-gray-400"; // Completed text usually gray or green? User said "circle... in transparent green". Let's stick generic text to gray for completed unless specified, but consistent with design usually current is boldest.
                    } else if (stepNumber === currentStep) {
                        // Current Step (Orange/Yellow - "transperent orange")
                        // Using orange-50 for transparent-ish background
                        circleClasses += "bg-orange-50 text-orange-600 border-orange-500";
                        textClasses += "text-indigo-900 font-bold";
                    } else if (stepNumber >= 5) {
                        // Admin Steps (Indigo - "indigo colur ... all over in admin hands")
                        circleClasses += "bg-indigo-50 text-indigo-600 border-indigo-200";
                        textClasses += "text-gray-400";
                    } else {
                        // Pending Steps (Default Gray)
                        circleClasses += "bg-gray-50 text-gray-400 border-gray-200";
                        textClasses += "text-gray-400";
                    }

                    return (
                        <div key={step.id} className="flex items-center gap-3">
                            <div className={circleClasses}>
                                {stepNumber < currentStep ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    step.id
                                )}
                            </div>
                            <div>
                                <p className={textClasses}>
                                    {step.label}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Sidebar;
