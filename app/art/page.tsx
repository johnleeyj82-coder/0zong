import type { Metadata } from "next";
import HobbyShell from "../hobby/Shell";
import ArtPage from "../hobby/pages/Art";

export const metadata: Metadata = {
  title: "화첩 | 0zong의 방",
  description: "그림 연습 일지. 무엇을 연습했고, 무엇을 배웠고, 다음엔 뭘 할지 족자처럼 걸어 둔 화첩이에요.",
};

export default function Page() {
  return <HobbyShell k="art"><ArtPage /></HobbyShell>;
}
