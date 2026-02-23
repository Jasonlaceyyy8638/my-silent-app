"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

const defaultVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

type MotionScrollSectionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  as?: "section" | "div";
  transition?: { duration?: number; delay?: number };
};

export function MotionScrollSection({
  children,
  className = "",
  id,
  as: Component = "section",
  transition = { duration: 0.5, delay: 0.1 },
}: MotionScrollSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px 0px -80px 0px" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    if (Component === "section") {
      return (
        <section id={id} className={className}>
          {children}
        </section>
      );
    }
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  const content = (
    <motion.div
      ref={ref}
      initial="visible"
      animate="visible"
      variants={defaultVariants}
      transition={{
        duration: transition.duration,
        delay: transition.delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );

  if (Component === "section") {
    return (
      <section id={id} className={className}>
        {content}
      </section>
    );
  }
  return (
    <div id={id} className={className}>
      {content}
    </div>
  );
}
