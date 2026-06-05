"use client";

import React, { useEffect } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className="wizard-modal-card relative">
                <div className="wizard-modal-head">
                    <h3>{title}</h3>
                    <button type="button" className="btn ghost" onClick={onClose} aria-label="Close">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="wizard-modal-body">{children}</div>

                <div className="wizard-modal-foot">
                    <button type="button" className="btn ghost" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
