export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-transparent overflow-hidden">
      {/* 
          Embed layout is minimal to avoid including site-wide 
          navbars, footers, or extra padding/margins. 
      */}
      {children}
    </div>
  );
}
