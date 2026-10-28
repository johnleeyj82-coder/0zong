import type { Metadata } from "next";
import MovieBoard from "../components/movie/MovieBoard";

export const metadata: Metadata = {
  title: "영화 점수 | 0zong의 방",
  description: "여섯 가지 항목으로 매긴 영화 점수를 한 줄씩 펼쳐 보는 기록이에요.",
};

export default function MoviePage() {
  return <MovieBoard />;
}
