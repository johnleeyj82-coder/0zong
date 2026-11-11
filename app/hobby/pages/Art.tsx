"use client";
// 그림 — 화첩. Practice notes hang as scrolls on a line. The page counts practices the old way, in 正 tally marks drawn
// stroke by stroke, and the scroll you pick unrolls into three brushed columns: what I meant, what I learned, what is next.
import { useRef, useState } from "react";
import { animate, createTimeline, stagger, svg } from "animejs";
import { md } from "@/lib/time";
import { useHobby } from "../Shell";
import { jitter, useAnime } from "../anime";

// The five strokes of 正, in writing order, inside a 40×40 box.
const JEONG = ["M6 7 H34", "M20 7 V33", "M20 20 H32", "M10 18 V33", "M4 33 H36"];
const HEADS = ["의도", "배운 것", "다음에 할 것"];

export default function ArtPage() {
  const { entries, ready } = useHobby();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(0);
  const cur = entries[Math.min(open, entries.length - 1)];

  useAnime(root, () => {
    createTimeline({ defaults: { ease: "outExpo" } })
      .add(svg.createDrawable(".art-underline path"), { draw: ["0 0", "0 1"], duration: 900 })
      .add(svg.createDrawable(".tally path"), { draw: ["0 0", "0 1"], duration: 260, delay: stagger(90), ease: "outQuad" }, 200)
      .add(".scroll", { y: [-140, 0], opacity: [0, 1], rotate: { from: () => (Math.random() - 0.5) * 16, to: 0 }, duration: 1100, delay: stagger(110), ease: "outElastic(1, .7)" }, 350);
  }, [ready, entries.length]);

  // The picked scroll's columns are inked in, a character at a time.
  useAnime(root, () => {
    animate(".art-open .ch", { opacity: [0, 1], filter: ["blur(4px)", "blur(0px)"], duration: 420, delay: stagger(14), ease: "outQuad" });
    animate(".art-open .seal", { scale: [1.8, 1], opacity: [0, 0.92], rotate: [-18, -6], duration: 420, delay: 500, ease: "outBack(2)" });
  }, [ready, cur?.id]);

  const tallies = Array.from({ length: Math.ceil(entries.length / 5) }, (_, g) => Math.min(5, entries.length - g * 5));

  return (
    <div ref={root} className="art-page">
      <header className="art-head">
        <h1>화첩</h1>
        <svg className="art-underline" viewBox="0 0 400 24" aria-hidden><path d="M6 14 C80 4 160 22 240 10 S360 6 394 14" /></svg>
        <p>무엇을 연습했고, 무엇을 배웠고, 다음엔 뭘 할지. 한 번 그릴 때마다 획을 하나씩 그어 둬요.</p>
        <div className="tally" role="img" aria-label={`지금까지 연습 ${entries.length}번`}>
          {tallies.map((n, g) => (
            <svg key={g} viewBox="0 0 40 40">{JEONG.slice(0, n).map((d) => <path key={d} d={d} />)}</svg>
          ))}
          <span>{entries.length}번</span>
        </div>
      </header>

      {ready && !entries.length && <p className="art-empty">아직 걸어 둔 연습이 없어요. 첫 연습을 기록하면 여기에 족자로 걸려요.</p>}

      <div className="art-line" role="tablist" aria-label="연습 기록">
        {entries.map((e, i) => (
          <button key={e.id} role="tab" aria-selected={e.id === cur?.id} className="scroll" style={{ ["--tilt" as string]: `${jitter(i) * 3}deg`, ["--drop" as string]: `${Math.abs(jitter(i, 3)) * 28}px` }}
            onClick={() => setOpen(i)}>
            <span className="rod" /><span className="paper"><b>{e.title}</b><time>{md(e.at)}</time></span><span className="rod" />
          </button>
        ))}
      </div>

      {cur && (
        <section className="art-open" key={cur.id} aria-live="polite">
          <h2>{cur.title}<span className="seal" aria-hidden>零<br />宗</span></h2>
          <div className="art-cols">
            {HEADS.map((h, i) => cur.notes[i] ? (
              <div key={h}>
                <h3>{h}</h3>
                <p aria-label={cur.notes[i]}>{[...cur.notes[i]].map((c, j) => <span key={j} className="ch" aria-hidden>{c}</span>)}</p>
              </div>
            ) : null)}
          </div>
          {cur.example && <small className="art-ex">예시</small>}
        </section>
      )}
    </div>
  );
}
