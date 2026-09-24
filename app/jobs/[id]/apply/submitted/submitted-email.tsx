"use client";

import { useEffect, useState } from "react";

/** Where the form leaves the address for this page to pick up. */
export const SUBMITTED_EMAIL_KEY = "hfse-submitted-email";

/**
 * The address the application went in under.
 *
 * It is handed over in sessionStorage rather than on the URL: an email in a
 * query string ends up in browser history, in the referrer of anything the
 * page loads, and in every analytics record of the visit. This keeps it to the
 * one tab that submitted, and the line simply does not render for anyone
 * opening the route cold.
 */
export function SubmittedEmail({ jobId }: { jobId: string }) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`${SUBMITTED_EMAIL_KEY}:${jobId}`);
      if (stored) setEmail(stored);
    } catch {
      // Private mode or blocked storage: the line is an extra, not the message.
    }
  }, [jobId]);

  if (!email) return null;

  return (
    <p className="mt-4 text-center text-[12px] leading-[1.65] text-[#6C7591]">
      We have your details under <span className="font-semibold text-[#414A66]">{email}</span>. Keep an eye on that
      inbox.
    </p>
  );
}
