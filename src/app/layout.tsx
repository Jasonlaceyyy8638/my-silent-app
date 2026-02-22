import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
        <ChatbaseWidget />
      </body>
    </html>
  );
}
