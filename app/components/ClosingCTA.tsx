"use client";
import { motion } from "framer-motion";
import { Reveal } from "./Reveal";

export default function ClosingCTA() {
  return (
    <section className="closing-cta" aria-labelledby="close-h">
      <Reveal><span className="label">Come back anytime</span></Reveal>
      <Reveal index={1}>
        <h2 id="close-h" className="display">불은 늘 켜져 있어요.<br /><em>또 들러주세요.</em></h2>
      </Reveal>
      <Reveal index={2}><p>새 기록이 생길 때마다 방 안의 물체에 불이 들어옵니다. 다음에 오면 뭐가 바뀌었는지 찾아보세요.</p></Reveal>
      <Reveal index={3}>
        <motion.button className="btn" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          방으로 돌아가기
        </motion.button>
      </Reveal>
    </section>
  );
}
