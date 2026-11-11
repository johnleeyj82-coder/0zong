import type { Metadata } from "next";
import HobbyShell from "../hobby/Shell";
import BarPage from "../hobby/pages/Bar";

export const metadata: Metadata = {
  title: "메뉴판 | 0zong의 방",
  description: "조주기능사 준비. 만들어 본 칵테일의 레시피와 실습 메모예요.",
};

export default function Page() {
  return <HobbyShell k="whisky"><BarPage /></HobbyShell>;
}
