// What a record means in each room: field labels for the owner's editor, and the one-line summary used by
// the Lately feed. Change labels here; the drawer, editor and feed all read from this table.
import type { Entry } from "@/lib/types";
import type { RoomKey } from "../data";

type Field = { label: string; placeholder?: string };
export type Schema = {
  /** Button label for adding a record. */
  add: string;
  title: Field;
  /** `options` with `fixed` is a select; without `fixed` the options are suggestions. */
  tag?: Field & { options?: string[]; fixed?: boolean };
  value?: Field & { unit?: string; min: number; max: number; step: number; default?: number };
  notes: Field[];
  /** One line, e.g. "엘든링 +3h". Shown after the relative time: "2시간 전 · 엘든링 +3h". */
  line: (e: Entry) => string;
};

const n = (v?: number) => (v === undefined ? "" : Number.isInteger(v) ? String(v) : v.toFixed(1));
const signed = (v?: number) => (v === undefined ? "" : `${v > 0 ? "+" : ""}${n(v)}`);
const WORK_NOTES: Field[] = [{ label: "의도" }, { label: "배운 것" }, { label: "다음에 할 것" }];

export const SCHEMA: Record<RoomKey, Schema> = {
  game: {
    add: "플레이 기록 추가",
    title: { label: "게임", placeholder: "엘든링" },
    tag: { label: "진행", placeholder: "2막, 112%, 엔딩 전" },
    value: { label: "플레이 시간", unit: "h", min: 0, max: 24, step: 0.5 },
    notes: [{ label: "메모", placeholder: "본 것, 깬 것, 공략 메모" }],
    line: (e) => `${e.title}${e.value !== undefined ? ` +${n(e.value)}h` : ""}`,
  },
  hack: {
    add: "푼 문제 추가",
    title: { label: "문제", placeholder: "문제 이름" },
    tag: { label: "분야", options: ["pwn", "crypto", "web", "rev", "misc"] },
    value: { label: "푼 문제 수", min: 1, max: 50, step: 1, default: 1 },
    notes: [{ label: "풀이 노트", placeholder: "핵심 아이디어 한두 줄" }],
    line: (e) => `${e.title}${e.tag ? ` · ${e.tag}` : ""}`,
  },
  poker: {
    add: "판 기록 추가",
    title: { label: "어떤 판", placeholder: "AI와 한 판, 홈게임" },
    value: { label: "손익", unit: "BB", min: -9999, max: 9999, step: 1 },
    notes: [{ label: "메모" }],
    line: (e) => `${e.title}${e.value !== undefined ? ` ${signed(e.value)}BB` : ""}`,
  },
  book: {
    add: "상상 기록 추가",
    title: { label: "책", placeholder: "룬의 아이들" },
    tag: { label: "질문", placeholder: "종족은 어떻게 생겼나" },
    notes: [{ label: "상상한 것" }],
    line: (e) => `『${e.title}』${e.tag ? ` ${e.tag}` : ""}`,
  },
  movie: {
    add: "영화 추가",
    title: { label: "영화" },
    tag: { label: "상태", options: ["봤어요", "보고 싶어요"], fixed: true },
    value: { label: "내 점수", unit: "0~5", min: 0, max: 5, step: 0.1 },
    notes: [{ label: "한 줄" }],
    line: (e) => (e.tag === "보고 싶어요" ? `『${e.title}』 보고 싶은 목록에 추가` : `『${e.title}』${e.value !== undefined ? ` ${e.value.toFixed(1)}점` : ""}`),
  },
  music: {
    add: "곡 추가",
    title: { label: "제목" },
    tag: { label: "분류", options: ["음악", "효과음", "밈"], fixed: true },
    notes: [{ label: "메모" }],
    line: (e) => `${e.tag ? `${e.tag} · ` : ""}${e.title}`,
  },
  whisky: {
    add: "실습 기록 추가",
    title: { label: "칵테일", placeholder: "B-52" },
    tag: { label: "기법", options: ["빌드", "플로트", "셰이크", "스터"] },
    notes: [{ label: "레시피", placeholder: "재료와 양" }, { label: "실습 메모" }],
    line: (e) => `${e.title}${e.tag ? ` · ${e.tag}` : ""}`,
  },
  chess: {
    add: "기록 추가",
    title: { label: "이름" },
    tag: { label: "모드", placeholder: "가위바위보, 저격" },
    value: { label: "최고 단계", min: 0, max: 999, step: 1 },
    notes: [],
    line: (e) => `${e.title}${e.tag ? ` ${e.tag}` : ""}${e.value !== undefined ? ` ${n(e.value)}단계` : ""}`,
  },
  tetris: {
    add: "기록 추가",
    title: { label: "이름" },
    value: { label: "2분 동안 지운 줄", min: 0, max: 9999, step: 1 },
    notes: [],
    line: (e) => `${e.title} 2분 ${n(e.value)}줄`,
  },
  video: { add: "작품 추가", title: { label: "작품" }, notes: WORK_NOTES, line: (e) => `새 작업 · ${e.title}` },
  art: { add: "연습 추가", title: { label: "연습한 것" }, notes: WORK_NOTES, line: (e) => `연습 · ${e.title}` },
};

export const fmt = { n, signed };

/** These rooms keep their own data (movie scores, uploaded tracks, Steam): the generic records are not used for them. */
export const OWN_DATA: RoomKey[] = ["movie", "music", "game"];
