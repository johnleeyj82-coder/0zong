import type { Metadata } from "next";
import HobbyShell from "../hobby/Shell";
import HackPage from "../hobby/pages/Hack";

export const metadata: Metadata = {
  title: "notes/ | 0zong의 방",
  description: "보안 공부 노트. 푼 날마다 잔디가 칠해지고, 다시 볼 노트가 돌아와요.",
};

export default function Page() {
  return <HobbyShell k="hack"><HackPage /></HobbyShell>;
}
