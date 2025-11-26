import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Providers } from "@/components/Providers";
import WhatsAppButton from "@/components/WhatsAppButton";
import BackToTop from "@/components/BackToTop";

export const metadata: Metadata = {
  title: "TASSA - Twines and Straps SA",
  description: "Proudly South African manufacturer and supplier of quality ropes, twines, and straps. Boundless Strength, Endless Solutions!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Providers>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
          <BackToTop />
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
