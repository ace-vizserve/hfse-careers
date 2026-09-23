"use client";

import { ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** HFSE Global Education Group's published PDPA statement. */
export const PDPA_STATEMENT_URL =
  "https://hfse.edu.sg/hfse-global-education-group-personal-data-protection-statement/";

const COOKIE_NAME = "hfse_pdpa_notice";

/**
 * Bump this whenever the purposes below or the statement itself change — the
 * old cookie then stops matching and everyone is asked to acknowledge again.
 */
const NOTICE_VERSION = "2026-09";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function readConsentCookie() {
  return document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
}

/**
 * The PDPA asks for a specific, prominent notice at the point of collection, so
 * the purposes and the third parties are spelled out here rather than left to a
 * link. Acknowledgement is remembered in a first-party cookie for a year.
 */
export function PdpaNotice() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // The embed widget renders inside someone else's page; a modal over their
    // site is not ours to show, and the widget collects nothing on its own.
    if (pathname?.startsWith("/embed")) return;

    /**
     * Opened once the browser is next idle, rather than in this effect directly.
     *
     * Opening a Radix dialog marks every other child of the body `aria-hidden`.
     * This effect runs when the notice itself hydrates, which on a page whose
     * slots hydrate in separate boundaries -- the listing, with its parallel
     * routes -- is well before the rest of the page has. React then finds
     * attributes on the listing that the server never sent and reports a
     * mismatch it will not patch up. Waiting for idle lets the remaining
     * boundaries finish first; the timeout keeps the notice prompt on a busy
     * page, and on a first visit it is still there before anything is read.
     */
    const show = () => {
      try {
        if (readConsentCookie() !== NOTICE_VERSION) setOpen(true);
      } catch {
        // Cookies blocked entirely: still show the notice, it just won't stick.
        setOpen(true);
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(show, { timeout: 1000 });
      return () => window.cancelIdleCallback(handle);
    }

    // Safari has no requestIdleCallback, and two frames is not enough there --
    // its boundaries are still hydrating. A short wait stands in; the notice
    // has to be read before anything is typed, not within the first frame.
    const timer = setTimeout(show, 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  const acknowledge = () => {
    try {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${COOKIE_NAME}=${NOTICE_VERSION}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax${secure}`;
    } catch {
      // Nothing to do — the notice simply shows again next visit.
    }

    setOpen(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        className="max-w-[440px] gap-0 rounded-xl border-0 bg-white p-6 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_24px_60px_rgba(16,22,43,0.22)]">
        <DialogHeader className="items-start text-left">
          <span className="mb-4 flex size-11 items-center justify-center rounded-[10px] bg-[#E7EAFB]">
            <ShieldCheck className="size-5 text-[#1E2FA8]" />
          </span>
          <DialogTitle className="text-[17px] font-semibold tracking-[-0.02em] text-[#10162B]">
            Personal Data Protection
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-[1.65] text-[#4A5273]">
            When you apply, HFSE Global Education Group collects the details you enter — your contact information,
            identification, education, employment history, family particulars, references and the resume you upload — to
            assess your application, verify what it contains, and contact you about this and future roles.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3 rounded-[9px] border border-[#E4E7F1] bg-[#FBFCFE] p-4 text-[12px] leading-[1.65] text-[#4A5273]">
          <p>
            Your application is held in our recruitment system (Manatal), uploaded files in our file storage provider
            (Supabase), and submission alerts reach our hiring team through our workflow provider (n8n). We do not sell
            your data or share it for advertising.
          </p>
          <p>
            This site uses cookies and local storage only to remember this acknowledgement and to keep an unfinished
            application on your device.
          </p>
        </div>

        <a
          href={PDPA_STATEMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-[13px] font-medium text-[#1E2FA8] hover:underline">
          Read the full Personal Data Protection Statement
        </a>

        <button
          type="button"
          onClick={acknowledge}
          className="mt-5 min-h-[44px] w-full cursor-pointer rounded-[7px] bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] px-4 py-3 text-[14px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)] transition-all hover:brightness-110">
          I understand
        </button>
      </DialogContent>
    </Dialog>
  );
}
