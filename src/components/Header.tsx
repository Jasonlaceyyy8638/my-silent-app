import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
          aria-label="VeloDoc home"
        >
          <Image
            src="/logo-png.png"
            alt="VeloDoc"
            width={120}
            height={45}
            className="h-[45px] w-auto shadow-[0_0_15px_rgba(34,211,238,0.4)]"
            priority
          />
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/#pricing"
            className="inline-flex items-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            Buy Credits
          </Link>
        </nav>
      </div>
    </header>
  );
}
