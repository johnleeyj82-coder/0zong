"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Dashboard from "./Dashboard";
import { useRoom } from "./RoomContext";

export default function DashboardOverlay() {
  const { dashboard, setDashboard, owner, setOwner } = useRoom();
  useEffect(() => {
    if (!dashboard) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDashboard(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dashboard, setDashboard]);
  return (
    <AnimatePresence>
      {dashboard && owner && (
        <motion.div className="dash-overlay" role="dialog" aria-modal="true" aria-label="방문 기록"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Dashboard onClose={() => setDashboard(false)} onLogout={() => { setDashboard(false); setOwner(false); }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
