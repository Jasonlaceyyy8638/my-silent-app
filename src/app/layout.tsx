import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Header } from "@/components/Header";
import "./globals.css";

const CHATBOT_ID = process.env.NEXT_PUBLIC_CHATBOT_ID;
const CHATBASE_EMBED_URL = "https://www.chatbase.co/embed.min.js";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VeloDoc: The 10-Second PDF-to-Sheet Architect",
  description: "VeloDoc turns PDF invoices into structured data in seconds. Upload, architect, export—works with Excel, Google Sheets, and QuickBooks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Header />
        {children}
        {CHATBOT_ID && (
          <Script
            id="chatbase-embed"
            src={CHATBASE_EMBED_URL}
            strategy="afterInteractive"
            {...{ "agent-id": CHATBOT_ID }}
          />
        )}
      </body>
    </html>
  );
}
