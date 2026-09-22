export const SubmittingOverlay = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-[#10162B]/40 backdrop-blur-sm" />

    <div className="relative rounded-xl border border-[#ECEFF7] bg-white shadow-[0_1px_2px_rgba(16,22,43,0.05),0_24px_60px_rgba(16,22,43,0.22)] px-10 py-10 flex flex-col items-center gap-5 max-w-sm w-full mx-4">
      {/* Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-[#D3D9F7]" />
        <div className="absolute inset-0 rounded-full border-4 border-[#1E2FA8] border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-[#1E2FA8]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="mb-1 text-[15px] font-semibold text-[#10162B]">Submitting your application…</p>
        <p className="text-[11px] leading-[1.65] text-[#6C7591]">
          Please don&apos;t close or refresh this page.
          <br />
          This will only take a moment.
        </p>
      </div>

      {/* Progress steps */}
      <div className="w-full space-y-2 pt-1">
        {["Reviewing your application", "Saving your information", "Sending your application"].map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full border-2 border-[#D3D9F7] border-t-[#1E2FA8] animate-spin flex-shrink-0"
              style={{ animationDelay: `${i * 0.3}s`, animationDuration: "1s" }}
            />
            <span className="text-[12px] text-[#4A5273]">{step}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);
