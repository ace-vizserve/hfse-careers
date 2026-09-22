"use client";

import React from "react";
import { CheckCircle, X } from "lucide-react";

interface PopupModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

const PopupModal: React.FC<PopupModalProps> = ({
  open,
  onClose,
  title = "Success",
  message,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#10162B]/45" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-[90%] max-w-[380px] rounded-xl bg-white p-7 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_24px_60px_rgba(16,22,43,0.22)] animate-in fade-in zoom-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-md text-[#6C7591] transition-colors hover:bg-[#F2F4FA] hover:text-[#10162B]"
          aria-label="Close"
        >
          <X className="h-[18px] w-[18px]" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#E7F6EF]">
            <CheckCircle className="h-6 w-6 text-[#10A56B]" />
          </span>
          <h2 className="mb-1.5 text-[17px] font-semibold tracking-[-0.02em] text-[#10162B]">
            {title}
          </h2>
          <p className="text-[13px] leading-[1.65] text-[#4A5273]">
            {message}
          </p>

          <button
            onClick={onClose}
            className="mt-6 min-h-[44px] w-full rounded-[7px] bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] px-4 py-3 text-[14px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)] transition-all hover:brightness-110"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupModal;
