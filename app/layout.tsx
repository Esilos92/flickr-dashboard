import type { Metadata } from "next";
import { Geist, Chakra_Petch, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/* Angular display face for headings and HUD labels */
const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

/* Data face — every figure on this page is tabular */
const jet = JetBrains_Mono({
  variable: "--font-jet",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Flickr Uploader — Status",
  description:
    "Operations dashboard for the Dropbox to Flickr upload pipeline.",
};

export const viewport = {
  themeColor: "#070a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${chakra.variable} ${jet.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
