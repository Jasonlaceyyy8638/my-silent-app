import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
const OG_TITLE = "VeloDoc | Enterprise-Grade Universal Data Engine";
const OG_DESCRIPTION =
  "The Universal Data Engine for messy documents. Enterprise-grade extraction with nationwide compliance—BOLs, contracts, intake forms, and any paper-to-digital workflow.";
const OG_IMAGE = "/logo-png.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "VeloDoc – Enterprise-Grade Universal Data Engine",
  description:
    "Enterprise-grade document architecture with nationwide compliance. Turn any PDF—invoices, BOLs, contracts, intake forms—into structured data with the Universal Data Engine.",
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
        alt: "VeloDoc – Enterprise-Grade Universal Data Engine",
      },
    ],
    locale: "en",
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
          <Footer />
          <ChatbaseWidget />
        </body>
      </html>
    </ClerkProvider>
  );
}
