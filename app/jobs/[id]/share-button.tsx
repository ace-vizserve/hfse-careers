"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

import PopupModal from "@/components/ui/popup-modal";

/**
 * The detail page is server-rendered, so the one interactive control on it —
 * copying the job link — lives here. Same copy as the listings pane.
 */
export function ShareRoleButton({ jobId }: { jobId: number }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/jobs/${jobId}`);
    setCopied(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className="mt-[9px] flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#D5DAE8] bg-white px-4 py-3 text-[13px] font-semibold text-[#10162B] shadow-[0_1px_2px_rgba(16,22,43,0.05)] transition-colors hover:bg-[#F5F6FA]">
        <Share2 className="size-[15px]" />
        Share this role
      </button>

      <PopupModal
        open={copied}
        onClose={() => setCopied(false)}
        title="Link copied"
        message="The job link has been copied to your clipboard."
      />
    </>
  );
}
