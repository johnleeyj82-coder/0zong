"use client";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { useRoom } from "./RoomContext";

export default function RoomsSection() {
  const { rooms, openDrawer } = useRoom();
  return (
    <section id="rooms" className="section" aria-labelledby="rooms-h">
      <Reveal><span className="label">The rooms</span></Reveal>
      <Reveal index={1}><h2 id="rooms-h" className="display">방 안의 열한 가지</h2></Reveal>
      <div className="room-grid">
        {rooms.map((r, i) => (
          <Reveal as="article" key={r.key} id={`room-${r.key}`} className="room-card" index={i % 4}>
            <button className="room-hit" onClick={() => openDrawer(r.key)} aria-label={`${r.label} 열어보기`} />
            <div className="top">
              <span className="icon-ring"><r.icon size={19} aria-hidden /></span>
              <span className="ix">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3>{r.title} <span className="kr">{r.label}</span></h3>
            <p>{r.desc}</p>
            <span className="update">{r.update}</span>
            <span className="open">열어보기 <ArrowUpRight size={14} aria-hidden /></span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
