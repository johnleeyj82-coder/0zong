"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** The room drawer's right-side sheet, reused for the owner's movie tools: lamp-frame header, Esc or the scrim closes it. */
export function Sheet({ open, label, title, onClose, children }: {
  open: boolean; label: string; title: string; onClose: () => void; children: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="scrim" className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="sheet-h" onClick={(e) => e.stopPropagation()}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.6, ease: EASE }}>
            <button ref={closeRef} className="drawer-close" onClick={onClose} aria-label="닫기"><X size={18} /></button>
            <header className="drawer-head lamp">
              <i /><i /><i /><i />
              <div>
                <span className="label">{label}</span>
                <h2 id="sheet-h" className="display">{title}</h2>
              </div>
            </header>
            {children}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
