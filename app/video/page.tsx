import type { Metadata } from "next";
import HobbyShell from "../hobby/Shell";
import VideoPage from "../hobby/pages/Video";

export const metadata: Metadata = {
  title: "편집실 | 0zong의 방",
  description: "직접 찍고 편집한 영상의 의도와 배운 것을 타임라인에 올려 둔 편집실이에요.",
};

export default function Page() {
  return <HobbyShell k="video"><VideoPage /></HobbyShell>;
}
