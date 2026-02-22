import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { ChatbaseWidget } from "@/components/ChatbaseWidget";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://velodoc.app";
const OG_TITLE = "VeloDoc | The Universal AI PDF Architect";
const OG_DESCRIPTION =
  "Stop manual data entry. Our AI understands the context of your invoices, contracts, and records—so you don't have to.";
const OG_IMAGE = "/logo-png.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "VeloDoc – Your PDFs, finally organized.",
  description:
    "The AI Architect for your documents. From invoices to medical records, transcripts, and contracts—VeloDoc reads any PDF and hands you the data you need.",
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: SITE_URL,
    siteName: "VeloDoc",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "VeloDoc – The Universal AI PDF Architect",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [`${SITE_URL}${OG_IMAGE}`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        >
          <Header />
          {children}
          <ChatbaseWidget />
        </body>
      </html>
    </ClerkProvider>
  );
}
