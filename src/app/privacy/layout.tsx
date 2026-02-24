import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | VeloDoc",
  description: "VeloDoc Privacy Policy. How we collect, use, and protect your data. Enterprise-grade security and nationwide compliance.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
