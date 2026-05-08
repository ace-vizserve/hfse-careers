import { useEffect, type RefObject } from "react";

export function useIframeResize(ref: RefObject<HTMLElement | null>, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || !ref.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        window.parent.postMessage({ type: "resize-iframe", height: entry.target.scrollHeight }, "*");
      }
    });

    resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect();
  }, [ref, enabled]);
}
