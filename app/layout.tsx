import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

// Load Roboto font
const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "HFSE Global Education Group Careers",
  description:
    "Apply for career opportunities at HFSE Global Education Group. Join a dynamic team in education and make a meaningful impact with Vizserve Workforce Solutions.",
  keywords: [
    "HFSE careers",
    "HFSE Global Education Group jobs",
    "education careers",
    "teaching jobs",
    "Vizserve recruitment",
    "apply HFSE",
    "school jobs Singapore",
  ],
  icons: {
    icon: "/assets/geg-favicon.png",
    shortcut: "/assets/geg-favicon.png",
    apple: "/assets/geg-favicon.png",
  },

  openGraph: {
    title: "HFSE Global Education Group Careers",
    description:
      "Explore career opportunities at HFSE Global Education Group and become part of a passionate education team.",
    siteName: "Vizserve Workforce Solutions",
    locale: "en_US",
    type: "website",
    url: "https://www.vizserve.com/hfse-careers",
    images: [
      {
        url: "/assets/og-hfse-careers.jpg",
        width: 1200,
        height: 630,
        alt: "HFSE Global Education Group Careers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HFSE Careers | Apply Now",
    description:
      "Start your career with HFSE Global Education Group. Apply today and join a leading education institution.",
    images: ["/assets/og-hfse-careers.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} antialiased`} style={{ fontFamily: "var(--font-roboto)" }}>
        {children}
      </body>
    </html>
  );
}
