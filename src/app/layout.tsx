import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Providers } from "@/components/Providers";
import WhatsAppButton from "@/components/WhatsAppButton";
import BackToTop from "@/components/BackToTop";
import SkipLink from "@/components/SkipLink";
import { featureFlags } from "@/config/featureFlags";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://twinesandstraps.netlify.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TASSA - Twines and Straps SA | Quality Ropes & Twines",
    template: "%s | TASSA"
  },
  description: "Proudly South African manufacturer and supplier of quality ropes, twines, and straps. Industrial and agricultural solutions with 70+ years combined experience. Boundless Strength, Endless Solutions!",
  keywords: ["twines", "ropes", "straps", "polypropylene rope", "sisal rope", "manila rope", "South Africa", "manufacturer", "industrial rope", "agricultural twine", "TASSA"],
  authors: [{ name: "Twines and Straps SA" }],
  creator: "TASSA",
  publisher: "Twines and Straps SA",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: siteUrl,
    siteName: "TASSA - Twines and Straps SA",
    title: "TASSA - Quality Ropes & Twines | South African Manufacturer",
    description: "Proudly South African manufacturer of quality ropes, twines, and straps. Industrial and agricultural solutions with 70+ years combined experience.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TASSA - Twines and Straps SA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TASSA - Quality Ropes & Twines | South African Manufacturer",
    description: "Proudly South African manufacturer of quality ropes, twines, and straps. Industrial and agricultural solutions.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add Google Search Console verification if available
    // google: "your-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <SkipLink />
        <Providers>
          <Header />
          <main id="main-content" className="flex-grow">{children}</main>
          <Footer />
          {featureFlags.backToTop && <BackToTop />}
          {featureFlags.whatsappButton && <WhatsAppButton />}
        </Providers>
      </body>
    </html>
  );
}
