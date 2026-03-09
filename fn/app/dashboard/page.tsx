"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import CostSavingCard from "./CostSavingCard";

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // States: "LOADING" -> "RESTRICTED" -> "OTP" -> "DASHBOARD"
    const [step, setStep] = useState<"LOADING" | "RESTRICTED" | "OTP" | "DASHBOARD">("LOADING");


    const [email, setEmail] = useState(() => {
        const param = searchParams.get("email");
        return param ? param.trim().toLowerCase() : "";
    });
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [initialized, setInitialized] = useState(false);

    // Resend OTP State
    const [resendTimer, setResendTimer] = useState(0);
    const [canResend, setCanResend] = useState(true);

    // Prevent double OTP send on mount (React Strict Mode)
    const hasSentInitialOtp = useRef(false);

    const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    const sendOtp = async (emailAddress: string) => {
        const normalizedEmail = String(emailAddress || "").trim().toLowerCase();
        if (!normalizedEmail) return;
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/scope2-applications/generate-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: normalizedEmail }),
            });

            const data = await res.json();

            if (res.ok) {
                setStep("OTP");
                // Start Resend Timer (15 seconds)
                setResendTimer(15);
                setCanResend(false);
            } else {
                setError(data.error || "Failed to send OTP");
                // If OTP fails (e.g. invalid email in link), stay on RESTRICTED or show error
                setStep("RESTRICTED");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
            setStep("RESTRICTED");
        } finally {
            setLoading(false);
        }
    };

    // Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    useEffect(() => {
        if (!initialized) {
            // Check session storage first
            if (typeof window !== "undefined") {
                const storedUser = sessionStorage.getItem("scope2_user");
                if (storedUser) {
                    setUserData(JSON.parse(storedUser));
                    if (searchParams.get("view") === "dashboard") {
                        setStep("DASHBOARD");
                    } else {
                        router.replace("/scope/certificate");
                    }
                    setInitialized(true);
                    return;
                }
            }

            if (email) {
                setStep("OTP");
                // Prevent double send on React Strict Mode remount
                if (!hasSentInitialOtp.current) {
                    hasSentInitialOtp.current = true;
                    sendOtp(email);
                }
            } else {
                // If no email param and no session, ensure we are in restricted mode
                setStep("RESTRICTED");
            }
            setInitialized(true);
        }
    }, [email, initialized]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendOtp(email);
    };

    const handleResendOtp = async () => {
        if (!canResend) return;
        await sendOtp(email);
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Updated endpoint to Scope 2
            const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/scope2-applications/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: String(email || "").trim().toLowerCase(),
                    otp: String(otp || "").trim(),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setUserData(data.user);

                // Save user data to session storage
                if (typeof window !== "undefined") {
                    sessionStorage.setItem("scope2_user", JSON.stringify(data.user));
                }

                // Redirect to Scope 2 Certificate Page (Clean URL)
                router.replace(`/scope/certificate`);
            } else {
                setError(data.error || "Invalid OTP");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setStep("RESTRICTED");
        setEmail("");
        setOtp("");
        setUserData(null);
        router.push("/"); // Redirect to home or keep on restricted page
    };

    // Render Logic
    if (step === "LOADING") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (step === "RESTRICTED") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                    <div className="mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
                    <p className="text-gray-500 text-sm mb-6">
                        This Dashboard Is Only Accessible Via The Secure Link Sent To Your Registered Email Address Upon Approval.
                    </p>
                    <p className="text-xs text-gray-400">
                        If You Believe This Is An Error, Please Contact Support.
                    </p>
                    {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
                </div>
            </div>
        );
    }

    if (step === "OTP") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Otp</h1>
                        <p className="text-gray-500 text-sm">Enter The Code Sent To {email}</p>
                        <p className="text-gray-400 text-xs mt-2">Wait For A Few Mins For The Otp To Arrive In Your Inbox, If Not Resend Again.</p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">One Time Password</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                required
                            />
                        </div>

                        {error && <p className="text-red-500 text-xs">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center disabled:opacity-70"
                        >
                            {loading ? "Verifying..." : "Verify & Login"}
                        </button>

                        <div className="flex justify-between items-center mt-6">
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={!canResend || loading}
                                className="text-xs text-gray-500 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {canResend ? "Resend" : `Resend In ${resendTimer}s`}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push("/")}
                                className="text-xs text-gray-500 hover:text-indigo-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Dashboard View
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {/* Logo placeholder if needed */}
                    <span className="font-bold text-indigo-600 text-xl">Sustally Dashboard</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                >
                    Logout
                </button>
            </nav>

            <main className="max-w-7xl mx-auto p-6">
                <div className="bg-gray-50 min-h-full">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Welcome, {userData?.name || "User"}!</h2>
                        </div>

                        <CostSavingCard userData={userData} />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
