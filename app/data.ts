import {
  BookOpen, Clapperboard, Crown, Disc3, Film, Gamepad2, Palette, Spade, Terminal, Wine, Grid2x2,
  type LucideIcon,
} from "lucide-react";

/** The rooms of the house, walked between through doors. The main room is in the middle and the default. */
export type SpaceId = "main" | "cinema" | "bedroom";
export const SPACES: { id: SpaceId; label: string; title: string }[] = [
  { id: "cinema", label: "영화방", title: "cinema" },
  { id: "main", label: "메인 방", title: "main" },
  { id: "bedroom", label: "침실", title: "bedroom" },
];
export const spaceLabel = (id?: string) => SPACES.find((s) => s.id === id)?.label ?? "";

export type RoomKey =
  | "music" | "video" | "book" | "game" | "hack" | "poker" | "art" | "whisky" | "chess" | "movie" | "tetris";

export type Room = {
  key: RoomKey;
  label: string;
  title: string;
  desc: string;
  update: string;
  icon: LucideIcon;
  /** The room of the house the object stands in. */
  space: SpaceId;
};

export const ROOMS: Room[] = [
  { key: "music", label: "음악", title: "music", icon: Disc3, space: "cinema",
    desc: "요즘 빠진 음악과 효과음, 밈을 모아두고 계속 들어요. 다른 방으로 가도 플레이어는 따라와요.",
    update: "재생 중 · 새 효과음 3개" },
  { key: "video", label: "영상", title: "video", icon: Clapperboard, space: "cinema",
    desc: "직접 찍고 편집한 영상들. 인스타보다 의도와 콘티가 더 잘 보이게 걸어둬요.",
    update: "새 단편 · 「빗소리」 3분 12초" },
  { key: "book", label: "책", title: "book", icon: BookOpen, space: "main",
    desc: "소설을 읽으며 상상한 세계관과 종족, 지도를 내가 만든 질문별로 쌓아요.",
    update: "어제 · 『룬의 아이들』 종족 메모" },
  { key: "game", label: "게임", title: "game", icon: Gamepad2, space: "main",
    desc: "플레이 시간과 그날 본 것, 깬 것, 공략 메모가 스레드처럼 쌓이는 피드.",
    update: "2시간 전 · 엘든링 +3h" },
  { key: "hack", label: "보안", title: "hack", icon: Terminal, space: "main",
    desc: "보안 공부 노트. 매일 푼 만큼 잔디가 칠해지고, 다시 볼 노트를 알려줘요.",
    update: "오늘 · 2문제, 잔디 12일째" },
  { key: "poker", label: "포커", title: "poker", icon: Spade, space: "cinema",
    desc: "홀덤을 처음 배우는 튜토리얼부터, 친구들과 블라인드를 정해 여는 실시간 테이블까지.",
    update: "방 2개 열림 · 50/100" },
  { key: "art", label: "그림", title: "art", icon: Palette, space: "main",
    desc: "그림 연습 일지. 무엇을 연습했고, 무엇을 배웠고, 다음엔 뭘 할지.",
    update: "3일 전 · 손 드로잉 6장" },
  { key: "whisky", label: "바", title: "bar", icon: Wine, space: "cinema",
    desc: "조주기능사 준비. 레시피와 기법, 직접 만들어본 맛 기록과 양 조절 실습.",
    update: "실습 기록 14개" },
  { key: "chess", label: "체스", title: "chess", icon: Crown, space: "main",
    desc: "말을 옮기려면 저격이나 가위바위보를 이겨야 하는 변형 체스. 누가 몇 단계까지 깼는지 남아요.",
    update: "스나이퍼 체스 · 5단계 돌파" },
  { key: "movie", label: "영화", title: "movie", icon: Film, space: "cinema",
    desc: "그리고 오늘의 상영작. 나만의 0~5점 기준으로 매긴 평점과 감상, 보고 싶은 목록.",
    update: "방금 · 『퍼펙트 데이즈』 4.5점" },
  { key: "tetris", label: "테트리스", title: "tetris", icon: Grid2x2, space: "main",
    desc: "정해진 시간 안에 몇 줄을 지우는지 겨루는 기록전. 이름을 안 적으면 방명록 이름으로 남아요.",
    update: "신기록 · 민수 2분 87줄" },
];

