"use client";

import { CheckCircle } from "lucide-react";
import React from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PopupModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

/**
 * Built on the shadcn Dialog so it gets the focus trap, Escape handling, scroll
 * lock and dialog semantics the hand-rolled version never had. Only the styling
 * below is ours; the behaviour is Radix's.
 */
const PopupModal: React.FC<PopupModalProps> = ({ open, onClose, title = "Success", message }) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent
      showCloseButton
      className="max-w-[380px] gap-0 rounded-xl border-0 bg-white p-7 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_24px_60px_rgba(16,22,43,0.22)]">
      <DialogHeader className="items-center text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#E7F6EF]">
          <CheckCircle className="h-6 w-6 text-[#10A56B]" />
        </span>
        <DialogTitle className="text-[17px] font-semibold tracking-[-0.02em] text-[#10162B]">{title}</DialogTitle>
        <DialogDescription className="text-[13px] leading-[1.65] text-[#4A5273]">{message}</DialogDescription>
      </DialogHeader>

      <button
        type="button"
        onClick={onClose}
        className="mt-6 min-h-[44px] w-full rounded-[7px] bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] px-4 py-3 text-[14px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)] transition-all hover:brightness-110">
        OK
      </button>
    </DialogContent>
  </Dialog>
);

export default PopupModal;
