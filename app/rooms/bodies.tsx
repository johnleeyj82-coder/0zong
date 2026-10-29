"use client";
// Drawer bodies, one per room. All records here are examples until the owner replaces them.
// The movie body reads its records through lib/client (examples, labeled 예시, until the owner adds real ones).
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { RoomKey } from "../data";
import { getMovies } from "@/lib/client";
import { sortMovies, stars, summarize, type Movie as MovieRecord } from "@/lib/movies";
import { ScoreBar } from "../components/movie/ScoreBar";
import MusicRoom from "../components/music/MusicRoom";
import GameRoom from "../components/game/GameRoom";
import { PageLink } from "../components/PageLink";

const heat = Array.from({ length: 26 * 7 }, (_, i) => {
  const v = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
  return v > 0.82 ? 4 : v > 0.64 ? 3 : v > 0.45 ? 2 : v > 0.3 ? 1 : 0;
});

function Hack() {
  return (
    <>
      <div className="heat" role="img" aria-label="최근 26주 동안 문제를 푼 날의 기록">
        {heat.map((l, i) => <i key={i} className={l ? `l${l}` : undefined} />)}
      </div>
      <p className="hint">최근 26주 · 칸이 진할수록 많이 푼 날</p>
      <div className="chips"><span>pwn 34</span><span>crypto 18</span><span>web 6</span></div>
      <ul className="thread">
        <li><span className="meta">오늘 복습할 노트 · 3개</span>지난주 푼 문제들의 풀이 노트를 다시 볼 차례예요.</li>
        <li><span className="meta">pwn · 최근</span>보호 기법별로 묶어서 볼 수 있어요.</li>
      </ul>
    </>
  );
}
function Poker() {
  return (
    <ul className="modes">
      <li><b>튜토리얼</b><span>홀덤을 처음 해보는 사람을 위한 단계별 안내</span></li>
      <li><b>AI와 한 판</b><span>혼자 연습하기 · 레이즈 크기가 몇 BB인지 표시</span></li>
      <li><b>실시간 방</b><span>방장이 블라인드 50/100 설정 · 토너먼트 가능 · 5/8명</span></li>
    </ul>
  );
}
function Book() {
  return (
    <>
      <div className="chips"><span>종족은 어떻게 생겼나</span><span>대륙의 지도</span><span>주인공의 검</span><span>+ 질문 만들기</span></div>
      <ul className="thread">
        <li><span className="meta">룬의 아이들 · 종족은 어떻게 생겼나</span>정령족: 피부가 반쯤 투명하고 감정에 따라 내부의 빛 색이 바뀐다고 상상함. 이미지 2장.</li>
        <li><span className="meta">룬의 아이들 · 대륙의 지도</span>북쪽 설원과 남쪽 사막 사이에 거대한 협곡이 있다고 그려봄.</li>
      </ul>
    </>
  );
}
function Movie() {
  const [movies, setMovies] = useState<MovieRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void getMovies().then((r) => (r.ok ? setMovies(r.data) : setError(r.error))); }, []);
  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (!movies) return <p className="hint">불러오는 중…</p>;
  if (!movies.length) return <p className="hint">아직 점수를 매긴 영화가 없어요. 첫 영화를 기록하면 여기에 보여요.</p>;
  const sum = summarize(movies);
  return (
    <>
      <p className="mini-sum"><b>{sum.count}편</b>을 봤고, 평균 별점은 <b>{sum.avgStars.toFixed(1)}</b>이에요.</p>
      <ol className="mini-films">
        {sortMovies(movies, "total").slice(0, 5).map((m) => (
          <li key={m.id}>
            <span className="t"><span className="tt">{m.title}</span>{m.example && <em className="ex-tag">예시</em>}</span>
            <ScoreBar movie={m} compact />
            <span className="n">{stars(m).toFixed(1)}</span>
          </li>
        ))}
      </ol>
      <PageLink to="movie" className="btn-ghost mini-more">전체 점수 보기 <ArrowUpRight size={14} aria-hidden /></PageLink>
    </>
  );
}
function Bar() {
  return (
    <div className="recipe">
      <span className="glass" aria-hidden><i style={{ flex: 3, background: "#2a1a12" }} /><i style={{ flex: 2, background: "#b5492a" }} /><i style={{ flex: 2, background: "#e8c46a" }} /><i style={{ flex: 1, background: "#f1ece0" }} /></span>
      <div><b>B-52 · 플로트</b><span className="hint">커피 리큐어 → 크림 리큐어 → 오렌지 리큐어, 각 1/3 oz</span><p>지거로 양을 바꾸면 층 두께가 바뀝니다. 실습 기록 14개.</p></div>
    </div>
  );
}
function Chess() {
  return (
    <table className="dt"><thead><tr><th>이름</th><th>모드</th><th>최고 단계</th></tr></thead><tbody>
      <tr><td>지훈</td><td>가위바위보</td><td>7</td></tr>
      <tr><td>나</td><td>저격</td><td>5</td></tr>
    </tbody></table>
  );
}
function Tetris() {
  return (
    <table className="dt"><thead><tr><th>순위</th><th>이름</th><th>2분 · 지운 줄</th></tr></thead><tbody>
      <tr><td>1</td><td>민수</td><td>87</td></tr>
      <tr><td>2</td><td>하늘</td><td>81</td></tr>
      <tr><td>3</td><td>나</td><td>76</td></tr>
    </tbody></table>
  );
}
function Work({ items }: { items: [string, string][] }) {
  return <ul className="thread">{items.map(([m, t]) => <li key={m}><span className="meta">{m}</span>{t}</li>)}</ul>;
}

export function RoomBody({ k }: { k: RoomKey }) {
  switch (k) {
    case "game": return <GameRoom />;
    case "hack": return <Hack />;
    case "poker": return <Poker />;
    case "book": return <Book />;
    case "movie": return <Movie />;
    case "music": return <MusicRoom />;
    case "whisky": return <Bar />;
    case "chess": return <Chess />;
    case "tetris": return <Tetris />;
    case "video": return <Work items={[["「빗소리」 · 의도", "창밖 빗소리만으로 하루의 감정 변화를 보여주고 싶었어요."], ["배운 것", "소리를 먼저 깔고 컷을 맞추니 리듬이 살아났어요."], ["다음에 할 것", "한 컷으로 찍는 1분짜리 영상."]]} />;
    case "art": return <Work items={[["10.22 · 연습한 것", "손 드로잉 6장. 손가락 관절 비율."], ["배운 것", "손바닥을 먼저 상자로 잡으면 덜 무너져요."], ["다음에 할 것", "물건을 쥔 손 그리기."]]} />;
  }
}
