import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FIT Zone — Kota Tegal",
  description:
    "Forum Investasi Tegal Zone — Peta interaktif batas wilayah, pola ruang RDTR, dan proyek investasi Kota Tegal.",
  keywords: [
    "FIT Zone",
    "Kota Tegal",
    "Peta",
    "GIS",
    "RDTR",
    "Tata Ruang",
    "Investasi",
  ],
  authors: [{ name: "Pemerintah Kota Tegal" }],
  icons: {
    icon: "/logo.svg",
  },
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
