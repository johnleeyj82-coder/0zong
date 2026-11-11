"use client";
// 책 — 세계관 노트. The books stand as spines on a shelf; the questions I made up are a table of contents with dotted
// leaders; the chapter you pick opens as a spread whose first letter is a drop cap and whose pages turn when you change it.
import { useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { md } from "@/lib/time";
import { useHobby } from "../Shell";
import { jitter, useAnime } from "../anime";

const SPINES = ["#6b2414", "#1f3d5c", "#3f5a3a", "#7a5a1c", "#4a2a4a", "#2b2b2b"];

export default function BookPage() {
  const { entries, ready } = useHobby();
  const root = useRef<HTMLDivElement>(null);
  const books = useMemo(() => [...new Set(entries.map((e) => e.title))], [entries]);
  const [book, setBook] = useState<string | null>(null);
  const inBook = useMemo(() => (book ? entries.filter((e) => e.title === book) : entries), [entries, book]);
  const questions = useMemo(() => [...new Set(inBook.map((e) => e.tag || "기타"))], [inBook]);
  const [q, setQ] = useState<string | null>(null);
  const cur = q && questions.includes(q) ? q : questions[0];
  const pages = inBook.filter((e) => (e.tag || "기타") === cur);

  useAnime(root, () => {
    animate(".spine", { y: [60, 0], opacity: [0, 1], duration: 800, delay: stagger(90), ease: "outExpo" });
    animate(".toc li", { opacity: [0, 1], x: [-16, 0], duration: 600, delay: stagger(60, { start: 300 }), ease: "outQuad" });
  }, [ready, entries.length]);

  // Changing chapter turns the page: the spread swings in from the gutter and the text settles.
  useAnime(root, () => {
    animate(".spread", { rotateY: [-70, 0], opacity: [0, 1], duration: 900, ease: "outExpo" });
    animate(".leaf", { opacity: [0, 1], y: [14, 0], duration: 700, delay: stagger(140, { start: 250 }), ease: "outQuad" });
  }, [ready, cur, book]);

  return (
    <div ref={root} className="bk-page">
      <header className="bk-head">
        <h1>세계관 노트</h1>
        <p>읽다가 멈춰서 상상한 것들. 책 속에 없는 부분을 내가 만든 질문으로 채워요.</p>
      </header>

      <div className="shelf" role="group" aria-label="책 고르기">
        {books.map((b, i) => (
          <button key={b} className="spine" aria-pressed={book === b} onClick={() => { setBook(book === b ? null : b); setQ(null); }}
            style={{ ["--c" as string]: SPINES[i % SPINES.length], ["--h" as string]: `${200 + jitter(i, 2) * 50}px`, ["--lean" as string]: `${i === books.length - 1 && books.length > 1 ? -5 : 0}deg` }}>
            <span>{b}</span><i>{entries.filter((e) => e.title === b).length}</i>
          </button>
        ))}
        <span className="shelf-board" aria-hidden />
      </div>

      {ready && !entries.length && <p className="bk-empty">아직 적어 둔 상상이 없어요. 첫 기록을 남기면 책이 책장에 꽂혀요.</p>}

      {entries.length > 0 && (
        <div className="bk-body">
          <nav className="toc" aria-label="질문 목차">
            <h2>{book ? `『${book}』` : "모든 책"}</h2>
            <ol>
              {questions.map((t, i) => (
                <li key={t}>
                  <button aria-current={t === cur} onClick={() => setQ(t)}>
                    <span>{t}</span><i aria-hidden /><em>{String(inBook.filter((e) => (e.tag || "기타") === t).length).padStart(2, "0")}</em>
                  </button>
                  <small>{["첫", "둘", "셋", "넷", "다섯", "여섯", "일곱"][i] ?? i + 1}째 질문</small>
                </li>
              ))}
            </ol>
          </nav>
          <article className="spread" key={`${book}-${cur}`} aria-live="polite">
            <h3>{cur}</h3>
            {pages.map((e) => (
              <div key={e.id} className="leaf">
                <p>{e.notes[0] || "아직 적지 않았어요."}</p>
                <footer>『{e.title}』 · {md(e.at)}{e.example && " · 예시"}</footer>
              </div>
            ))}
            <span className="folio" aria-hidden>{String(questions.indexOf(cur) + 1).padStart(2, "0")}</span>
          </article>
        </div>
      )}
    </div>
  );
}
