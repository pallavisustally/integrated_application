import React from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
    currentStep: number;
    progressPercentage: number;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentStep, progressPercentage }) => {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
            <Sidebar currentStep={currentStep} totalSteps={6} progressPercentage={progressPercentage} />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
