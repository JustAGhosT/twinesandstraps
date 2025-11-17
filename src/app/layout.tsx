import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Twines and Straps SA",
  description: "E-Commerce Website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
