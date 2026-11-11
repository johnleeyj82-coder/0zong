import type { Metadata } from "next";
import HobbyShell from "../hobby/Shell";
import BookPage from "../hobby/pages/Book";

export const metadata: Metadata = {
  title: "세계관 노트 | 0zong의 방",
  description: "소설을 읽으며 상상한 종족과 지도와 물건을, 내가 만든 질문별로 쌓아 둔 노트예요.",
};

export default function Page() {
  return <HobbyShell k="book"><BookPage /></HobbyShell>;
}
