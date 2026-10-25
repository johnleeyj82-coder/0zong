"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const EASE = [0.25, 0, 0, 1] as const;

/** Fades children up once when they scroll into view. `index` staggers siblings by 100ms. */
export function Reveal({ children, index = 0, className, id, as = "div" }: {
  children: React.ReactNode; index?: number; className?: string; id?: string; as?: "div" | "li" | "article";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const M = motion[as] as typeof motion.div;
  return (
    <M ref={ref} id={id} className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, ease: EASE, delay: index * 0.1 }}>
      {children}
    </M>
  );
}
