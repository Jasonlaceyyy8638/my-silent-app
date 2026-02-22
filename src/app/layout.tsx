import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "Clean Your Data Silently",
  description: "Upload PDF invoices and extract vendor, amount, and date with AI.",
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
