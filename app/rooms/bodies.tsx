// Drawer bodies, one per room. All records here are examples until the owner replaces them.
import type { RoomKey } from "../data";

const heat = Array.from({ length: 26 * 7 }, (_, i) => {
  const v = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
  return v > 0.82 ? 4 : v > 0.64 ? 3 : v > 0.45 ? 2 : v > 0.3 ? 1 : 0;
});

function Game() {
  return (
    <>
      <table className="dt"><thead><tr><th>게임</th><th>진행</th><th>플레이</th></tr></thead><tbody>
        <tr><td>엘든링</td><td>본편 엔딩 전</td><td>142h</td></tr>
        <tr><td>할로우 나이트</td><td>112%</td><td>61h</td></tr>
        <tr><td>발더스 게이트 3</td><td>2막</td><td>48h</td></tr>
      </tbody></table>
      <ul className="thread">
        <li><span className="meta">10.25 · 엘든링 · +3.0h</span>말레니아 클리어. 2페이즈 패턴은 왼쪽으로 크게 구르기.</li>
        <li><span className="meta">10.23 · 할로우 나이트 · +1.5h</span>눈물의 도시 비 내리는 구간 스크린샷 4장.</li>
        <li><span className="meta">10.20 · 엘든링 · +2.0h</span>공략 메모: 호수 남쪽 계단 아래 숨은 상인.</li>
      </ul>
    </>
  );
}
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
  return (
    <>
      <table className="dt"><thead><tr><th>영화</th><th>본 날</th><th>내 점수</th></tr></thead><tbody>
        <tr><td>퍼펙트 데이즈</td><td>10.25</td><td>4.5</td></tr>
        <tr><td>애프터썬</td><td>10.18</td><td>5.0</td></tr>
        <tr><td>듄: 파트 2</td><td>10.02</td><td>4.0</td></tr>
      </tbody></table>
      <p className="hint">보고 싶은 목록 12편 · 내 기준 0~5점</p>
    </>
  );
}
function Music() {
  return (
    <>
      <div className="now"><span className="disc" aria-hidden /><div><b>새벽 3시 로파이</b><span className="hint">직접 올린 파일 · 2:14 / 5:48</span><span className="bar"><i /></span></div></div>
      <ul className="thread">
        <li><span className="meta">효과음</span>오래된 CRT 켜지는 소리</li>
        <li><span className="meta">밈</span>요즘 단톡방에서 계속 쓰는 그 소리</li>
      </ul>
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
    case "game": return <Game />;
    case "hack": return <Hack />;
    case "poker": return <Poker />;
    case "book": return <Book />;
    case "movie": return <Movie />;
    case "music": return <Music />;
    case "whisky": return <Bar />;
    case "chess": return <Chess />;
    case "tetris": return <Tetris />;
    case "video": return <Work items={[["「빗소리」 · 의도", "창밖 빗소리만으로 하루의 감정 변화를 보여주고 싶었어요."], ["배운 것", "소리를 먼저 깔고 컷을 맞추니 리듬이 살아났어요."], ["다음에 할 것", "한 컷으로 찍는 1분짜리 영상."]]} />;
    case "art": return <Work items={[["10.22 · 연습한 것", "손 드로잉 6장. 손가락 관절 비율."], ["배운 것", "손바닥을 먼저 상자로 잡으면 덜 무너져요."], ["다음에 할 것", "물건을 쥔 손 그리기."]]} />;
  }
}
