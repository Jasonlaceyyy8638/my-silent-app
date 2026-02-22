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
  title: "VeloDoc – Stop typing. Start building.",
  description:
    "The PDF Architect for service and logistics pros. Extract SKUs, part descriptions, and unit costs from invoices, BOLs, and quotes—no templates required.",
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
