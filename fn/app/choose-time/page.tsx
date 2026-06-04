"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "../../components/Modal";
import { bookAssessment, type AssessmentType } from "../../lib/assessment-api";
import {
    buildBookingDateSlots,
    type BookingDateSlot,
} from "../../lib/booking-date-slots";

const CHOOSE_TIME_STORAGE_KEY = "chooseTimeData:v2";

// Reusing Icons from Page 1
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-100">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
);

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

const CloudIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
);

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(date); // e.g. January 28, 2026
};

const getDayNumber = (date: Date) => new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
const getMonthName = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
type ShiftType = "Now" | "Morning" | "Afternoon" | "Evening";

const timeSlotsByShift: Record<ShiftType, string[]> = {
    Now: ["Immediately"],
    Morning: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"],
    Afternoon: ["12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"],
    Evening: ["05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"]
};

// Helper to check if a time slot is in the past (for Today)
const isTimeSlotInPast = (timeSlot: string) => {
    if (timeSlot === "Immediately") return false;
    const date = new Date();
    const currentHours = date.getHours();
    const currentMinutes = date.getMinutes();

    // Parse time slot
    // Format: "HH:MM AM/PM"
    const [time, period] = timeSlot.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    if (hours < currentHours) return true;
    if (hours === currentHours && minutes <= currentMinutes) return true;

    return false;
};

const shifts: { label: ShiftType; icon: React.ReactNode; range: string }[] = [
    { label: "Morning", icon: <SunIcon />, range: "9 AM - 12 PM" },
    { label: "Afternoon", icon: <CloudIcon />, range: "12 PM - 5 PM" },
    { label: "Evening", icon: <MoonIcon />, range: "5 PM - 8 PM" }
];

function ChooseTimeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedDateIndex, setSelectedDateIndex] = useState<number | null>(null);
    const [selectedShift, setSelectedShift] = useState<ShiftType | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [assessmentLinkToRedirect, setAssessmentLinkToRedirect] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [bookedAssessmentId, setBookedAssessmentId] = useState<string | null>(null);
    const [bookedAssessmentLink, setBookedAssessmentLink] = useState<string | null>(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [dates, setDates] = useState<BookingDateSlot[]>([]);

    // Compute on the client so slots always match the user's current calendar day.
    useEffect(() => {
        sessionStorage.removeItem("chooseTimeData");
        setDates(buildBookingDateSlots());
    }, []);

    useEffect(() => {
        const saved = sessionStorage.getItem(CHOOSE_TIME_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.selectedDateIndex !== undefined) setSelectedDateIndex(parsed.selectedDateIndex);
                if (parsed.selectedShift !== undefined) setSelectedShift(parsed.selectedShift);
                if (parsed.selectedTime !== undefined) setSelectedTime(parsed.selectedTime);
                if (parsed.termsAccepted !== undefined) setTermsAccepted(parsed.termsAccepted);
            } catch (e) { }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded || dates.length === 0) return;
        if (selectedDateIndex !== null && selectedDateIndex >= dates.length) {
            setSelectedDateIndex(null);
            setSelectedShift(null);
            setSelectedTime(null);
        }
    }, [isLoaded, dates, selectedDateIndex]);

    useEffect(() => {
        if (isLoaded) {
            sessionStorage.setItem(CHOOSE_TIME_STORAGE_KEY, JSON.stringify({
                selectedDateIndex,
                selectedShift,
                selectedTime,
                termsAccepted
            }));
        }
    }, [selectedDateIndex, selectedShift, selectedTime, termsAccepted, isLoaded]);

    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && assessmentLinkToRedirect) {
            router.push(assessmentLinkToRedirect);
        }
    }, [countdown, assessmentLinkToRedirect, router]);


    const handleDateSelect = (index: number) => {
        if (!dates[index]) return;
        setSelectedDateIndex(index);
        const now = new Date();
        const isTodaySelected = dates[index].date.getDate() === now.getDate() && dates[index].date.getMonth() === now.getMonth() && dates[index].date.getFullYear() === now.getFullYear();
        if (selectedShift === "Now" && !isTodaySelected) {
            setSelectedShift(null);
        }
        setSelectedTime(null);
    };

    const handleShiftSelect = (shift: ShiftType) => {
        setSelectedShift(shift);
        if (shift === "Now") {
            setSelectedTime("Immediately");
        } else {
            setSelectedTime(null); // Reset time when shift changes
        }
    }

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
    };

    const getAssessmentType = (): AssessmentType => {
        const t = searchParams.get("assessmentType");
        return t === "SCOPE_1" ? "SCOPE_1" : "SCOPE_2";
    };

    const assessmentType = getAssessmentType();
    const isScope1 = assessmentType === "SCOPE_1";

    const buildBookingQuery = () => {
        const params = new URLSearchParams();
        searchParams.forEach((value, key) => {
            if (value) params.append(key, value);
        });
        return params.toString();
    };

    useEffect(() => {
        if (!searchParams.get("assessmentType")) {
            const qs = buildBookingQuery();
            router.replace(qs ? `/choose-assessment?${qs}` : "/choose-assessment");
        }
    }, [router, searchParams]);

    const getCountryLabel = () => {
        const country = searchParams.get("country") || "India";
        if (country === "Other") {
            return searchParams.get("otherCountryName") || "Other";
        }
        return country;
    };

    const prepareEmailPayload = (
        assessmentId: string,
        assessmentLink: string,
        assignmentDate: string,
        assignmentTime: string,
    ) => {
        const renewableEnergyStr = searchParams.get("renewableEnergy") || "0";
        const totalEnergyStr = searchParams.get("totalEnergy") || "0";
        const renewableEnergy = parseFloat(renewableEnergyStr.replace(/[^\d.]/g, "")) || 0;
        const totalEnergy = parseFloat(totalEnergyStr.replace(/[^\d.]/g, "")) || 0;
        const renewablePercentage =
            totalEnergy > 0
                ? parseFloat(((renewableEnergy / totalEnergy) * 100).toFixed(2))
                : 0;

        return {
            name: searchParams.get("name") || "-",
            mobile: searchParams.get("mobile") || "-",
            email: searchParams.get("email") || "-",
            company: searchParams.get("company") || "-",
            country: getCountryLabel(),
            assessmentType: getAssessmentType(),
            renewableEnergy: renewableEnergyStr || "-",
            totalEnergy: totalEnergyStr || "-",
            renewablePercentage,
            assignmentDate,
            assignmentSlot: selectedShift || "-",
            assignmentTime,
            assessmentId,
            assessmentLink,
            expireTime: `${assignmentDate} at 11:59 PM`,
        };
    };

    const sendBookingEmail = async (data: any) => {
        setIsSendingEmail(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_SUSTALLY_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const response = await fetch(`${apiUrl}/api/send-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            let result;
            try {
                result = await response.json();
            } catch (parseError) {
                console.error("Failed to parse response:", parseError);
                setNotification({
                    message: "Failed to send email: Invalid response from server.",
                    type: "error"
                });
                return false;
            }

            if (response.ok && result.success) {
                return true;
            } else {
                const errorMessage = result.error || result.message || `Server error (${response.status})`;
                setNotification({ message: `Failed to send email: ${errorMessage}`, type: "error" });
                return false;
            }
        } catch (error) {
            console.error("Error sending email:", error);
            setNotification({
                message: "Failed to send email. Please check your connection.",
                type: "error"
            });
            return false;
        } finally {
            setIsSendingEmail(false);
        }
    };

    const createBooking = async (forceNew = false) => {
        if (selectedDateIndex === null || !selectedTime) return null;

        const assignmentDate = formatDate(dates[selectedDateIndex].date);
        const assignmentTime = selectedTime;

        if (!forceNew && bookedAssessmentId && bookedAssessmentLink) {
            return prepareEmailPayload(
                bookedAssessmentId,
                bookedAssessmentLink,
                assignmentDate,
                assignmentTime,
            );
        }

        const email = searchParams.get("email")?.trim();
        if (!email) {
            setNotification({ message: "Email is required. Go back and complete Step 1.", type: "error" });
            return null;
        }

        const result = await bookAssessment({
            assessmentType: getAssessmentType(),
            email,
            name: searchParams.get("name") || undefined,
            mobile: searchParams.get("mobile") || undefined,
            company: searchParams.get("company") || undefined,
            country: getCountryLabel(),
            legalEntityId: searchParams.get("legalEntityId") || undefined,
            siteCount: searchParams.get("siteCount") || undefined,
            siteCountNumber: searchParams.get("siteCountNumber") || undefined,
            conditionalApproach: searchParams.get("conditionalApproach") || undefined,
            assignmentDate,
            assignmentSlot: selectedShift || undefined,
            assignmentTime: selectedTime,
        });

        if (!result.success) {
            setNotification({ message: result.error, type: "error" });
            return null;
        }

        setBookedAssessmentId(result.assessment.assessmentId);
        setBookedAssessmentLink(result.assessment.assessmentLink);
        return prepareEmailPayload(
            result.assessment.assessmentId,
            result.assessment.assessmentLink,
            assignmentDate,
            assignmentTime,
        );
    };

    const handleConfirmBooking = async () => {
        if (selectedDateIndex === null || !selectedTime) return;

        const data = await createBooking();
        if (!data) return;

        if (selectedShift === "Now") {
            const url = new URL(data.assessmentLink);
            setAssessmentLinkToRedirect(url.pathname + url.search);
            setIsSuccess(true);
            setCountdown(10);
            sendBookingEmail(data);
            return;
        }

        const success = await sendBookingEmail(data);
        if (success) {
            setIsSuccess(true);
        }
    };

    const handleResendEmail = async () => {
        const data = await createBooking(false);
        if (!data) return;

        const success = await sendBookingEmail(data);
        if (success) {
            setNotification({
                message: "Email sent successfully!",
                type: "success"
            });
        }
    };

    if (isSuccess) {
        if (countdown !== null) {
            return (
                <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-200">
                        <div 
                            className="h-full bg-indigo-500 transition-all duration-1000 ease-linear" 
                            style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                        ></div>
                    </div>
                    
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center relative z-10 border border-gray-100">
                        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6 relative">
                            <span className="text-3xl font-bold text-indigo-600 font-mono tracking-tighter">
                                {countdown}
                            </span>
                            <svg className="absolute inset-0 w-full h-full text-indigo-200 animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="30 10" />
                            </svg>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Preparing Assessment
                        </h2>
                        <p className="text-sm text-gray-500 mb-8 max-w-[280px]">
                            Your Scope 2 Environment Assessment is being initialized. You will be redirected shortly...
                        </p>

                        <div className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-semibold text-gray-900">Instant Access</h3>
                                <p className="text-xs text-gray-500">We've also emailed you a backup link.</p>
                            </div>
                        </div>

                        {countdown === 0 && (
                            <div className="mt-8 text-indigo-600 font-medium text-sm animate-pulse flex items-center gap-2">
                                <span>Redirecting</span>
                                <span className="flex gap-0.5">
                                    <span className="w-1 h-1 bg-indigo-600 rounded-full animate-[bounce_1s_infinite_0ms]"></span>
                                    <span className="w-1 h-1 bg-indigo-600 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                                    <span className="w-1 h-1 bg-indigo-600 rounded-full animate-[bounce_1s_infinite_400ms]"></span>
                                </span>
                            </div>
                        )}
                    </div>
                </main>
            );
        }

        return (
            <main className="min-h-screen bg-white px-4 py-8 sm:px-6 sm:py-10 flex flex-col items-center">
                {/* Header (logo then tick on mobile) */}
                <div className="w-full max-w-3xl flex flex-col items-center text-center">
                    <div className="flex items-center justify-center gap-2 sm:gap-3 opacity-90 flex-wrap">
                        <img src="/sustally-logo.png" alt="Sustally" className="h-10 sm:h-12 w-auto object-contain" />
                        <div className="flex h-8 sm:h-10">
                            <div className="w-px bg-gray-200 h-full" />
                        </div>
                        <span className="font-medium text-gray-500 sm:text-gray-700 text-xs sm:text-sm max-w-[180px] sm:max-w-[220px] leading-tight text-left">
                            Choose Sustally As Your Sustainability Ally
                        </span>
                    </div>
                </div>

                <div className="w-full max-w-3xl flex-1 flex flex-col items-center justify-center text-center gap-6 mt-10">
                    {/* Success Checkmark */}
                    <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center shadow-[0_0_30px_rgba(76,175,80,0.20)]">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                            Thank You! Your Assessment Slot Is Booked.
                        </h2>
                        <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
                            Please Check Your Email For The Assessment Link.
                        </p>
                    </div>

                    {/* Booking Time Card */}
                    <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-center gap-6">
                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F57C00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </div>
                        <div className="text-left min-w-0">
                            <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                                {selectedDateIndex !== null ? formatDate(dates[selectedDateIndex].date) : ""}
                            </div>
                            <div className="text-sm sm:text-base font-semibold text-gray-900">
                                {selectedTime}
                            </div>
                        </div>
                    </div>

                    <div className="text-base sm:text-lg font-normal text-gray-900 tracking-wide">
                        Assessment Id: <span className="font-normal">{bookedAssessmentId || "—"}</span>
                    </div>

                    {/* Email Confirmation Banner */}
                    <div className="w-full max-w-2xl bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-start sm:items-center gap-4 text-left">
                        <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-green-800">
                                A Confirmation And Assessment Link Has Been Sent To Your Registered Contact Email.
                            </p>
                            <p className="text-xs sm:text-sm text-green-700 mt-1">
                                Check Your Inbox (And Spam Folder) For The Access Link.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Resend Email Option */}
                <div className="mt-8 flex justify-center items-center gap-1.5 w-full text-sm">
                    <span className="text-gray-600">
                        Didn't Receive Email At <span className="font-semibold text-gray-900">{searchParams.get("email")}</span>?
                    </span>
                    <button
                        onClick={handleResendEmail}
                        disabled={isSendingEmail}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSendingEmail ? "Sending..." : "Resend"}
                    </button>
                </div>
            </main>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gray-50 text-gray-800 font-sans selection:bg-indigo-100 p-2 md:p-4 flex flex-col">
            {/* Notification Popup */}
            {notification && (
                <div
                    style={{
                        position: "fixed",
                        top: "10%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 10000,
                        backgroundColor: notification.type === "success" ? "#1a1a1a" : "#2a1a1a",
                        border: `2px solid ${notification.type === "success" ? "#4CAF50" : "#FF6B35"}`,
                        borderRadius: "16px",
                        padding: "16px 24px",
                        boxShadow: `0 8px 32px rgba(${notification.type === "success" ? "76, 175, 80" : "255, 107, 53"}, 0.4)`,
                        minWidth: "300px",
                        maxWidth: "500px",
                        animation: "slideIn 0.3s ease-out",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <p style={{ margin: 0, color: "#FFFFFF", fontSize: "14px", fontWeight: "500" }}>{notification.message}</p>
                        <button
                            onClick={() => setNotification(null)}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#B5B5B5",
                                cursor: "pointer",
                                marginLeft: "auto"
                            }}
                        >✕</button>
                    </div>
                </div>
            )}

            <div className="w-full h-full max-w-7xl mx-auto flex flex-col">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-2 flex-shrink-0 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full tracking-wide">
                                {isScope1 ? "Scope 1 Assessment" : "Scope 2 Assessment"}
                            </span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {isScope1
                                ? "Book Your Scope 1 Self Assessment"
                                : "Book Your Scope 2 Self Assessment"}
                        </h1>
                        <p className="text-gray-500 mt-1 text-xs">
                            Select A Convenient Time For Your Assessment.
                        </p>
                    </div>

                    {/* Centered Progress Step */}
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-xs font-semibold text-gray-400 tracking-widest mb-1">
                            Step 3 Of 6 — Choose Time
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="h-1 w-32 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 w-[50%]"></div>
                            </div>
                            <span className="text-sm font-bold text-gray-400">50%</span>
                        </div>
                    </div>

                    <div className="mt-6 md:mt-0 flex flex-col items-end">
                        <div className="flex items-center gap-3 opacity-80">
                            <img
                                src="/sustally-logo.png"
                                alt="sustally"
                                className="h-12 w-auto object-contain"
                            />
                            <div className="flex gap-1 h-12">
                                <div className="w-[1px] bg-gray-300 h-full"></div>

                            </div>
                            <span className="font-medium text-gray-500 text-sm max-w-[200px] leading-tight text-left">
                                Choose Sustally As Your Sustainability Ally
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-h-0 flex flex-col mb-4">

                    {/* Date and Time Selection */}
                    <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-y-auto">
                        <div className="absolute top-6 left-6">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                                <CalendarIcon />
                            </div>
                        </div>

                        <h2 className="text-[10px] font-bold text-gray-400 tracking-wider mb-6 ml-14 pt-6">Select Date & Time</h2>

                        <div className="space-y-6">
                            {/* Date Selection */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Select A Date <span className="text-red-500">*</span>
                                </label>
                                <p className="text-[10px] text-gray-500 mb-3">Choose Your Preferred Assessment Date</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    {dates.length === 0 && (
                                        <p className="col-span-full text-xs text-gray-500">Loading available dates…</p>
                                    )}
                                    {dates.map((d, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleDateSelect(index)}
                                            className={`relative p-6 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 min-h-[140px] ${selectedDateIndex === index
                                                ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 shadow-sm"
                                                : "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md"
                                                }`}
                                        >
                                            {selectedDateIndex === index && (
                                                <div className="absolute top-3 right-3 text-indigo-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                            <span className={`text-4xl font-bold ${selectedDateIndex === index ? "text-indigo-600" : "text-gray-900"}`}>
                                                {getDayNumber(d.date)}
                                            </span>
                                            <span className={`text-sm font-medium ${selectedDateIndex === index ? "text-indigo-600" : "text-gray-900"}`}>
                                                {getMonthName(d.date)}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium">
                                                {d.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>


                            {/* Shift Selection */}
                            {selectedDateIndex !== null && (
                                <div className="animate-fade-in">
                                    <label className="block text-xs font-medium text-gray-700 mb-2">
                                        Select Time Of Day <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-[10px] text-gray-500 mb-3">Choose Your Preferred Time Period</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                        {(() => {
                                            const now = new Date();
                                            const isTodaySelected = dates[selectedDateIndex]?.date.getDate() === now.getDate() && dates[selectedDateIndex]?.date.getMonth() === now.getMonth() && dates[selectedDateIndex]?.date.getFullYear() === now.getFullYear();
                                            return (
                                                <button
                                                    key="Now"
                                                    onClick={() => handleShiftSelect("Now")}
                                                    disabled={!isTodaySelected}
                                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all h-[120px] gap-2 ${
                                                        !isTodaySelected
                                                            ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-100"
                                                            : selectedShift === "Now"
                                                                ? "bg-gray-900 text-white border-gray-900 shadow-md"
                                                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                                        }`}
                                                >
                                                    <div className={`${selectedShift === "Now" ? "text-white" : "text-gray-900"}`}>
                                                        <ClockIcon />
                                                    </div>
                                                    <span className={`text-sm font-bold ${selectedShift === "Now" ? "text-white" : "text-gray-900"}`}>
                                                        Now
                                                    </span>
                                                    <span className={`text-[10px] font-medium ${selectedShift === "Now" ? "text-gray-300" : "text-gray-500"}`}>
                                                        Immediately
                                                    </span>
                                                </button>
                                            );
                                        })()}
                                        {shifts.map((shift) => {
                                            // Optional: Filter shifts if all its slots are past (for Today)
                                            // But for now, let's just let the user click and see empty/filtered slots or handle it here
                                            // Let's filter shifts that are completely in the past
                                            let isShiftAvailable = true;

                                            if (selectedDateIndex !== null) {
                                                const isToday = dates[selectedDateIndex].label === "Today";
                                                if (isToday) {
                                                    const availableSlots = timeSlotsByShift[shift.label].filter(t => !isTimeSlotInPast(t));
                                                    if (availableSlots.length === 0) isShiftAvailable = false;
                                                }
                                            }

                                            return (
                                                <button
                                                    key={shift.label}
                                                    onClick={() => handleShiftSelect(shift.label)}
                                                    disabled={!isShiftAvailable}
                                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all h-[120px] gap-2 ${!isShiftAvailable
                                                        ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-100"
                                                        : selectedShift === shift.label
                                                            ? "bg-gray-900 text-white border-gray-900 shadow-md"
                                                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                                        }`}
                                                >
                                                    <div className={`${selectedShift === shift.label ? "text-white" : "text-gray-900"}`}>
                                                        {shift.icon}
                                                    </div>
                                                    <span className={`text-sm font-bold ${selectedShift === shift.label ? "text-white" : "text-gray-900"}`}>
                                                        {shift.label}
                                                    </span>
                                                    <span className={`text-[10px] font-medium ${selectedShift === shift.label ? "text-gray-300" : "text-gray-500"}`}>
                                                        {shift.range}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Time Selection */}
                            {selectedShift !== null && (
                                <div className="min-h-[150px] animate-fade-in">
                                    {selectedShift === "Now" ? (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3 mt-4 w-full">
                                            <div className="mt-0.5 text-indigo-500">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-indigo-900 mb-1">Instant Assessment Access</h4>
                                                <p className="text-xs text-indigo-700 leading-relaxed">
                                                    By selecting "Now", your assessment link will be generated instantly and ready to start within 10 seconds of confirming your booking.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <label className="block text-xs font-medium text-gray-700 mb-2">
                                                Select Specific Time <span className="text-red-500">*</span>
                                            </label>
                                            <p className="text-[10px] text-gray-500 mb-3">Pick Your Exact Appointment Time</p>

                                            <div className="flex flex-wrap gap-3">
                                                {timeSlotsByShift[selectedShift]
                                                    .filter(time => {
                                                        if (selectedDateIndex !== null) {
                                                            const isToday = dates[selectedDateIndex].label === "Today";
                                                            if (isToday) {
                                                                return !isTimeSlotInPast(time);
                                                            }
                                                        }
                                                        return true;
                                                    })
                                                    .map((time) => (
                                                        <button
                                                            key={time}
                                                            onClick={() => handleTimeSelect(time)}
                                                            className={`py-3 px-6 rounded-full text-xs font-bold transition-all text-center border min-w-[100px] ${selectedTime === time
                                                                ? "bg-white text-indigo-600 border-indigo-500 ring-1 ring-indigo-500 shadow-sm"
                                                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                                                }`}
                                                        >
                                                            {time}
                                                        </button>
                                                    ))}
                                                {/* Show message if all slots are filtered out but shift was selectable (edge case) */}
                                                {timeSlotsByShift[selectedShift].filter(time => {
                                                    if (selectedDateIndex !== null) {
                                                        const isToday = dates[selectedDateIndex].label === "Today";
                                                        if (isToday) return !isTimeSlotInPast(time);
                                                    }
                                                    return true;
                                                }).length === 0 && (
                                                        <p className="text-xs text-gray-500 italic w-full text-center py-4">
                                                            No Available Slots For This Shift Today.
                                                        </p>
                                                    )}
                                            </div>

                                            {!selectedTime && (
                                                <p className="text-[10px] text-gray-400 mt-2 italic animate-pulse">
                                                    * Select A Time Slot To Proceed.
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Terms and Conditions */}
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 transition-all checked:border-gray-900 checked:bg-indigo-500 group-hover:border-gray-400"
                                    />
                                    <svg
                                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity peer-checked:opacity-100 text-white w-3 h-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </div>
                                <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors select-none">
                                    I Agree To The <span
                                        className="underline decoration-dotted font-medium text-gray-800 hover:text-indigo-600 cursor-pointer"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowTerms(true);
                                        }}
                                    >
                                        Terms And Conditions
                                    </span>
                                </span>
                            </label>
                        </div>

                        {/* Action Bar */}
                        <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    const qs = buildBookingQuery();
                                    router.push(qs ? `/choose-assessment?${qs}` : "/choose-assessment");
                                }}
                                className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                &larr; Back
                            </button>
                            <button
                                onClick={handleConfirmBooking}
                                disabled={!selectedTime || !termsAccepted || isSendingEmail}
                                className={`flex items-center gap-1.5 px-6 py-2 rounded-xl font-bold transition-all transform ${selectedTime && termsAccepted && !isSendingEmail
                                    ? "bg-indigo-500 hover:bg-indigo-500 text-white hover:scale-105 cursor-pointer shadow-lg text-sm"
                                    : "bg-indigo-500 text-white cursor-not-allowed text-sm"
                                    }`}
                            >
                                {isSendingEmail ? "Booking..." : "Confirm Booking"}
                                {!isSendingEmail && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            {/* Terms and Conditions Modal */}
            <Modal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
                title="Terms and Conditions"
            >
                <ol className="text-sm text-gray-600 space-y-4 list-decimal pl-5">
                    <li>
                        This Application is established for the purpose of administering the GCG assessment process, including assessment scheduling, examination conduct, administrative review, and certificate issuance.
                    </li>
                    <li>
                        By using this Application, the user represents and warrants that all information provided is true, accurate, complete, and lawfully belongs to the user. Any misrepresentation may result in disqualification or termination of access.
                    </li>
                    <li>
                        Users shall adhere strictly to all examination rules and ethical standards. Any act of misconduct, unauthorized access, data manipulation, or misuse of the Application shall result in immediate invalidation of the assessment and may lead to further legal action.
                    </li>
                    <li>
                        All assessment outcomes are subject to administrative review and verification. Certificates shall be generated and issued only upon successful completion of such verification and approval processes.
                    </li>
                    <li>
                        The Application implements appropriate technical and organizational security measures to safeguard personal, assessment, and certification data. User information shall not be disclosed, shared, or leaked to any unauthorized third party, except as required by applicable law or regulatory authority.
                    </li>
                    <li>
                        The Application owner reserves the right to modify, suspend, or terminate access to the Application, in whole or in part, at its sole discretion, in the event of a violation of these Terms and Conditions.
                    </li>
                </ol>
            </Modal>
        </div>
    );
}

export default function ChooseTimePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ChooseTimeContent />
        </Suspense>
    );
}
