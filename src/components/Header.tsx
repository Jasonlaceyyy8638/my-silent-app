import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-petroleum/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-end px-6">
        <nav className="flex items-center gap-4">
          <Link
            href="/#pricing"
            className="inline-flex items-center rounded-lg bg-teal-accent px-4 py-2 text-sm font-medium text-petroleum hover:bg-lime-accent transition-colors"
          >
            Buy Credits
          </Link>
        </nav>
      </div>
    </header>
  );
}
