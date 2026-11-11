import type { Metadata } from "next";
import HobbyShell from "../hobby/Shell";
import MusicPage from "../hobby/pages/Music";

export const metadata: Metadata = {
  title: "음반 상자 | 0zong의 방",
  description: "직접 올린 곡을 음반 상자에서 꺼내 듣는 곳이에요.",
};

export default function Page() {
  return <HobbyShell k="music"><MusicPage /></HobbyShell>;
}
