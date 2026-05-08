import { useEffect, type RefObject } from "react";

export function useClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, handler: (event: MouseEvent) => void) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler(event);
      }
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}
