"use client";

const LOGOS = [
  { name: "Acme Logistics", initial: "AL" },
  { name: "Global Legal Corp", initial: "GL" },
  { name: "Fortune Finance", initial: "FF" },
  { name: "Health Systems Inc", initial: "HS" },
  { name: "National Freight", initial: "NF" },
  { name: "Enterprise Co", initial: "EC" },
] as const;

export function TrustedByBar() {
  return (
    <section className="mb-14 py-8 border-y border-white/10">
      <p className="text-center text-slate-500 text-xs font-semibold uppercase tracking-widest mb-6">
        Trusted by industry leaders
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 grayscale opacity-70">
        {LOGOS.map(({ name, initial }) => (
          <div
            key={name}
            className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 min-w-[120px] justify-center"
            title={name}
          >
            <span className="text-lg font-bold text-slate-400 tracking-tight">{initial}</span>
            <span className="text-sm font-medium text-slate-500 hidden sm:inline">{name.split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
