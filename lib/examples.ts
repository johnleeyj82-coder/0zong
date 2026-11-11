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
    e("book-4", "book", 6 * D, "눈물을 마시는 새", { tag: "종족은 어떻게 생겼나", notes: ["나가: 비늘이 빛을 받으면 무지갯빛이 돈다고 상상함. 체온이 없어서 손이 늘 차갑다."] }),
    e("book-5", "book", 13 * D, "눈물을 마시는 새", { tag: "대륙의 지도", notes: ["한계선 남쪽은 숲이 하늘을 가려서 낮에도 어둡다고 그려봄."] }),
    e("book-6", "book", 18 * D, "룬의 아이들", { tag: "종족은 어떻게 생겼나", notes: ["북쪽 사람들은 눈 색이 겨울 하늘 같고, 말할 때 입김이 유난히 길게 남는다."] }),
    e("book-7", "book", 27 * D, "눈물을 마시는 새", { tag: "도시의 소리", notes: ["탑 꼭대기 종은 하루에 한 번, 해가 가장 높을 때만 울린다."] }),

    e("music-1", "music", 6 * H, "새벽 3시 로파이", { tag: "음악", notes: ["직접 올린 파일 · 5:48"] }),
    e("music-2", "music", 3 * D, "오래된 CRT 켜지는 소리", { tag: "효과음" }),
    e("music-3", "music", 6 * D, "요즘 단톡방에서 계속 쓰는 그 소리", { tag: "밈" }),

    e("whisky-1", "whisky", 2 * D, "B-52", { tag: "플로트", notes: ["커피 리큐어 → 크림 리큐어 → 오렌지 리큐어, 각 1/3 oz", "바 스푼 뒤로 천천히 흘리니 층이 안 섞였어요."] }),
    e("whisky-2", "whisky", 7 * D, "하이볼", { tag: "빌드", notes: ["위스키 45ml, 탄산수 135ml", "얼음을 먼저 가득 채우는 게 핵심."] }),
    e("whisky-3", "whisky", 12 * D, "맨해튼", { tag: "스터", notes: ["버번 45ml, 스위트 베르무트 22ml, 비터스 2dash", "30번 젓고 바로 따르기. 더 저으면 물맛이 나요."] }),
    e("whisky-4", "whisky", 17 * D, "위스키 사워", { tag: "셰이크", notes: ["버번 45ml, 레몬 주스 22ml, 시럽 15ml", "얼음 없이 먼저 흔들면 거품이 곱게 올라와요."] }),
    e("whisky-5", "whisky", 25 * D, "올드 패션드", { tag: "빌드", notes: ["버번 60ml, 각설탕 1, 비터스 3dash", "설탕을 다 녹이고 얼음을 넣어야 해요."] }),

    e("poker-1", "poker", 3 * D, "AI와 한 판", { value: 42, notes: ["버튼에서 3BB 오픈 연습. 리버 블러프는 아직 어려워요."] }),
    e("poker-2", "poker", 10 * D, "친구들과 홈게임", { value: -18, notes: ["블라인드 50/100 · 5명."] }),
    e("poker-3", "poker", 6 * D, "AI와 한 판", { value: 15, notes: ["스몰 블라인드에서 너무 많이 콜했어요."] }),
    e("poker-4", "poker", 14 * D, "AI와 한 판", { value: -30, notes: ["탑 페어로 올인 콜. 상대는 세트."] }),
    e("poker-5", "poker", 18 * D, "친구들과 홈게임", { value: 64, notes: ["블라인드 50/100 · 6명. 포지션만 지켜도 이겨요."] }),
    e("poker-6", "poker", 23 * D, "AI와 한 판", { value: 8, notes: ["컨티뉴에이션 벳 크기를 1/3 팟으로 줄여 봄."] }),
    e("poker-7", "poker", 29 * D, "AI와 한 판", { value: -12, notes: ["너무 많은 핸드로 참여했어요."] }),
    e("poker-8", "poker", 36 * D, "친구들과 홈게임", { value: 21, notes: ["블라인드 25/50 · 4명."] }),

    e("chess-1", "chess", 4 * D, "지훈", { tag: "가위바위보", value: 7 }),
    e("chess-2", "chess", 6 * D, "나", { tag: "저격", value: 5 }),

    e("chess-3", "chess", 9 * D, "하늘", { tag: "가위바위보", value: 4 }),
    e("chess-4", "chess", 12 * D, "민수", { tag: "저격", value: 9 }),
    e("chess-5", "chess", 15 * D, "나", { tag: "가위바위보", value: 6 }),
    e("chess-6", "chess", 20 * D, "서연", { tag: "저격", value: 3 }),

    e("tetris-1", "tetris", 2 * D, "민수", { value: 87 }),
    e("tetris-2", "tetris", 5 * D, "하늘", { value: 81 }),
    e("tetris-3", "tetris", 7 * D, "나", { value: 76 }),
    e("tetris-4", "tetris", 9 * D, "지훈", { value: 64 }),
    e("tetris-5", "tetris", 13 * D, "서연", { value: 58 }),
    e("tetris-6", "tetris", 16 * D, "나", { value: 52 }),
    e("tetris-7", "tetris", 21 * D, "도윤", { value: 41 }),

    e("video-1", "video", 5 * D, "「빗소리」 3분 12초", { notes: ["창밖 빗소리만으로 하루의 감정 변화를 보여주고 싶었어요.", "소리를 먼저 깔고 컷을 맞추니 리듬이 살아났어요.", "한 컷으로 찍는 1분짜리 영상."] }),
    e("video-2", "video", 19 * D, "「퇴근길」 1분 40초", { notes: ["지하철 창에 비친 얼굴만으로 하루를 정리하고 싶었어요.", "흔들리는 화면은 후반에서 못 고쳐요. 찍을 때 잡아야 해요.", "삼각대 없이 버티는 자세 연습."] }),
    e("video-3", "video", 33 * D, "「라면」 58초", { notes: ["소리만 들어도 배고파지는 영상.", "클로즈업 컷이 길면 지루해요. 2초 안에 끊기.", "조명 하나로 김이 보이게 찍기."] }),
    e("video-4", "video", 52 * D, "「방 청소」 타임랩스", { notes: ["치우기 전과 후를 한 화면에.", "타임랩스는 구도가 전부예요.", "창밖 하늘이 바뀌는 것까지 담기."] }),

    e("art-1", "art", 3 * D, "손 드로잉 6장", { notes: ["손가락 관절 비율을 잡고 싶었어요.", "손바닥을 먼저 상자로 잡으면 덜 무너져요.", "물건을 쥔 손 그리기."] }),
    e("art-2", "art", 8 * D, "크로키 30초 × 20", { notes: ["선을 아끼는 연습.", "어깨부터 그으면 선이 살아요.", "1분 크로키로 넘어가기."] }),
    e("art-3", "art", 14 * D, "방 구석 투시", { notes: ["내 방을 2점 투시로 그려 보고 싶었어요.", "소실점을 종이 밖에 두니 덜 왜곡돼요.", "가구까지 넣어서 다시."] }),
    e("art-4", "art", 22 * D, "얼굴 비율", { notes: ["눈 위치가 늘 높게 잡혀서.", "눈은 머리 높이의 정확히 절반.", "옆얼굴 10장."] }),
    e("art-5", "art", 31 * D, "먹 번짐 연습", { notes: ["붓 하나로 농담을 내 보고 싶었어요.", "물을 먼저 바르면 번짐을 조절할 수 있어요.", "대나무 잎 그리기."] }),
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
