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

export const metadata: Metadata = {
  metadataBase: new URL("https://velodoc.app"),
  title: "VeloDoc – Your PDFs, finally organized.",
  description:
    "The AI Architect for your documents. From invoices to medical records, transcripts, and contracts—VeloDoc reads any PDF and hands you the data you need.",
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
