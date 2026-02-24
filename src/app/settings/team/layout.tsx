import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VeloDoc | Organization Management",
  description: "Manage your organization, invite members, and share credits.",
};

export default function TeamSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
