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
        <div className={`entry-label-combobox ${className}`} ref={containerRef}>
            <div className="relative">
                <input
                    type="text"
                    className={`scope2-input ${error ? "is-error" : ""}`}
                    placeholder={placeholder}
                    value={isOpen ? searchTerm : (value || "")}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                        if (e.target.value === "") {
                            onChange("");
                        }
                    }}
                    onClick={() => setIsOpen(true)}
                    onFocus={() => setIsOpen(true)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-mute)' }}>
                    <svg className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <ul className="entry-label-dropdown" role="listbox">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <li key={option}>
                                <button
                                    type="button"
                                    className={value === option ? "selected" : ""}
                                    onClick={() => handleSelect(option)}
                                >
                                    {option}
                                </button>
                            </li>
                        ))
                    ) : (
                        <li className="entry-label-empty">No results found</li>
                    )}
                </ul>
            )}
        </div>
    );
}
