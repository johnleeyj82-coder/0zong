import type { Metadata } from "next";
import HobbyShell from "../hobby/Shell";
import ChessPage from "../hobby/pages/Chess";

export const metadata: Metadata = {
  title: "단계 사다리 | 0zong의 방",
  description: "변형 체스에서 누가 몇 단계까지 올라갔는지 보여 주는 사다리예요.",
};

export default function Page() {
  return <HobbyShell k="chess"><ChessPage /></HobbyShell>;
}
