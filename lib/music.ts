// Music room records, shared by the server (store, API) and the browser (player, drawer).

export type Track = {
  id: string;
  title: string;
  artist: string;
  /** Source and license, shown next to the track (CC-BY and similar require it). */
  credit: string;
  /** Seconds, measured in the owner's browser before upload. */
  duration: number;
  mime: string;
  ext: string;
  size: number;
  addedAt: number;
};

export const MAX_TRACK_BYTES = 30 * 1024 * 1024;

export const clock = (sec: number) => {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
