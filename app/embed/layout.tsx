export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`html, body { overflow: hidden !important; margin: 0; padding: 0; height: auto; }`}</style>
      <div className="bg-transparent overflow-hidden" style={{ fontFamily: "inherit" }}>
        {children}
      </div>
    </>
  );
}
