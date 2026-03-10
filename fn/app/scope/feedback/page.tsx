"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function StarRating({
    value,
    onChange,
    labelLeft,
    labelRight
}: {
    value: number;
    onChange: (val: number) => void;
    labelLeft: string;
    labelRight: string;
}) {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex items-center gap-4 mt-3 mb-8 pl-4">
            <span className="text-xs font-medium text-gray-500 w-20 text-right">{labelLeft}</span>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                    >
                        <svg
                            className={`w-8 h-8 transition-colors ${star <= (hover || value)
                                ? "text-indigo-600"
                                : "text-gray-300"
                                }`}
                            fill={star <= (hover || value) ? "currentColor" : "none"}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={star <= (hover || value) ? "0" : "2"}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </button>
                ))}
            </div>
            <span className="text-xs font-medium text-gray-500 w-20">{labelRight}</span>
        </div>
    );
}

export default function FeedbackPage() {
    const router = useRouter();

    const [ratings, setRatings] = useState({
        experience: 0,
        ease: 0,
        usefulness: 0,
        recommend: 0,
    });
    const [comment, setComment] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSkip = () => {
        // Clear session storage and redirect to home (slot booking)
        sessionStorage.clear();
        router.push("/");
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            let email = "";
            const userStr = sessionStorage.getItem("scope2_user");
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    email = user.email || "";
                } catch (e) {
                    // Ignore parse error
                }
            }

            const payload = {
                email,
                experience: ratings.experience,
                ease: ratings.ease,
                usefulness: ratings.usefulness,
                recommend: ratings.recommend,
                comment,
            };

            const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

            await fetch(`${NEXT_PUBLIC_API_URL}/api/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        } catch (error) {
            console.error("Failed to submit feedback", error);
        } finally {
            router.push("/scope/feedback/thank-you");
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 max-w-3xl w-full mx-auto overflow-hidden">
                {/* Header content */}
                <div className="p-8 pb-6 border-b border-gray-100 mt-2">
                    <h1 className="text-[28px] font-bold text-gray-900 mb-2">Help Us Improve Your Experience</h1>
                    <p className="text-base text-gray-500">Your Feedback Helps Us Make Sustally Better For You.</p>
                </div>

                <div className="p-8">
                    {/* Question 1 */}
                    <div className="mb-2">
                        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1 h-1 bg-indigo-600 rounded-full inline-block"></span>
                            How Was Your Experience With The Scope 2 Assessment?
                        </h3>
                        <StarRating
                            value={ratings.experience}
                            onChange={(val) => setRatings({ ...ratings, experience: val })}
                            labelLeft="Very Poor"
                            labelRight="Excellent"
                        />
                    </div>

                    {/* Question 2 */}
                    <div className="mb-2">
                        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1 h-1 bg-indigo-600 rounded-full inline-block"></span>
                            How Easy Was The Process To Understand And Complete?
                        </h3>
                        <StarRating
                            value={ratings.ease}
                            onChange={(val) => setRatings({ ...ratings, ease: val })}
                            labelLeft="Very Difficult"
                            labelRight="Very Easy"
                        />
                    </div>

                    {/* Question 3 */}
                    <div className="mb-2">
                        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1 h-1 bg-indigo-600 rounded-full inline-block"></span>
                            How Useful Were The Results And Insights For Your Organization?
                        </h3>
                        <StarRating
                            value={ratings.usefulness}
                            onChange={(val) => setRatings({ ...ratings, usefulness: val })}
                            labelLeft="Not Useful"
                            labelRight="Very Useful"
                        />
                    </div>

                    {/* Question 4 */}
                    <div className="mb-2">
                        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1 h-1 bg-indigo-600 rounded-full inline-block"></span>
                            How Likely Are You To Recommend Sustally To Others?
                        </h3>
                        <StarRating
                            value={ratings.recommend}
                            onChange={(val) => setRatings({ ...ratings, recommend: val })}
                            labelLeft="Very Unlikely"
                            labelRight="Very Likely"
                        />
                    </div>

                    {/* Comment */}
                    <div className="mt-8 mb-4">
                        <h3 className="text-sm font-semibold text-gray-800 mb-4">
                            Kindly Share A Brief Comment About Your Experience
                        </h3>
                        <textarea
                            className="w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[140px] resize-y"
                            placeholder="Your Feedback Helps Us Improve..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        ></textarea>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="bg-gray-50/50 p-6 flex flex-row items-center justify-between border-t border-gray-100 rounded-b-[20px]">
                    <button
                        onClick={handleSkip}
                        className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors px-4 py-2"
                        disabled={isSubmitting}
                    >
                        Skip
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-3 px-8 rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </button>
                </div>
            </div>
        </main>
    );
}
