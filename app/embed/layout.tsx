export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-transparent overflow-hidden" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/*
          Embed layout is minimal to avoid including site-wide
          navbars, footers, or extra padding/margins.
          Font is reset to system default so the embedding page's font takes precedence.
      */}
      {children}
    </div>
  );
}
