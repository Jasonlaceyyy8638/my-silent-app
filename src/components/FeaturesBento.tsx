"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Zap, CheckCircle, Plug, Play } from "lucide-react";

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
  const [demoHover, setDemoHover] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDemoHover = (hover: boolean) => {
    setDemoHover(hover);
    if (videoRef.current) {
      if (hover) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
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
          onHoverStart={() => handleDemoHover(true)}
          onHoverEnd={() => handleDemoHover(false)}
          whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(34, 211, 238, 0.25)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-lime-accent/20 flex items-center justify-center text-lime-accent">
              <Play className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Live Demo</h3>
              <p className="text-slate-400 text-xs">Hover to play — PDF to Excel in 5 seconds</p>
            </div>
          </div>
          <div className="relative rounded-xl bg-slate-900/80 border border-white/10 aspect-video max-w-xl overflow-hidden">
            <video
              ref={videoRef}
              src="/demo.mp4"
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              poster="/demo-poster.jpg"
            />
            {!demoHover && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 rounded-xl pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-teal-accent/20 flex items-center justify-center text-teal-accent border-2 border-teal-accent/50">
                  <Play className="w-8 h-8 ml-1" />
                </div>
              </div>
            )}
          </div>
          <p className="mt-3 text-slate-500 text-xs">
            Add <code className="bg-white/10 px-1 rounded">/public/demo.mp4</code> for a 5s PDF→Excel clip; hover to play.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
