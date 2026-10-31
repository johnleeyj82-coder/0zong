"use client";
// 책: a book on a dark table. The cover swings open, the left page writes itself letter by letter, and on the right page
// a map of an imagined land draws its own coastline, river and road. The page corner opens the world notes.
import type { SceneProps } from "../Stage";
import { recordsLabel } from "../Stage";

export default function BookScene({ room, reduce, openRecords }: SceneProps) {
  const chars = [...room.desc];
  return (
    <div className="book-root" data-reduce={reduce || undefined}>
      <div className="book">
        <div className="book-cover" aria-hidden><span>{room.label}</span><i /></div>
        <div className="page left">
          <h1 className="book-title">{room.label}</h1>
          <p className="book-text" aria-label={room.desc}>
            {chars.map((c, i) => <span key={i} aria-hidden style={{ animationDelay: `${1.3 + i * 0.03}s` }}>{c}</span>)}
          </p>
          <p className="book-update">{room.update}</p>
        </div>
        <div className="page right">
          <svg className="map" viewBox="0 0 300 380" aria-label="예시 지도: 상상한 세계의 해안선과 강">
            <path className="ink coast" d="M40 60 C70 30 120 50 150 40 C190 28 230 60 255 90 C280 125 250 160 265 200 C280 245 240 290 200 310 C160 332 120 345 85 320 C55 298 70 255 50 225 C28 190 55 160 45 125 C38 100 20 85 40 60 Z" />
            <path className="ink river" d="M150 70 C140 110 170 140 155 180 C140 220 175 250 160 300" />
            <path className="ink road" d="M70 250 C110 230 140 240 170 210 C200 180 220 150 230 120" />
            {[[95, 110], [112, 98], [128, 112], [210, 250], [226, 238]].map(([x, y], i) => (
              <path key={i} className="ink peak" style={{ animationDelay: `${2.6 + i * 0.12}s` }} d={`M${x - 10} ${y + 8} L${x} ${y - 8} L${x + 10} ${y + 8}`} />
            ))}
            <g className="ink-fade">
              <circle cx="170" cy="210" r="4" /><text x="178" y="206">정령의 마을</text>
              <circle cx="85" cy="250" r="4" /><text x="40" y="272">첫 번째 관문</text>
              <text x="230" y="350" className="compass">N ↑</text>
              <text x="20" y="372" className="ex">예시 지도</text>
            </g>
          </svg>
          <button className="page-corner" onClick={openRecords}>{recordsLabel("book")} <span aria-hidden>↗</span></button>
        </div>
      </div>
    </div>
  );
}
