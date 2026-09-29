"use client";

import { AlertCircle, CheckCircle, Paperclip } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { inputBase } from "@/components/application-form/application-field";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

const SUPPORT_EMAIL = "support@hfse.edu.sg";

type ReportProblemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  positionName?: string;
  /** The visit's id, which lines the report up with the failures it logged. */
  sessionId: string;
  /** Where the candidate is in the form, e.g. "Step 2 of 4: Family & Education". */
  step?: string;
  /** The error the page was showing, attached so they need not retype it. */
  shownError?: string;
  defaultName?: string;
  defaultEmail?: string;
};

type Status = { kind: "editing" } | { kind: "sending" } | { kind: "sent"; id: number | null } | { kind: "failed"; message: string };

const labelClass = "mb-1.5 block text-[12px] font-semibold text-[#10162B]";

/**
 * "Report a problem", in place of asking candidates to email support with a
 * screenshot. The browser, the step and the error on screen go with the report
 * automatically; the candidate only says what happened and where to reply.
 */
export function ReportProblemDialog({
  open,
  onOpenChange,
  jobId,
  positionName,
  sessionId,
  step,
  shownError,
  defaultName = "",
  defaultEmail = "",
}: ReportProblemDialogProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "editing" });

  // Each opening picks up what the form holds now; a report already sent starts
  // over rather than showing its thank-you again. The message is kept on a
  // plain close, so dismissing by accident loses nothing.
  useEffect(() => {
    if (!open) return;

    setName((current) => current || defaultName);
    setEmail((current) => current || defaultEmail);

    if (status.kind === "sent") setMessage("");
    if (status.kind === "sent" || status.kind === "failed") setStatus({ kind: "editing" });
    // Only an opening should reset it, not the status changing while open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus({ kind: "sending" });

    try {
      const response = await fetch("/api/applications/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, positionName, sessionId, step, shownError, name, email, message, website }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus({ kind: "failed", message: result?.error ?? "Your report could not be sent." });
        return;
      }

      setStatus({ kind: "sent", id: result?.id ?? null });
    } catch {
      setStatus({ kind: "failed", message: "Your report could not be sent." });
    }
  };

  // The way out when the form itself cannot get through: the same details, in
  // an email the candidate only has to send.
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `Problem applying${positionName ? ` for ${positionName}` : ""}`,
  )}&body=${encodeURIComponent(
    [
      message,
      "",
      ...(shownError ? [`Error shown: ${shownError}`] : []),
      ...(step ? [`Where: ${step}`] : []),
      `Reference: ${sessionId}`,
    ].join("\n"),
  )}`;

  const sending = status.kind === "sending";

  return (
    <Dialog open={open} onOpenChange={(next) => !sending && onOpenChange(next)}>
      <DialogContent
        showCloseButton={!sending}
        className="max-h-[calc(100dvh-32px)] max-w-[480px] gap-0 overflow-y-auto rounded-xl border-0 bg-white p-6 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_24px_60px_rgba(16,22,43,0.22)] sm:p-7">
        {status.kind === "sent" ? (
          <div className="flex flex-col items-center text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#E7F6EF]">
              <CheckCircle className="h-6 w-6 text-[#10A56B]" />
            </span>
            <DialogTitle className="text-[17px] font-semibold tracking-[-0.02em] text-[#10162B]">
              Thanks, we have your report
            </DialogTitle>
            <DialogDescription className="mt-2 text-[13px] leading-[1.65] text-[#4A5273]">
              We&apos;ll reply to <span className="font-medium text-[#10162B]">{email}</span>.
              {status.id != null && (
                <>
                  {" "}
                  Your reference is <span className="font-semibold text-[#10162B]">#{status.id}</span>.
                </>
              )}{" "}
              Your answers so far are saved on this device, so you can come back to the form.
            </DialogDescription>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mt-6 min-h-[36px] w-full rounded-[7px] bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] px-6 py-[9px] text-[13px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)] transition-all hover:brightness-110">
              Back to the form
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <DialogHeader className="mb-5 gap-1 border-b border-[#ECEFF7] pb-4 text-left">
              <DialogTitle className="text-[17px] font-semibold tracking-[-0.02em] text-[#10162B]">
                Report a problem
              </DialogTitle>
              <DialogDescription className="text-[12px] leading-[1.6] text-[#6C7591]">
                Tell us what went wrong. Your browser and where you are in the form are sent with it, so there&apos;s
                no need for a screenshot.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {shownError && (
                <div className="flex items-start gap-2 rounded-[7px] border border-[#E3E6F0] bg-[#F5F6FA] px-3 py-2.5 text-[12px] text-[#414A66]">
                  <Paperclip className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#6C7591]" />
                  <span>
                    <span className="font-semibold text-[#10162B]">Attached:</span> {shownError}
                  </span>
                </div>
              )}

              <div>
                <label htmlFor="report-message" className={labelClass}>
                  What happened? <span className="text-[#C2410C]">*</span>
                </label>
                <Textarea
                  id="report-message"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="e.g. I pressed Submit and nothing happened, or my resume would not upload."
                  className={inputBase}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="report-name" className={labelClass}>
                    Your name
                  </label>
                  <Input
                    id="report-name"
                    autoComplete="name"
                    maxLength={200}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label htmlFor="report-email" className={labelClass}>
                    Email for our reply <span className="text-[#C2410C]">*</span>
                  </label>
                  <Input
                    id="report-email"
                    type="email"
                    required
                    autoComplete="email"
                    maxLength={320}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputBase}
                  />
                </div>
              </div>

              {/* Hidden from people and from assistive tech; see the route. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                className="sr-only"
              />

              {status.kind === "failed" && (
                <div role="alert" className="flex items-start gap-2 text-[12px] leading-[1.6] text-[#C2410C]">
                  <AlertCircle className="mt-0.5 h-[15px] w-[15px] flex-shrink-0" />
                  <span>
                    {status.message} Please try again, or{" "}
                    <a href={mailto} className="font-semibold underline">
                      email it to {SUPPORT_EMAIL}
                    </a>{" "}
                    instead.
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={sending}
                onClick={() => onOpenChange(false)}
                className="min-h-[36px] rounded-[7px] border border-[#D5DAE8] bg-white px-6 py-[9px] text-[13px] font-semibold text-[#10162B] shadow-[0_1px_2px_rgba(16,22,43,0.05)] transition-colors hover:bg-[#F5F6FA] disabled:opacity-60">
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[7px] bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] px-6 py-[9px] text-[13px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_10px_rgba(30,47,168,0.28)] transition-all hover:brightness-110 disabled:opacity-70">
                {sending && <Spinner className="size-3.5" />}
                {sending ? "Sending…" : "Send report"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
