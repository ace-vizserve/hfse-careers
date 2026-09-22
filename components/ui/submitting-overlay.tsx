import { Spinner } from "@/components/ui/spinner";

const STEPS = ["Reviewing your application", "Saving your information", "Sending your application"];

/**
 * Sits over the form while the submission is in flight: a blurred backdrop so
 * the page reads as inert, and one spinner carrying the state rather than a
 * ring per line.
 */
export const SubmittingOverlay = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10162B]/30 backdrop-blur-sm">
    <div className="mx-4 flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-[#ECEFF7] bg-white/95 px-10 py-9 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_24px_60px_rgba(16,22,43,0.22)]">
      <Spinner className="size-6 text-[#1E2FA8]" />

      <div className="text-center">
        <p className="mb-1 text-[15px] font-semibold text-[#10162B]">Submitting your application…</p>
        <p className="text-[11px] leading-[1.65] text-[#6C7591]">
          Please don&apos;t close or refresh this page.
          <br />
          This will only take a moment.
        </p>
      </div>

      <ul className="w-full space-y-2 border-t border-[#ECEFF7] pt-4">
        {STEPS.map((step) => (
          <li key={step} className="flex items-center gap-2.5 text-[12px] text-[#4A5273]">
            <span className="size-1.5 flex-shrink-0 rounded-full bg-[#C3C9DC]" />
            {step}
          </li>
        ))}
      </ul>
    </div>
  </div>
);
