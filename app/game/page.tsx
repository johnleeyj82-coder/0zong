import type { Metadata } from "next";
import GameBoard from "../components/game/GameBoard";

export const metadata: Metadata = {
  title: "세이브 파일 | 0zong의 방",
  description: "게임마다 플레이 시간과 마지막으로 저장한 곳, 그날 본 것과 깬 것을 남겨둔 세이브 파일이에요.",
};

export default function GamePage() {
  return <GameBoard />;
}
