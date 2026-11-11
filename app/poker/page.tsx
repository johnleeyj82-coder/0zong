import type { Metadata } from "next";
import HobbyShell from "../hobby/Shell";
import PokerPage from "../hobby/pages/Poker";

export const metadata: Metadata = {
  title: "장부 | 0zong의 방",
  description: "판마다 몇 BB를 따고 잃었는지 적어 둔 포커 장부예요.",
};

export default function Page() {
  return <HobbyShell k="poker"><PokerPage /></HobbyShell>;
}
