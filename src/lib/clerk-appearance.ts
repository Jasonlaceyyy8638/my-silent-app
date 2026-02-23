/**
 * Shared Clerk appearance for Petroleum Blue & Teal theme (glassmorphism-friendly).
 * Use with OrganizationSwitcher, OrganizationProfile, UserButton.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#22d3ee",
    colorBackground: "#0f172a",
    colorInputBackground: "#0f172a",
    colorInputText: "#f1f5f9",
    borderRadius: "12px",
  },
  elements: {
    rootBox: "rounded-2xl",
    card: "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 shadow-[0_8px_32px_rgba(15,23,42,0.4)]",
    headerTitle: "text-white",
    headerSubtitle: "text-slate-400",
    formFieldLabel: "text-slate-300",
    formFieldInput: "rounded-xl border-white/20 bg-petroleum/80 text-white",
    formButtonPrimary: "bg-teal-accent hover:bg-teal-accent/90 text-petroleum font-semibold rounded-xl",
    footerActionLink: "text-teal-accent hover:text-lime-accent",
    organizationSwitcherTrigger: "rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-slate-200",
    avatarBox: "h-9 w-9",
  },
} as const;
