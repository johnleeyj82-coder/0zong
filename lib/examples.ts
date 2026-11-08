// Example records shown until the owner adds real ones. Every entry is marked `example: true` and labelled "예시" in the UI.
// Times are relative to `now` so the examples always look recent.
import type { Entry } from "./types";

const H = 3600_000, D = 24 * H;

/** Deterministic pseudo-random in [0, 1). */
const rand = (i: number) => Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);

export function exampleEntries(now = Date.now()): Entry[] {
  const e = (id: string, room: string, ago: number, title: string, rest: Partial<Entry> = {}): Entry =>
    ({ id: `ex-${id}`, room, at: now - ago, title, notes: [], example: true, ...rest });

  const list: Entry[] = [
    e("game-1", "game", 2 * H, "엘든링", { value: 3, tag: "본편 엔딩 전", notes: ["말레니아 클리어. 2페이즈 패턴은 왼쪽으로 크게 구르기."] }),
    e("game-2", "game", 2 * D + 3 * H, "할로우 나이트", { value: 1.5, tag: "112%", notes: ["눈물의 도시 비 내리는 구간 스크린샷 4장."] }),
    e("game-3", "game", 5 * D, "엘든링", { value: 2, tag: "본편 엔딩 전", notes: ["공략 메모: 호수 남쪽 계단 아래 숨은 상인."] }),
    e("game-4", "game", 9 * D, "발더스 게이트 3", { value: 4, tag: "2막", notes: ["동료 대화를 다 보느라 진행이 느려요."] }),

    e("movie-1", "movie", 1 * D, "퍼펙트 데이즈", { value: 4.5, tag: "봤어요", notes: ["반복되는 하루가 이렇게 다정할 수 있다니."] }),
    e("movie-2", "movie", 8 * D, "애프터썬", { value: 5, tag: "봤어요", notes: ["마지막 장면에서 한참 못 일어났어요."] }),
    e("movie-3", "movie", 24 * D, "듄: 파트 2", { value: 4, tag: "봤어요", notes: ["사운드를 극장에서 들어야 하는 영화."] }),
    e("movie-4", "movie", 3 * D, "괴물", { tag: "보고 싶어요" }),

    e("book-1", "book", 1 * D + 4 * H, "룬의 아이들", { tag: "종족은 어떻게 생겼나", notes: ["정령족: 피부가 반쯤 투명하고 감정에 따라 내부의 빛 색이 바뀐다고 상상함."] }),
    e("book-2", "book", 4 * D, "룬의 아이들", { tag: "대륙의 지도", notes: ["북쪽 설원과 남쪽 사막 사이에 거대한 협곡이 있다고 그려봄."] }),
    e("book-3", "book", 11 * D, "룬의 아이들", { tag: "주인공의 검", notes: ["손잡이에 룬이 하나씩 새겨질 때마다 무게가 달라진다는 설정."] }),

    e("music-1", "music", 6 * H, "새벽 3시 로파이", { tag: "음악", notes: ["직접 올린 파일 · 5:48"] }),
    e("music-2", "music", 3 * D, "오래된 CRT 켜지는 소리", { tag: "효과음" }),
    e("music-3", "music", 6 * D, "요즘 단톡방에서 계속 쓰는 그 소리", { tag: "밈" }),

    e("whisky-1", "whisky", 2 * D, "B-52", { tag: "플로트", notes: ["커피 리큐어 → 크림 리큐어 → 오렌지 리큐어, 각 1/3 oz", "바 스푼 뒤로 천천히 흘리니 층이 안 섞였어요."] }),
    e("whisky-2", "whisky", 7 * D, "하이볼", { tag: "빌드", notes: ["위스키 45ml, 탄산수 135ml", "얼음을 먼저 가득 채우는 게 핵심."] }),

    e("poker-1", "poker", 3 * D, "AI와 한 판", { value: 42, notes: ["버튼에서 3BB 오픈 연습. 리버 블러프는 아직 어려워요."] }),
    e("poker-2", "poker", 10 * D, "친구들과 홈게임", { value: -18, notes: ["블라인드 50/100 · 5명."] }),

    e("chess-1", "chess", 4 * D, "지훈", { tag: "가위바위보", value: 7 }),
    e("chess-2", "chess", 6 * D, "나", { tag: "저격", value: 5 }),

    e("tetris-1", "tetris", 2 * D, "민수", { value: 87 }),
    e("tetris-2", "tetris", 5 * D, "하늘", { value: 81 }),
    e("tetris-3", "tetris", 7 * D, "나", { value: 76 }),

    e("video-1", "video", 5 * D, "「빗소리」 3분 12초", { notes: ["창밖 빗소리만으로 하루의 감정 변화를 보여주고 싶었어요.", "소리를 먼저 깔고 컷을 맞추니 리듬이 살아났어요.", "한 컷으로 찍는 1분짜리 영상."] }),
    e("art-1", "art", 3 * D, "손 드로잉 6장", { notes: ["손가락 관절 비율을 잡고 싶었어요.", "손바닥을 먼저 상자로 잡으면 덜 무너져요.", "물건을 쥔 손 그리기."] }),
  ];

  // hack: ~26 weeks of solved problems so the heatmap has something to show.
  const fields = ["pwn", "pwn", "pwn", "crypto", "crypto", "web"];
  const notes = ["스택 카나리 우회: 포맷 스트링으로 먼저 유출.", "RSA 작은 e 공격. 세제곱근만 구하면 끝.", "SSTI로 설정 파일 읽기.", "ROP 체인 만들 때 정렬 맞추기."];
  for (let d = 0, n = 0; d < 26 * 7; d++) {
    const r = rand(d + 1);
    if (r < 0.55) continue;
    const count = r > 0.9 ? 3 : r > 0.75 ? 2 : 1;
    list.push(e(`hack-${d}`, "hack", d * D + 5 * H, `연습 문제 ${++n}`, {
      tag: fields[d % fields.length], value: count, notes: d % 9 === 0 ? [notes[(d / 9) % notes.length]] : [],
    }));
  }
  return list;
}
