import { Checkbox } from "@/components/ui/checkbox";

/**
 * A shadcn Checkbox with the statement as its label. The hand-rolled version was
 * a label wrapping an `sr-only` input, and a click on the sentence did not
 * register — which left Submit permanently disabled.
 */
const CheckItem = ({
  checked,
  onChange,
  children,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  id: string;
}) => (
  <label
    htmlFor={id}
    className={`flex cursor-pointer select-none items-start gap-[13px] rounded-[9px] border p-4 transition-colors ${
      checked ? "border-[#C3CBE8] bg-[#F7F9FF]" : "border-[#E4E7F1] bg-[#FBFCFE] hover:border-[#C8CEE0]"
    }`}>
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={(next) => onChange(next === true)}
      className="mt-0.5 size-5 flex-shrink-0 rounded-[5px] border-[#B9C2D9] data-[state=checked]:border-[#1E2FA8] data-[state=checked]:bg-[#1E2FA8]"
    />
    <span className="text-[13px] leading-[1.65] text-[#22283F]">{children}</span>
  </label>
);

export const ConsentDeclarations = ({
  declareTruth,
  setDeclareTruth,
  declareConsent,
  setDeclareConsent,
}: {
  declareTruth: boolean;
  setDeclareTruth: (v: boolean) => void;
  declareConsent: boolean;
  setDeclareConsent: (v: boolean) => void;
}) => {
  return (
    <div className="rounded-xl bg-white px-[26px] py-6 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]">
      <div className="mb-[18px] flex items-center gap-[13px] border-b border-[#ECEFF7] pb-4">
        <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#1E2FA8]">
          <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-[17px] font-semibold leading-tight tracking-[-0.02em] text-[#10162B]">
            Consent &amp; Acknowledgement
          </h3>
          <p className="mt-px text-[12px] text-[#6C7591]">Please read and confirm both statements before submitting</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <CheckItem id="declare-truth" checked={declareTruth} onChange={setDeclareTruth}>
          I hereby declare that all the particulars given herein are true and correct, and I have not willfully
          suppressed any material fact.
        </CheckItem>

        <CheckItem id="declare-consent" checked={declareConsent} onChange={setDeclareConsent}>
          I hereby give consent to collection, use and disclosure of my personal data by the company for the purpose of
          the processing and administration by the company relating to this attached job application.
        </CheckItem>
      </div>

      {(!declareTruth || !declareConsent) && (
        <p className="mt-4 text-xs text-[#C2410C] font-medium flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Both statements must be acknowledged before you can submit.
        </p>
      )}
    </div>
  );
};
