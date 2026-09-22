import HeroWidget from "@/components/hero-widget";

export const metadata = {
  // Absolute: this renders inside someone else's page, not ours.
  title: { absolute: "Careers Hero | VizServe" },
  description: "Embeddable hero section for HFSE careers portal.",
};

export default function EmbedHeroPage() {
  return (
    <main className="relative overflow-hidden">
      <HeroWidget />
    </main>
  );
}
