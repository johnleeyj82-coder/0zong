import { ROOMS } from "../data";
import { Reveal } from "./Reveal";

const FEED: { when: string; key: string; title: string; note: string }[] = [
  { when: "10.25 23:40", key: "movie", title: "『퍼펙트 데이즈』 4.5점", note: "반복되는 하루가 이렇게 다정할 수 있다니." },
  { when: "10.25 21:10", key: "game", title: "엘든링 +3시간 · 말레니아 클리어", note: "2페이즈 패턴은 왼쪽으로 크게 구르기." },
  { when: "10.25 14:02", key: "hack", title: "2문제 풀이 · 잔디 12일째", note: "지난주 노트 3개 복습 예정." },
  { when: "10.24 22:30", key: "book", title: "『룬의 아이들』 종족 메모", note: "정령족의 빛 색이 감정에 따라 바뀐다는 설정 추가." },
  { when: "10.23 01:15", key: "tetris", title: "민수 2분 87줄 신기록", note: "방명록 이름으로 기록됨." },
];

export default function NowSection() {
  return (
    <section className="section" aria-labelledby="now-h">
      <Reveal><span className="label">Lately · 예시 기록</span></Reveal>
      <Reveal index={1}><h2 id="now-h" className="display">요즘 이 방에서 일어난 일</h2></Reveal>
      <ul className="feed">
        {FEED.map((f, i) => {
          const room = ROOMS.find((r) => r.key === f.key)!;
          const Icon = room.icon;
          return (
            <Reveal as="li" key={f.when} index={i}>
              <span className="when">{f.when}</span>
              <span className="icon-ring" style={{ width: 32, height: 32 }} aria-label={room.label}><Icon size={15} aria-hidden /></span>
              <span className="what">{f.title}<small>{f.note}</small></span>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
