import {
  BookOpen, Clapperboard, Crown, Disc3, Film, Gamepad2, Palette, Spade, Terminal, Wine, Grid2x2, House,
  type LucideIcon,
} from "lucide-react";

/** Number of files in public/frames. Run `npm run frames` after replacing the frames and paste the result here. */
export const FRAME_COUNT = 202;

/** Scroll progress (0–1 within the hero) where the camera rests on each keyframe: intro, the 10 objects, then the wide hub shot. */
export const MARKS = [0.01, 0.0995, 0.1891, 0.2786, 0.3682, 0.4577, 0.5473, 0.6368, 0.7264, 0.8159, 0.9055, 0.995];

export type RoomKey =
  | "music" | "video" | "book" | "game" | "hack" | "poker" | "art" | "whisky" | "chess" | "movie" | "tetris";

export type Room = {
  key: RoomKey;
  label: string;
  title: string;
  desc: string;
  update: string;
  icon: LucideIcon;
  /** Where the object sits inside the frame at its keyframe: [x, y, w, h] as fractions of the frame. */
  rect?: [number, number, number, number];
  /** Index into MARKS for objects that appear in the camera tour. */
  mark?: number;
};

export const ROOMS: Room[] = [
  { key: "music", label: "음악", title: "music", icon: Disc3, mark: 1, rect: [0.2254, 0.3629, 0.2691, 0.2742],
    desc: "요즘 빠진 음악과 효과음, 밈을 모아두고 계속 들어요. 다른 방으로 가도 플레이어는 따라옵니다.",
    update: "재생 중 · 새 효과음 3개" },
  { key: "video", label: "영상", title: "video", icon: Clapperboard, mark: 2, rect: [0.1041, 0.3852, 0.2727, 0.2295],
    desc: "직접 찍고 편집한 영상들. 인스타보다 의도와 콘티가 더 잘 보이게 걸어둡니다.",
    update: "새 단편 · 「빗소리」 3분 12초" },
  { key: "book", label: "책", title: "book", icon: BookOpen, mark: 3, rect: [0.0, 0.19, 0.4335, 0.62],
    desc: "소설을 읽으며 상상한 세계관과 종족, 지도를 내가 만든 질문별로 쌓아요.",
    update: "어제 · 『룬의 아이들』 종족 메모" },
  { key: "game", label: "게임", title: "game", icon: Gamepad2, mark: 4, rect: [0.2093, 0.3406, 0.3014, 0.3188],
    desc: "플레이 시간과 그날 본 것, 깬 것, 공략 메모가 스레드처럼 쌓이는 피드.",
    update: "2시간 전 · 엘든링 +3h" },
  { key: "hack", label: "보안", title: "hack", icon: Terminal, mark: 5, rect: [0.2075, 0.3406, 0.305, 0.3188],
    desc: "보안 공부 노트. 매일 푼 만큼 잔디가 칠해지고, 다시 볼 노트를 알려줘요.",
    update: "오늘 · 2문제, 잔디 12일째" },
  { key: "poker", label: "포커", title: "poker", icon: Spade, mark: 6, rect: [0.13, 0.4819, 0.46, 0.1977],
    desc: "홀덤을 처음 배우는 튜토리얼부터, 친구들과 블라인드를 정해 여는 실시간 테이블까지.",
    update: "방 2개 열림 · 50/100" },
  { key: "art", label: "그림", title: "art", icon: Palette, mark: 7, rect: [0.6241, 0.19, 0.119, 0.62],
    desc: "그림 연습 일지. 무엇을 연습했고, 무엇을 배웠고, 다음엔 뭘 할지.",
    update: "3일 전 · 손 드로잉 6장" },
  { key: "whisky", label: "바", title: "bar", icon: Wine, mark: 8, rect: [0.6092, 0.19, 0.1256, 0.62],
    desc: "조주기능사 준비. 레시피와 기법, 직접 만들어본 맛 기록과 양 조절 실습.",
    update: "실습 기록 14개" },
  { key: "chess", label: "체스", title: "chess", icon: Crown, mark: 9, rect: [0.6304, 0.382, 0.3266, 0.2359],
    desc: "말을 옮기려면 저격이나 가위바위보를 이겨야 하는 변형 체스. 누가 몇 단계까지 깼는지 남아요.",
    update: "스나이퍼 체스 · 5단계 돌파" },
  { key: "movie", label: "영화", title: "movie", icon: Film, mark: 10, rect: [0.7603, 0.0, 0.2364, 0.62],
    desc: "그리고 오늘의 상영작. 나만의 0~5점 기준으로 매긴 평점과 감상, 보고 싶은 목록.",
    update: "방금 · 『퍼펙트 데이즈』 4.5점" },
  { key: "tetris", label: "테트리스", title: "tetris", icon: Grid2x2,
    desc: "정해진 시간 안에 몇 줄을 지우는지 겨루는 기록전. 이름을 안 적으면 방명록 이름으로 남아요.",
    update: "신기록 · 민수 2분 87줄" },
];

export const HOME_ICON = House;
