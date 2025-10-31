import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

// Load Roboto font
const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["300", "400", "500", "700"], // Adjust as needed
});

// ✅ Updated SEO Metadata for Team Builder page
export const metadata: Metadata = {
  title: "Team Builder | Vizserve Workforce Solutions",
  description:
    "Build your dream team with Vizserve. Discover top talent and seamless workforce solutions designed to help your business grow with confidence.",
  keywords: [
    "Vizserve team builder",
    "workforce solutions",
    "hire professionals",
    "staffing services",
    "talent sourcing",
    "recruitment Vizserve",
  ],
  openGraph: {
    title: "Team Builder | Vizserve Workforce Solutions",
    description:
      "Discover top talent and build your team effortlessly with Vizserve’s reliable workforce solutions.",
    siteName: "Vizserve",
    locale: "en_US",
    type: "website",
    url: "https://www.vizserve.com/team-builder", // optional but good for SEO
    images: [
      {
        url: "/assets/og-team-builder.jpg", // replace with your actual OG image
        width: 1200,
        height: 630,
        alt: "Vizserve Team Builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Team Builder | Vizserve Workforce Solutions",
    description:
      "Find top talent and build high-performing teams with Vizserve’s workforce solutions.",
    images: ["/assets/og-team-builder.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
     <body className={`${roboto.variable} antialiased`} style={{ fontFamily: 'var(--font-roboto)' }}>
  {children}
</body>
    </html>
  );
}
