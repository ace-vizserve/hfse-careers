export const ApplicationNote = () => (
  <div className="rounded-xl border border-[#F6D6B8] bg-[#FDECD9] p-5">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#FBDEC3] border border-[#F6D6B8] flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-4 h-4 text-[#C2410C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A3D0B]">Note</p>
        <p className="mb-3 text-[13px] leading-[1.65] text-[#414A66]">
          Kindly review the application form and ensure that all required information has been provided, especially the
          fields marked with <span className="font-bold text-[#C2410C]">red asterisks</span> or{" "}
          <span className="font-bold text-[#C2410C]">red borders</span>, which need to be filled out. If you encounter a
          problem submitting the application, kindly copy the link and paste it into a different browser and provide us
          with a screenshot if the issue occurs again.
        </p>
        <p className="text-[13px] leading-[1.65] text-[#414A66]">
          For assistance, please contact{" "}
          <a
            href="mailto:support@hfse.edu.sg"
            className="text-[#1E2FA8] hover:text-[#16217A] font-medium hover:underline transition-colors">
            support@hfse.edu.sg
          </a>
        </p>
      </div>
    </div>
  </div>
);
