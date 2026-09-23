"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A panel that rises from the bottom edge, for the phone-width stand-in for a
 * popover. A popover anchored to a toolbar button has nowhere to go on a 390px
 * screen: it ends up two thirds of the height, clipped at the bottom, and
 * scrolling inside itself. A sheet takes the width it needs, scrolls the way
 * the page does, and is dismissed by the gesture people already use.
 *
 * Built on Radix Dialog rather than a drag-to-dismiss library, because the
 * content here is a form -- dragging it about competes with the selects inside.
 */
function BottomSheet({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="bottom-sheet" {...props} />;
}

function BottomSheetTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="bottom-sheet-trigger" {...props} />;
}

function BottomSheetClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="bottom-sheet-close" {...props} />;
}

function BottomSheetContent({
  className,
  children,
  title,
  description,
  footer,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  title: string;
  description?: string;
  /** Pinned below the scrolling body, for a primary action that must stay reachable. */
  footer?: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Portal data-slot="bottom-sheet-portal">
      <DialogPrimitive.Overlay
        data-slot="bottom-sheet-overlay"
        className="fixed inset-0 z-50 bg-[#10162B]/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      />
      <DialogPrimitive.Content
        data-slot="bottom-sheet-content"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-2xl bg-white shadow-[0_-8px_32px_rgba(16,22,43,0.18)] outline-none",
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=open]:duration-300 data-[state=closed]:duration-200",
          className,
        )}
        {...props}>
        {/* The grabber reads as "this came from the bottom edge and goes back there". */}
        <div aria-hidden="true" className="mx-auto mt-2.5 h-1 w-9 flex-shrink-0 rounded-full bg-[#D5DAE8]" />

        <div className="flex flex-shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-3">
          <DialogPrimitive.Title className="text-[15px] font-semibold tracking-[-0.01em] text-[#10162B]">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close
            aria-label="Close"
            className="-mr-1.5 flex size-8 items-center justify-center rounded-lg text-[#6C7591] transition-colors hover:bg-[#F2F4FA] hover:text-[#414A66]">
            <X className="size-[18px]" />
          </DialogPrimitive.Close>
        </div>

        {description ? (
          <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
        ) : (
          // Radix warns when a dialog has no description; this says there is
          // deliberately nothing more to announce than the title.
          <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>

        {footer && (
          <div className="flex-shrink-0 border-t border-[#ECEFF7] bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            {footer}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export { BottomSheet, BottomSheetClose, BottomSheetContent, BottomSheetTrigger };
