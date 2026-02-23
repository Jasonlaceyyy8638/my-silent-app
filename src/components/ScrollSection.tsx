"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

type ScrollSectionProps = {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div";
  id?: string;
};

export function ScrollSection({ children, className = "", as: Component = "section", id }: ScrollSectionProps) {
  const ref = useScrollAnimation<HTMLElement>();
  const cn = `scroll-animate ${className}`.trim();

  if (Component === "div") {
    return (
      <div ref={ref as React.RefObject<HTMLDivElement>} id={id} className={cn}>
        {children}
      </div>
    );
  }
  return (
    <section ref={ref} id={id} className={cn}>
      {children}
    </section>
  );
}
