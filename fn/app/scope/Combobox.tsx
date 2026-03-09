"use client";

import { useState, useEffect, useRef } from "react";

interface ComboboxProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    error?: boolean;
}

export default function Combobox({
    options,
    value,
    onChange,
    placeholder = "Select...",
    className = "",
    error = false,
}: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            // When closing, if the current search term doesn't match the selected value, 
            // we might want to reset the search term to the selected value or clear it if it's invalid.
            // For now, let's just sync local search term with the prop value when it changes externally or when closing.
            // setSearchTerm(value);
        }
    }, [isOpen, value]);

    // Sync internal search term with external value when not editing
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm(value);
        }
    }, [value, isOpen]);

    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (option: string) => {
        onChange(option);
        setSearchTerm(option);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative">
                <input
                    type="text"
                    className={`w-full h-10 px-2 text-xs bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-700 ${error ? "border-red-300 bg-red-50" : "border-gray-200"
                        }`}
                    placeholder={placeholder}
                    value={isOpen ? searchTerm : (value || "")}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                        // Optional: clear selection if user types something new? 
                        // For now, let's keep the value until they select or blur.
                        // Actually, if they clear it, we should clear the value.
                        if (e.target.value === "") {
                            onChange("");
                        }
                    }}
                    onClick={() => setIsOpen(true)}
                    onFocus={() => setIsOpen(true)}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <button
                                key={option}
                                type="button"
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 transition-colors ${value === option ? "bg-indigo-50 text-indigo-600 font-medium" : "text-gray-700"
                                    }`}
                                onClick={() => handleSelect(option)}
                            >
                                {option}
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-500">No Results Found</div>
                    )}
                </div>
            )}
        </div>
    );
}
