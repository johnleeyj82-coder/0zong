/** "방금", "3분 전", "2시간 전", "5일 전", then the date. */
export function ago(at: number, now = Date.now()) {
  const s = Math.max(1, Math.round((now - at) / 1000));
  if (s < 60) return "방금";
  const m = Math.round(s / 60); if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60); if (h < 24) return `${h}시간 전`;
  const d = Math.round(h / 24); if (d < 30) return `${d}일 전`;
  return new Date(at).toLocaleDateString("ko-KR");
}

/** "10.25" */
export const md = (at: number) => { const d = new Date(at); return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`; };

/** Local midnight of the day containing `at`. */
export const dayStart = (at: number) => { const d = new Date(at); d.setHours(0, 0, 0, 0); return d.getTime(); };

/** "2026-11-09" for <input type="date">, in local time. */
export const toDateInput = (at: number) => {
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
