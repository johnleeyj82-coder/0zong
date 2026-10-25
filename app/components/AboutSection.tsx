import { Reveal } from "./Reveal";

export default function AboutSection() {
  return (
    <section className="section two-col" aria-labelledby="about-h">
      <div>
        <Reveal><span className="label">About this room</span></Reveal>
        <Reveal index={1}><h2 id="about-h" className="display">취미도, 공부도, 전부 이 방에.</h2></Reveal>
        <Reveal index={2}>
          <p className="lede">
            노션에 적어두고 다시 안 보던 공부 기록, 게임하다 찍은 스크린샷, 책을 읽으며 혼자 상상한 세계,
            친구들과 겨룬 테트리스 기록까지. 흩어져 있던 것들을 한 공간에 모았어요. 불 켜진 물체를 따라가면
            그 취미의 기록이 나옵니다.
          </p>
        </Reveal>
      </div>
      <Reveal index={2}>
        <img className="frame-img" src="frames/frame_0110.jpg" alt="포커 테이블과 듀얼 모니터 책상이 보이는 방 안" loading="lazy" />
      </Reveal>
    </section>
  );
}
