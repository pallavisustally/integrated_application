"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "../../components/Modal";
import { BookingWizardShell, useWizardTheme } from "@/components/booking-shell";
import { bookAssessment, type AssessmentType } from "../../lib/assessment-api";
import { SUSTALLY_API_URL } from "../../lib/api-url";
import {
    buildBookingDateSlots,
    type BookingDateSlot,
} from "../../lib/booking-date-slots";

const CHOOSE_TIME_STORAGE_KEY = "chooseTimeData:v2";

// Reusing Icons from Page 1
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
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
    const { theme, toggleTheme } = useWizardTheme();

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
            const response = await fetch(`${SUSTALLY_API_URL}/api/send-email`, {
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
                <BookingWizardShell step={3} theme={theme} onThemeToggle={toggleTheme}>
                    <section className="step-page active booking-page">
                        <div className="booking-success-page">
                            <div className="form-card booking-success-card">
                                <div className="booking-success-icon" style={{ position: "relative", width: 80, height: 80 }}>
                                    <span style={{ fontSize: 28, fontWeight: 800, color: "var(--purple)" }}>{countdown}</span>
                                </div>
                                <h1 className="step-title" style={{ fontSize: 28 }}>
                                    Preparing <em>assessment</em>
                                </h1>
                                <p className="step-sub" style={{ marginBottom: 24 }}>
                                    Your {isScope1 ? "Scope 1" : "Scope 2"} assessment is being initialized. You will be redirected shortly.
                                </p>
                                <div className="booking-callout" style={{ textAlign: "left" }}>
                                    <div>
                                        <strong>Instant access</strong>
                                        <p>We&apos;ve also emailed you a backup link.</p>
                                    </div>
                                </div>
                                {countdown === 0 ? (
                                    <p className="booking-field-hint" style={{ marginTop: 20, color: "var(--purple)" }}>
                                        Redirecting…
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </section>
                </BookingWizardShell>
            );
        }

        return (
            <BookingWizardShell step={3} theme={theme} onThemeToggle={toggleTheme}>
                <section className="step-page active booking-page">
                    <div className="booking-success-page">
                        <div className="form-card booking-success-card">
                            <div className="booking-success-hero">
                                <div className="booking-success-icon">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <h1 className="step-title" style={{ fontSize: 28 }}>
                                    Slot <em>booked</em>
                                </h1>
                                <p className="step-sub">
                                    Check your email for the assessment link.
                                </p>
                            </div>

                            <div className="booking-success-slot-wrap">
                                <div className="booking-slot-card">
                                    <div className="booking-panel-icon" style={{ width: 48, height: 48 }}>
                                        <CalendarIcon />
                                    </div>
                                    <div className="booking-slot-details">
                                        <div>
                                            {selectedDateIndex !== null ? formatDate(dates[selectedDateIndex].date) : ""}
                                        </div>
                                        <div>{selectedTime}</div>
                                    </div>
                                </div>
                                <p className="booking-success-assessment-id">
                                    Assessment ID: {bookedAssessmentId || "—"}
                                </p>
                            </div>

                            <div className="booking-confirm-banner">
                                <div className="booking-success-icon" style={{ width: 36, height: 36, margin: 0 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>
                                        A confirmation and assessment link has been sent to your registered email.
                                    </p>
                                    <p className="booking-field-hint" style={{ marginTop: 4 }}>
                                        Check your inbox (and spam folder) for the access link.
                                    </p>
                                </div>
                            </div>

                            <div className="booking-success-resend">
                                <p>
                                    Didn&apos;t receive email at{" "}
                                    <span className="booking-success-email">{searchParams.get("email")}</span>?
                                </p>
                                <button
                                    type="button"
                                    onClick={handleResendEmail}
                                    disabled={isSendingEmail}
                                    className="btn primary"
                                >
                                    {isSendingEmail ? "Sending…" : "Resend email"}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </BookingWizardShell>
        );
    }

    return (
        <BookingWizardShell step={3} theme={theme} onThemeToggle={toggleTheme}>
            {notification ? (
                <div
                    role="status"
                    style={{
                        position: "fixed",
                        top: "12%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 10000,
                        background: "var(--surface)",
                        border: `1px solid ${notification.type === "success" ? "var(--success)" : "#b3261e"}`,
                        borderRadius: 12,
                        padding: "14px 20px",
                        boxShadow: "var(--shadow-soft)",
                        minWidth: 280,
                        maxWidth: 480,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--ink)" }}>{notification.message}</p>
                        <button type="button" className="btn ghost" onClick={() => setNotification(null)} style={{ padding: "4px 8px" }}>
                            Close
                        </button>
                    </div>
                </div>
            ) : null}

            <section className="step-page active booking-page">
                <h1 className="step-title">
                    Choose <em>slot</em>
                </h1>
                <p className="step-sub">
                    {isScope1
                        ? "Select a convenient time for your Scope 1 assessment."
                        : "Select a convenient time for your Scope 2 assessment."}
                </p>

                <div className="form-card booking-panel">
                    <div className="booking-panel-head">
                        <div className="booking-panel-icon">
                            <CalendarIcon />
                        </div>
                        <h2>Select date &amp; time</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="booking-field-label">
                                Select a date <span className="required-mark">*</span>
                            </label>
                            <p className="booking-field-hint" style={{ marginBottom: 12 }}>
                                Choose your preferred assessment date
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                {dates.length === 0 ? (
                                    <p className="col-span-full booking-field-hint">Loading available dates…</p>
                                ) : null}
                                {dates.map((d, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleDateSelect(index)}
                                        className={`booking-date-card ${selectedDateIndex === index ? "selected" : ""}`}
                                    >
                                        <span className="day">{getDayNumber(d.date)}</span>
                                        <span className="month">{getMonthName(d.date)}</span>
                                        <span className="label">{d.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedDateIndex !== null ? (
                            <div>
                                <label className="booking-field-label">
                                    Select time of day <span className="required-mark">*</span>
                                </label>
                                <p className="booking-field-hint" style={{ marginBottom: 12 }}>
                                    Choose your preferred time period
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                    {(() => {
                                        const now = new Date();
                                        const isTodaySelected =
                                            dates[selectedDateIndex]?.date.getDate() === now.getDate() &&
                                            dates[selectedDateIndex]?.date.getMonth() === now.getMonth() &&
                                            dates[selectedDateIndex]?.date.getFullYear() === now.getFullYear();
                                        return (
                                            <button
                                                key="Now"
                                                type="button"
                                                onClick={() => handleShiftSelect("Now")}
                                                disabled={!isTodaySelected}
                                                className={`booking-shift-card ${selectedShift === "Now" ? "selected" : ""}`}
                                            >
                                                <ClockIcon />
                                                <span style={{ fontWeight: 800, fontSize: 14 }}>Now</span>
                                                <span className="shift-range">Immediately</span>
                                            </button>
                                        );
                                    })()}
                                    {shifts.map((shift) => {
                                        let isShiftAvailable = true;
                                        if (selectedDateIndex !== null) {
                                            const isToday = dates[selectedDateIndex].label === "Today";
                                            if (isToday) {
                                                const availableSlots = timeSlotsByShift[shift.label].filter((t) => !isTimeSlotInPast(t));
                                                if (availableSlots.length === 0) isShiftAvailable = false;
                                            }
                                        }
                                        return (
                                            <button
                                                key={shift.label}
                                                type="button"
                                                onClick={() => handleShiftSelect(shift.label)}
                                                disabled={!isShiftAvailable}
                                                className={`booking-shift-card ${selectedShift === shift.label ? "selected" : ""}`}
                                            >
                                                {shift.icon}
                                                <span style={{ fontWeight: 800, fontSize: 14 }}>{shift.label}</span>
                                                <span className="shift-range">{shift.range}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}

                        {selectedShift !== null ? (
                            <div style={{ minHeight: 150 }}>
                                {selectedShift === "Now" ? (
                                    <div className="booking-callout">
                                        <div>
                                            <strong>Instant assessment access</strong>
                                            <p>
                                                By selecting &quot;Now&quot;, your assessment link will be generated instantly and ready to start within 10 seconds of confirming your booking.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <label className="booking-field-label">
                                            Select specific time <span className="required-mark">*</span>
                                        </label>
                                        <p className="booking-field-hint" style={{ marginBottom: 12 }}>
                                            Pick your exact appointment time
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            {timeSlotsByShift[selectedShift]
                                                .filter((time) => {
                                                    if (selectedDateIndex !== null) {
                                                        const isToday = dates[selectedDateIndex].label === "Today";
                                                        if (isToday) return !isTimeSlotInPast(time);
                                                    }
                                                    return true;
                                                })
                                                .map((time) => (
                                                    <button
                                                        key={time}
                                                        type="button"
                                                        onClick={() => handleTimeSelect(time)}
                                                        className={`booking-time-chip ${selectedTime === time ? "selected" : ""}`}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                            {timeSlotsByShift[selectedShift].filter((time) => {
                                                if (selectedDateIndex !== null) {
                                                    const isToday = dates[selectedDateIndex].label === "Today";
                                                    if (isToday) return !isTimeSlotInPast(time);
                                                }
                                                return true;
                                            }).length === 0 ? (
                                                <p className="booking-field-hint w-full text-center" style={{ padding: "16px 0" }}>
                                                    No available slots for this shift today.
                                                </p>
                                            ) : null}
                                        </div>
                                        {!selectedTime ? (
                                            <p className="booking-field-hint" style={{ marginTop: 8 }}>
                                                Select a time slot to proceed.
                                            </p>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        ) : null}
                    </div>

                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--rule)" }}>
                        <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                style={{ accentColor: "var(--purple)" }}
                            />
                            <span>
                                I agree to the{" "}
                                <button
                                    type="button"
                                    className="btn ghost"
                                    style={{ padding: 0, minHeight: 0, textDecoration: "underline", fontSize: 12 }}
                                    onClick={() => setShowTerms(true)}
                                >
                                    terms and conditions
                                </button>
                            </span>
                        </label>
                    </div>

                    <div className="booking-footer">
                        <button
                            type="button"
                            className="btn ghost"
                            onClick={() => {
                                const qs = buildBookingQuery();
                                router.push(qs ? `/choose-assessment?${qs}` : "/choose-assessment");
                            }}
                        >
                            Back to assessment type
                        </button>
                        <button
                            type="button"
                            className="btn primary"
                            onClick={handleConfirmBooking}
                            disabled={!selectedTime || !termsAccepted || isSendingEmail}
                        >
                            {isSendingEmail ? "Booking…" : "Confirm booking"}
                        </button>
                    </div>
                </div>
            </section>

            <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms and Conditions">
                <ol className="text-sm text-[var(--ink-soft)] space-y-4 list-decimal pl-5">
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
        </BookingWizardShell>
    );
}

export default function ChooseTimePage() {
    return (
        <Suspense
            fallback={
                <BookingWizardShell step={3} theme="light" onThemeToggle={() => {}}>
                    <section className="step-page active booking-page">
                        <p className="step-sub">Loading…</p>
                    </section>
                </BookingWizardShell>
            }
        >
            <ChooseTimeContent />
        </Suspense>
    );
}
