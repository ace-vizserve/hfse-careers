import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

// Load Poppins font
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"], // adjust as needed
});

// SEO Metadata
export const metadata: Metadata = {
  title: "Careers at Vizserve | Join Our Team",
  description:
    "Discover exciting career opportunities at Vizserve. Join our team and help us shape the future with innovation, passion, and excellence.",
  keywords: [
    "Vizserve careers",
    "Vizserve jobs",
    "work at Vizserve",
    "job openings",
    "career opportunities",
    "apply Vizserve",
  ],
  openGraph: {
    title: "Careers at Vizserve",
    description:
      "Explore career opportunities and apply to join Vizserve's innovative team.",
    siteName: "Vizserve",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
