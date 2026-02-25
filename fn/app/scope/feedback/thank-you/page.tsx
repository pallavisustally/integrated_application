"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ThankYouPage() {
    const router = useRouter();

    useEffect(() => {
        // Clear session since they finished everything
        sessionStorage.removeItem("scope2_user");
    }, []);

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 max-w-lg w-full p-10 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-8 h-8 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Feedback Submitted!</h1>
                <p className="text-gray-600 mb-8">
                    Thank you for submitting your feedback and taking your valuable time. We appreciate your insights to help us improve Sustally.
                </p>
                <button
                    onClick={() => router.push("/")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-3 px-8 rounded-lg shadow-sm transition-colors"
                >
                    Back to Home
                </button>
            </div>
        </main>
    );
}
