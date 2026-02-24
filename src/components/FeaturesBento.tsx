"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, CheckCircle, Plug, Play, Volume2 } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Institutional Speed",
    description: "Extract 100 pages in under 60 seconds. Batch process without waiting.",
    span: 2 as const,
  },
  {
    icon: CheckCircle,
    title: "Absolute Precision",
    description: "AI verification of line items and part numbers. Vendor SKUs, every time.",
    span: 1 as const,
  },
  {
    icon: Plug,
    title: "Seamless Ecosystem",
    description: "Direct exports to Excel, QuickBooks, and custom APIs.",
    span: 1 as const,
  },
];

const CARD_BASE =
  "rounded-2xl border border-white/20 bg-white/[0.07] backdrop-blur-xl border-t-teal-accent/30 p-6 sm:p-8 flex flex-col transition-all duration-300";

export function FeaturesBento() {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  useEffect(() => {
    const el = videoContainerRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const visible = entry.isIntersecting;
        setIsInView(visible);

        if (visible) {
          video.muted = false;
          video.play().then(() => setAudioUnlocked(true)).catch(() => {
            video.muted = true;
            video.play().catch(() => {});
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleTapForSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.play().then(() => setAudioUnlocked(true)).catch(() => {});
  };

  return (
    <section className="mb-14">
      <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
        Features that scale
      </h2>
      <p className="text-slate-400 text-center text-sm max-w-xl mx-auto mb-10">
        Hover cards for a closer look. Try the Live Demo.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {FEATURES.map(({ icon: Icon, title, description, span }) => (
          <motion.article
            key={title}
            className={`${CARD_BASE} ${span === 2 ? "md:col-span-2" : ""}`}
            whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(34, 211, 238, 0.2)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-teal-accent/10 flex items-center justify-center shrink-0 text-teal-accent">
                <Icon className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          </motion.article>
        ))}

        <motion.div
          className={`${CARD_BASE} md:col-span-2 relative overflow-hidden min-h-[220px]`}
          whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(34, 211, 238, 0.25)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-lime-accent/20 flex items-center justify-center text-lime-accent">
              <Play className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">VeloDoc Master Demo — Architect Your Data</h3>
            </div>
          </div>
          <div
            ref={videoContainerRef}
            className="relative rounded-xl bg-slate-900/80 border border-white/10 aspect-video max-w-xl overflow-hidden shadow-[0_0_24px_rgba(34,211,238,0.2)]"
          >
            <video
              ref={videoRef}
              src="/demo.mp4"
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            />
            {isInView && !audioUnlocked && (
              <button
                type="button"
                onClick={handleTapForSound}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl transition-colors hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-teal-accent/50"
                aria-label="Tap for sound"
              >
                <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm font-medium text-white">
                  <Volume2 className="w-4 h-4" aria-hidden />
                  Tap for Sound
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
