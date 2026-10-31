"use client";
// 보안: the right monitor's terminal, full screen. The session types itself in (ssh, cat, the grass graph filling cell by
// cell like a scoreboard), the title decrypts from noise, and then it is a tiny shell: try help, open, grass, clear, exit.
import { useEffect, useMemo, useRef, useState } from "react";
import type { SceneProps } from "../Stage";
import { blip } from "../sfx";

type Line = { kind: "cmd" | "out" | "grass"; text: string };
const GLYPHS = "!<>-_\\/[]{}=+*^?#01アイウ";

function rand(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }

export default function HackScene({ room, reduce, openRecords, close }: SceneProps) {
  const script: Line[] = useMemo(() => [
    { kind: "cmd", text: "ssh 0zong@room" },
    { kind: "out", text: "연결됐어요. 마지막 접속: 오늘" },
    { kind: "cmd", text: "cat about.txt" },
    { kind: "out", text: room.desc },
    { kind: "cmd", text: "./grass --weeks 26" },
    { kind: "grass", text: "" },
    { kind: "out", text: `[+] ${room.update}` },
  ], [room.desc, room.update]);
  const [shown, setShown] = useState(reduce ? script.length : 0);
  const [typing, setTyping] = useState("");
  const [extra, setExtra] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [title, setTitle] = useState(reduce ? room.label : "");
  const end = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  // Title decrypts: each letter cycles through noise before it locks.
  useEffect(() => {
    if (reduce) return;
    let f = 0;
    const target = [...room.label];
    const t = setInterval(() => {
      f++;
      setTitle(target.map((c, i) => (f > i * 4 + 8 ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(""));
      if (f > target.length * 4 + 8) clearInterval(t);
    }, 45);
    return () => clearInterval(t);
  }, [reduce, room.label]);

  // The scripted session: commands are typed, outputs appear.
  useEffect(() => {
    if (shown >= script.length) { field.current?.focus({ preventScroll: true }); return; }
    const line = script[shown];
    if (line.kind !== "cmd") { const t = setTimeout(() => setShown((n) => n + 1), line.kind === "grass" ? 1500 : 250); return () => clearTimeout(t); }
    if (typing.length < line.text.length) {
      const t = setTimeout(() => { setTyping(line.text.slice(0, typing.length + 1)); blip(1500 + Math.random() * 400, 0.015); }, 45);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setShown((n) => n + 1); setTyping(""); }, 220);
    return () => clearTimeout(t);
  }, [shown, typing, script]);

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [shown, extra, typing]);

  const run = (raw: string) => {
    const c = raw.trim();
    const out = (text: string): Line => ({ kind: "out", text });
    const next: Line[] = [{ kind: "cmd", text: c }];
    if (c === "help") next.push(out("open  노트 열기\ngrass  잔디 다시 보기\nwhoami  나\nclear  화면 지우기\nexit  방으로 돌아가기"));
    else if (c === "open" || c.startsWith("cat notes")) { next.push(out("notes/ 를 열어요…")); setTimeout(openRecords, 300); }
    else if (c === "grass") next.push({ kind: "grass", text: "" });
    else if (c === "whoami") next.push(out("0zong · 보안 공부하는 사람 (취미로 진지하게)"));
    else if (c === "clear") { setExtra([]); return; }
    else if (c === "exit") { close(); return; }
    else if (c === "sudo rm -rf /") next.push(out("그건 안 돼요. 여긴 내 방이에요."));
    else if (c) next.push(out(`${c}: 그런 명령은 없어요. help를 입력해 보세요.`));
    setExtra((x) => [...x, ...next]);
  };

  const lines = [...script.slice(0, shown), ...extra];
  return (
    <div className="term-root" onClick={() => field.current?.focus({ preventScroll: true })}>
      <h1 className="term-title" aria-label={room.label}>{title}</h1>
      <div className="term" role="log" aria-label="터미널">
        {lines.map((l, i) => <TermLine key={i} l={l} seed={i} />)}
        {shown < script.length && script[shown].kind === "cmd" && <p className="t-cmd"><b>$</b> {typing}<span className="t-caret" /></p>}
        {shown >= script.length && (
          <form className="t-cmd t-input" onSubmit={(e) => { e.preventDefault(); run(input); setInput(""); }}>
            <b>$</b>
            <input ref={field} value={input} onChange={(e) => setInput(e.target.value)} aria-label="명령어 (help를 입력해 보세요)" autoComplete="off" spellCheck={false} />
          </form>
        )}
        <div ref={end} />
      </div>
      <div className="term-actions">
        <button onClick={(e) => { e.stopPropagation(); run("open"); }}>$ open notes/</button>
        <button onClick={(e) => { e.stopPropagation(); run("help"); }}>$ help</button>
      </div>
    </div>
  );
}

function TermLine({ l, seed }: { l: Line; seed: number }) {
  if (l.kind === "cmd") return <p className="t-cmd"><b>$</b> {l.text}</p>;
  if (l.kind === "out") return <p className="t-out">{l.text}</p>;
  const r = rand(seed * 977 + 13);
  return (
    <div className="t-grass" aria-label="26주 잔디 (예시)">
      {Array.from({ length: 26 * 7 }, (_, i) => {
        const v = r(); const lv = v < 0.35 ? 0 : v < 0.6 ? 1 : v < 0.82 ? 2 : v < 0.95 ? 3 : 4;
        return <i key={i} data-l={lv} style={{ animationDelay: `${Math.floor(i / 7) * 45 + (i % 7) * 8}ms` }} />;
      })}
      <small>26주 · 예시</small>
    </div>
  );
}
