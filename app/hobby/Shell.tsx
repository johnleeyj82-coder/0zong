"use client";
// The frame every hobby page shares, and nothing more: the records of that hobby, a way back to the room it stands in,
// and (for the owner) the record editor. How the page looks is entirely the page's own business.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil, X } from "lucide-react";
import type { Entry } from "@/lib/types";
import { spaceLabel, type Room, type RoomKey } from "../data";
import { RoomProvider, useRoom } from "../components/RoomContext";
import { PageLink } from "../components/PageLink";
import EntryEditor from "../rooms/EntryEditor";
import { OWN_DATA } from "../rooms/schema";
import "./hobby.css";

type Ctx = { room: Room; entries: Entry[]; ready: boolean; owner: boolean; examples: boolean };
const C = createContext<Ctx | null>(null);
export const useHobby = () => {
  const v = useContext(C);
  if (!v) throw new Error("useHobby must be used inside HobbyShell");
  return v;
};

export default function HobbyShell({ k, children }: { k: RoomKey; children: React.ReactNode }) {
  return <RoomProvider><Inner k={k}>{children}</Inner></RoomProvider>;
}

function Inner({ k, children }: { k: RoomKey; children: React.ReactNode }) {
  const { rooms, entries, entriesReady, owner, track } = useRoom();
  const room = rooms.find((r) => r.key === k)!;
  const mine = useMemo(() => entries.filter((e) => e.room === k), [entries, k]);
  const [editing, setEditing] = useState(false);
  const own = OWN_DATA.includes(k);
  const examples = !own && mine.some((e) => e.example);

  // Opening the page counts as opening the hobby (named and anonymous visitors only; RoomProvider drops the rest).
  useEffect(() => { track("open", k); }, [k, track]);
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setEditing(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  return (
    <C.Provider value={{ room, entries: mine, ready: entriesReady, owner, examples }}>
      <div className={`hp hp-${k}`}>
        <nav className="hp-nav" aria-label="이동">
          {/* Client navigation, so music keeps playing; the house opens in the room this hobby stands in. */}
          <PageLink to="home" query={`?room=${room.space}`} className="hp-back"><ArrowLeft size={16} aria-hidden /> {spaceLabel(room.space)}으로</PageLink>
          <span className="hp-nav-right">
            {examples && <span className="hp-ex">예시 기록</span>}
            {owner && !own && <button className="hp-edit" onClick={() => setEditing(true)}><Pencil size={14} aria-hidden /> 기록 고치기</button>}
          </span>
        </nav>
        {children}
        {editing && (
          <div className="hp-sheet-scrim" onClick={() => setEditing(false)}>
            <aside className="hp-sheet" role="dialog" aria-modal="true" aria-label={`${room.label} 기록 고치기`} onClick={(e) => e.stopPropagation()}>
              <button className="icon-btn hp-sheet-x" onClick={() => setEditing(false)} aria-label="닫기"><X size={18} /></button>
              <h2 className="display">{room.label} 기록</h2>
              <EntryEditor k={k} entries={mine} />
            </aside>
          </div>
        )}
      </div>
    </C.Provider>
  );
}
