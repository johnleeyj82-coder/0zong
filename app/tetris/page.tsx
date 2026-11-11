import type { Metadata } from "next";
import HobbyShell from "../hobby/Shell";
import TetrisPage from "../hobby/pages/Tetris";

export const metadata: Metadata = {
  title: "HI-SCORE | 0zong의 방",
  description: "2분 동안 몇 줄을 지웠는지 겨루는 기록판이에요.",
};

export default function Page() {
  return <HobbyShell k="tetris"><TetrisPage /></HobbyShell>;
}
