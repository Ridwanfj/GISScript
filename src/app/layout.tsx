import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WebGIS Kota Tegal",
  description:
    "Sistem Informasi Geografis Kota Tegal — Peta interaktif batas wilayah, pola ruang RDTR, dan proyek investasi.",
  keywords: [
    "WebGIS",
    "Kota Tegal",
    "Peta",
    "GIS",
    "RDTR",
    "Tata Ruang",
    "Investasi",
  ],
  authors: [{ name: "Pemerintah Kota Tegal" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} antialiased`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
